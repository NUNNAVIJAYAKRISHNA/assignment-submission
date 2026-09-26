import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import Submission from "../../../../models/submissionModel";
import { getUserSession } from "../../../../lib/auth";
import { ZipStreamBuilder } from "../../../../utils/zip";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ─── Constants ──────────────────────────────────────────────────────────────────

/** Files smaller than this threshold are buffered in memory; larger ones are streamed */
const BUFFER_SIZE_THRESHOLD = 20 * 1024 * 1024; // 20 MB

/** Per-file timeout for the initial HTTP response (not the full stream transfer) */
const FILE_FETCH_TIMEOUT_MS = 30_000; // 30 seconds

/** Stop adding new files after this elapsed time on Vercel to leave room for ZIP finalization */
const IS_VERCEL = process.env.VERCEL === "1";
const MAX_SAFE_RUNTIME_MS = IS_VERCEL ? 54_000 : Infinity; // Infinity on localhost / standalone node

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// ─── Types ──────────────────────────────────────────────────────────────────────

type FailureReason =
  | "HTTP_ERROR"
  | "GOOGLE_AUTH_REQUIRED"
  | "GOOGLE_CONFIRMATION_FAILED"
  | "YOUTUBE_LINK"
  | "TIMEOUT"
  | "MALFORMED_URL"
  | "UNEXPECTED_HTML"
  | "FETCH_ERROR";

type ResolvedSubmission =
  | { kind: "buffered"; name: string; content: Uint8Array }
  | { kind: "stream"; name: string; stream: ReadableStream<Uint8Array> }
  | { kind: "fallback"; name: string; content: string };

// ─── Google Drive helpers ───────────────────────────────────────────────────────

function getGoogleDriveDownloadUrl(url: string): string | null {
  // Google Docs
  const docMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docMatch && docMatch[1]) {
    return `https://docs.google.com/document/d/${docMatch[1]}/export?format=docx`;
  }

  // Google Sheets
  const sheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetMatch && sheetMatch[1]) {
    return `https://docs.google.com/spreadsheets/d/${sheetMatch[1]}/export?format=xlsx`;
  }

  // Google Slides
  const slideMatch = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (slideMatch && slideMatch[1]) {
    return `https://docs.google.com/presentation/d/${slideMatch[1]}/export?format=pptx`;
  }

  // Google Drive files
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}&confirm=t`;
  }
  return null;
}

/** Extract Google Drive file ID from various URL formats */
function extractGDriveFileId(url: string): string | null {
  const match =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/** Check if HTML content is a Google login/authentication page */
function isGoogleLoginPage(html: string): boolean {
  return (
    html.includes("accounts.google.com") ||
    html.includes("ServiceLogin") ||
    html.includes("signin/identifier")
  );
}

/**
 * Attempt to resolve a Google Drive virus-scan confirmation page into the actual file download.
 *
 * When Google Drive serves a large file, the initial response is an HTML page
 * containing a virus-scan warning and a confirmation link/form. This function
 * extracts the real download URL from that HTML and fetches the actual file.
 *
 * Tries multiple strategies in order:
 *   1. Extract form action URL pointing to drive.usercontent.google.com
 *   2. Extract href links to the usercontent download endpoint
 *   3. Find any confirm token in the HTML and construct a URL
 *   4. Try the direct usercontent endpoint with confirm=t
 *
 * Returns the successful Response if one candidate works, or null if all fail.
 */
async function resolveGDriveConfirmation(
  html: string,
  fileId: string,
  signal: AbortSignal
): Promise<Response | null> {
  const candidates: string[] = [];

  // Strategy 1: Form action URL (most common in virus scan warning pages)
  const formActionMatch = html.match(
    /action="(https?:\/\/drive\.usercontent\.google\.com\/download[^"]*)"/i
  );
  if (formActionMatch) {
    candidates.push(formActionMatch[1].replace(/&amp;/g, "&"));
  }

  // Strategy 2: Href links to usercontent download
  const hrefMatch = html.match(
    /href="(https?:\/\/drive\.usercontent\.google\.com\/download[^"]*)"/i
  );
  if (hrefMatch) {
    candidates.push(hrefMatch[1].replace(/&amp;/g, "&"));
  }

  // Strategy 3: Find any confirm token and build URL
  const confirmMatch = html.match(/confirm=([a-zA-Z0-9_-]+)/);
  if (confirmMatch) {
    candidates.push(
      `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirmMatch[1]}`
    );
  }

  // Strategy 4: Direct usercontent endpoint with confirm=t
  candidates.push(
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`
  );

  // Deduplicate while preserving order
  const uniqueCandidates = Array.from(new Set(candidates));

  for (const candidateUrl of uniqueCandidates) {
    try {
      const res = await fetch(candidateUrl, {
        signal,
        redirect: "follow",
        headers: { "User-Agent": USER_AGENT },
      });

      if (!res.ok) continue;

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("text/html")) {
        // Got actual file content — this is the real download
        return res;
      }
      // Still HTML, try next candidate
    } catch {
      // Network error or abort — try next candidate
      continue;
    }
  }

  return null;
}

// ─── File extension detection ───────────────────────────────────────────────────

/**
 * Determine file extension from HTTP response headers and the original URL.
 * Uses three strategies in order of reliability:
 *   1. Content-Disposition header filename
 *   2. Content-Type MIME mapping
 *   3. URL path extension
 */
function determineFileExtension(
  contentType: string,
  contentDisposition: string,
  originalUrl: string
): string {
  let extension = "bin";

  // 1. Try to guess from Content-Disposition header (most reliable for original names)
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
    if (filenameMatch && filenameMatch[1]) {
      const filenameFromHeader = decodeURIComponent(filenameMatch[1]);
      const lastDot = filenameFromHeader.lastIndexOf(".");
      if (lastDot !== -1 && filenameFromHeader.length - lastDot <= 10) {
        extension = filenameFromHeader.substring(lastDot + 1).toLowerCase();
      }
    }
  }

  // 2. Fallback to guessing from Content-Type if header guess is missing or generic
  if (extension === "bin") {
    if (contentType.includes("video/mp4")) extension = "mp4";
    else if (contentType.includes("video/quicktime")) extension = "mov";
    else if (contentType.includes("video/x-matroska")) extension = "mkv";
    else if (contentType.includes("application/pdf") || contentType.includes("application/x-pdf") || contentType.includes("text/pdf")) extension = "pdf";
    else if (contentType.includes("application/vnd.openxmlformats-officedocument.presentationml.presentation")) extension = "pptx";
    else if (contentType.includes("application/vnd.ms-powerpoint")) extension = "ppt";
    else if (contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) extension = "docx";
    else if (contentType.includes("application/msword")) extension = "doc";
    else if (contentType.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) extension = "xlsx";
    else if (contentType.includes("application/vnd.ms-excel")) extension = "xls";
    else if (contentType.includes("image/")) {
      const imgExt = contentType.split("/")[1];
      extension = imgExt ? imgExt.split(";")[0] : "png";
    } else {
      // 3. Fallback to guessing from the URL path
      try {
        const urlPath = new URL(originalUrl).pathname;
        const lastDot = urlPath.lastIndexOf(".");
        if (lastDot !== -1 && urlPath.length - lastDot <= 6) {
          extension = urlPath.substring(lastDot + 1).toLowerCase();
        }
      } catch (_) {}
    }
  }

  return extension;
}

// ─── Submission resolution ──────────────────────────────────────────────────────

/** Create a .url shortcut fallback entry with categorized logging */
function createFallback(
  baseFilename: string,
  originalUrl: string,
  reason: FailureReason,
  rollNumber: string
): ResolvedSubmission {
  console.warn(`[ZIP] Fallback to .url for ${rollNumber} | reason=${reason} | url=${originalUrl}`);
  return {
    kind: "fallback",
    name: `${baseFilename}.url`,
    content: `[InternetShortcut]\r\nURL=${originalUrl}\r\n`,
  };
}

/**
 * Resolve a submission URL into either a buffered file, a readable stream, or a .url fallback.
 *
 * Decision matrix:
 *   - YouTube links                  → .url shortcut (always)
 *   - Google Docs/Sheets/Slides      → export as DOCX/XLSX/PPTX (typically small, buffered)
 *   - Google Drive files             → download with virus-scan confirmation resolution
 *   - Direct URLs                    → fetch directly
 *
 * Size-based routing:
 *   - Content-Length < BUFFER_SIZE_THRESHOLD → buffer into Uint8Array
 *   - Content-Length ≥ threshold or unknown  → stream via response.body
 *
 * This function never calls arrayBuffer() on a large file, eliminating the
 * O(file_size) memory allocation that was the root cause of RAM exhaustion.
 */
async function resolveSubmission(
  studentName: string,
  rollNumber: string,
  url: string
): Promise<ResolvedSubmission> {
  const cleanedStudentName = studentName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanedRollNumber = rollNumber.replace(/[^a-zA-Z0-9_-]/g, "_");
  const baseFilename = `${cleanedRollNumber}_${cleanedStudentName}_submission`;

  // ── YouTube → always .url shortcut ────────────────────────────────────
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return createFallback(baseFilename, url, "YOUTUBE_LINK", cleanedRollNumber);
  }

  // ── Resolve target URL ────────────────────────────────────────────────
  let targetUrl = url;
  let isGoogleDriveFile = false;
  let fileId: string | null = null;

  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    const driveUrl = getGoogleDriveDownloadUrl(url);
    if (driveUrl) {
      targetUrl = driveUrl;
    }
    fileId = extractGDriveFileId(url);
    // Regular Drive file (not Docs/Sheets/Slides export)
    isGoogleDriveFile =
      !!fileId &&
      !url.includes("/document/d/") &&
      !url.includes("/spreadsheets/d/") &&
      !url.includes("/presentation/d/");
  }

  // ── Fetch the file ────────────────────────────────────────────────────
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), FILE_FETCH_TIMEOUT_MS);

  try {
    let res = await fetch(targetUrl, {
      signal: abortController.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) {
      console.error(`[ZIP] HTTP ${res.status} for ${cleanedRollNumber} | url=${url}`);
      return createFallback(baseFilename, url, "HTTP_ERROR", cleanedRollNumber);
    }

    const contentType = res.headers.get("content-type") || "";

    // ── Handle HTML responses ─────────────────────────────────────────
    if (contentType.includes("text/html")) {
      if (isGoogleDriveFile && fileId) {
        // Likely a Google Drive virus-scan confirmation page — attempt to resolve
        console.log(
          `[ZIP] HTML response for Drive file ${cleanedRollNumber}, attempting confirmation resolution`
        );
        const html = await res.text();

        if (isGoogleLoginPage(html)) {
          return createFallback(baseFilename, url, "GOOGLE_AUTH_REQUIRED", cleanedRollNumber);
        }

        const resolvedRes = await resolveGDriveConfirmation(
          html,
          fileId,
          abortController.signal
        );

        if (resolvedRes) {
          // Successfully resolved — continue with the actual file response
          res = resolvedRes;
        } else {
          return createFallback(
            baseFilename,
            url,
            "GOOGLE_CONFIRMATION_FAILED",
            cleanedRollNumber
          );
        }
      } else {
        // Non-Drive URL returning HTML, or Docs/Sheets/Slides export failing
        return createFallback(baseFilename, url, "UNEXPECTED_HTML", cleanedRollNumber);
      }
    }

    // ── Determine file extension ────────────────────────────────────────
    const finalContentType = res.headers.get("content-type") || "";
    const contentDisposition = res.headers.get("content-disposition") || "";
    const extension = determineFileExtension(finalContentType, contentDisposition, url);
    const fileName = `${baseFilename}.${extension}`;

    // ── Decide: buffer vs. stream based on Content-Length ────────────────
    const contentLengthStr = res.headers.get("content-length");
    const contentLength =
      contentLengthStr ? parseInt(contentLengthStr, 10) : null;

    if (
      contentLength !== null &&
      !isNaN(contentLength) &&
      contentLength < BUFFER_SIZE_THRESHOLD
    ) {
      // Small file → safe to buffer in memory
      console.log(
        `[ZIP] Buffering ${cleanedRollNumber} (${(contentLength / 1024).toFixed(0)} KB, .${extension})`
      );
      const arrayBuffer = await res.arrayBuffer();
      return {
        kind: "buffered",
        name: fileName,
        content: new Uint8Array(arrayBuffer),
      };
    } else {
      // Large file or unknown size → stream to avoid O(file_size) allocation
      const sizeInfo =
        contentLength !== null && !isNaN(contentLength)
          ? `${(contentLength / (1024 * 1024)).toFixed(1)} MB`
          : "unknown size";
      console.log(
        `[ZIP] Streaming ${cleanedRollNumber} (${sizeInfo}, .${extension})`
      );

      if (!res.body) {
        // Rare edge case: no body stream available — fall back to buffering
        console.warn(
          `[ZIP] No response body stream for ${cleanedRollNumber}, falling back to buffer`
        );
        const arrayBuffer = await res.arrayBuffer();
        return {
          kind: "buffered",
          name: fileName,
          content: new Uint8Array(arrayBuffer),
        };
      }

      return { kind: "stream", name: fileName, stream: res.body };
    }
  } catch (err: any) {
    // ── Categorized error handling ──────────────────────────────────────
    if (err.name === "AbortError") {
      return createFallback(baseFilename, url, "TIMEOUT", cleanedRollNumber);
    }
    if (err.name === "TypeError" && err.message?.includes("URL")) {
      console.error(
        `[ZIP] Malformed URL for ${cleanedRollNumber}: ${url}`
      );
      return createFallback(baseFilename, url, "MALFORMED_URL", cleanedRollNumber);
    }
    console.error(
      `[ZIP] Fetch error for ${cleanedRollNumber} | url=${url}:`,
      err.message || err
    );
    return createFallback(baseFilename, url, "FETCH_ERROR", cleanedRollNumber);
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Route handler ──────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUserSession();
    
    if (!user || user.role !== "faculty") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const yearStr = searchParams.get("year");
    const section = searchParams.get("section");
    const subject = searchParams.get("subject");
    const format = searchParams.get("format");

    if (!yearStr || !section) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year)) {
      return NextResponse.json({ success: false, message: "Invalid year format" }, { status: 400 });
    }

    // Verify this class is indeed taught by this faculty member
    const matchedTeaching = user.teaching?.find(
      (t: any) => t.year === year && t.section === section && (!subject || t.subject.toLowerCase() === subject.toLowerCase())
    );

    if (!matchedTeaching) {
      return NextResponse.json({ success: false, message: "You do not teach this class" }, { status: 403 });
    }

    // Allow querying submission count / info before starting batch downloads
    if (searchParams.get("action") === "count" || searchParams.get("action") === "meta") {
      const totalCount = await Submission.countDocuments({
        facultyId: user._id,
        studentYear: year,
        studentSection: section,
        subject: matchedTeaching.subject
      });
      return NextResponse.json({
        success: true,
        total: totalCount,
        subject: matchedTeaching.subject,
        year,
        section
      });
    }

    // Pagination / batch parameters
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset") || searchParams.get("skip");
    const batchPart = searchParams.get("part");

    // Fetch all submissions for this class section & subject
    let query = Submission.find({
      facultyId: user._id,
      studentYear: year,
      studentSection: section,
      subject: matchedTeaching.subject
    }).sort({ studentRollNumber: 1 });

    const totalAvailable = await Submission.countDocuments({
      facultyId: user._id,
      studentYear: year,
      studentSection: section,
      subject: matchedTeaching.subject
    });

    if (totalAvailable === 0) {
      return NextResponse.json({ success: false, message: "No submissions found for this class section." }, { status: 404 });
    }

    let skipNum = 0;
    if (offsetParam) {
      const parsedSkip = parseInt(offsetParam, 10);
      if (!isNaN(parsedSkip) && parsedSkip > 0) {
        skipNum = parsedSkip;
        query = query.skip(skipNum);
      }
    }

    let limitNum = totalAvailable;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limitNum = parsedLimit;
        query = query.limit(limitNum);
      }
    }

    const submissions = await query.exec();

    // Export submissions as an Excel-compatible CSV sheet
    if (format === "excel" || format === "csv") {
      const escapeCSV = (val: string) => {
        if (!val) return '""';
        return `"${val.replace(/"/g, '""')}"`;
      };

      let csvContent = "\uFEFF"; // UTF-8 Byte Order Mark for Excel
      csvContent += "Roll Number,Student Name,Subject,Assignment Title,Submission Link,Submitted On,Description\n";

      submissions.forEach((sub) => {
        csvContent += `${escapeCSV(sub.studentRollNumber || "N/A")},`;
        csvContent += `${escapeCSV(sub.studentName)},`;
        csvContent += `${escapeCSV(sub.subject)},`;
        csvContent += `${escapeCSV(sub.title)},`;
        csvContent += `${escapeCSV(sub.videoUrl)},`;
        csvContent += `${escapeCSV(sub.createdAt.toLocaleString())},`;
        csvContent += `${escapeCSV(sub.description || "")}\n`;
      });

      const safeSubject = matchedTeaching.subject.replace(/[^a-zA-Z0-9_-]/g, "_");
      const csvName = `submissions_Y${year}_Sec${section}_${safeSubject}_links.csv`;

      return new Response(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${csvName}"`,
        },
      });
    }

    // Prepare summary.txt
    let summaryText = `Submissions Summary\n`;
    summaryText += `===================\n`;
    summaryText += `Faculty: ${user.fullname}\n`;
    summaryText += `Class: Year ${year} - Section ${section}\n`;
    summaryText += `Subject: ${matchedTeaching.subject}\n`;
    summaryText += `Generated on: ${new Date().toLocaleString()}\n`;
    summaryText += `Total Submissions: ${submissions.length}\n\n`;

    submissions.forEach((sub, idx) => {
      summaryText += `${idx + 1}. Student: ${sub.studentName} (${sub.studentRollNumber})\n`;
      summaryText += `   Title: ${sub.title}\n`;
      summaryText += `   Video Link: ${sub.videoUrl}\n`;
      summaryText += `   Submitted on: ${sub.createdAt.toLocaleString()}\n`;
      if (sub.description) {
        summaryText += `   Description: ${sub.description}\n`;
      }
      summaryText += `-------------------\n`;
    });

    const safeSubject = matchedTeaching.subject.replace(/[^a-zA-Z0-9_-]/g, "_");
    const partSuffix = batchPart ? `_Part${batchPart}` : (limitParam ? `_Batch_${skipNum + 1}_to_${skipNum + submissions.length}` : "");
    const zipName = `submissions_Y${year}_Sec${section}_${safeSubject}${partSuffix}.zip`;

    // ── Stream the ZIP response ─────────────────────────────────────────
    // Files are processed sequentially (CONCURRENCY = 1) to minimize memory.
    // Small files are buffered; large files stream directly from Google Drive
    // into the ZIP output via data descriptors. Only ~64 KB of file data is
    // in memory at any time for streamed files.
    const functionStartTime = Date.now();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const zipBuilder = new ZipStreamBuilder(controller);
        let processedCount = 0;
        let skippedCount = 0;

        try {
          // Process each submission sequentially to minimize peak memory
          for (const sub of submissions) {
            // Check if we're approaching the Vercel Hobby execution limit
            const elapsed = Date.now() - functionStartTime;
            if (elapsed > MAX_SAFE_RUNTIME_MS) {
              skippedCount = submissions.length - processedCount;
              console.warn(
                `[ZIP] Approaching execution limit (${elapsed}ms elapsed), ` +
                `skipping remaining ${skippedCount} submission(s)`
              );
              break;
            }

            try {
              const result = await resolveSubmission(
                sub.studentName,
                sub.studentRollNumber || "N/A",
                sub.videoUrl
              );

              switch (result.kind) {
                case "buffered":
                  zipBuilder.addFile(result.name, result.content);
                  break;
                case "stream":
                  await zipBuilder.addFileStream(result.name, result.stream);
                  break;
                case "fallback":
                  zipBuilder.addFile(result.name, result.content);
                  break;
              }
            } catch (fileErr) {
              console.error(`[ZIP] Unhandled error for ${sub.studentName}:`, fileErr);
              const cleanedStudentName = sub.studentName.replace(/[^a-zA-Z0-9_-]/g, "_");
              const cleanedRollNumber = (sub.studentRollNumber || "N/A").replace(/[^a-zA-Z0-9_-]/g, "_");
              zipBuilder.addFile(
                `${cleanedRollNumber}_${cleanedStudentName}_submission.url`,
                `[InternetShortcut]\r\nURL=${sub.videoUrl}\r\n`
              );
            }

            processedCount++;
          }

          // If some submissions were skipped due to execution time limit, add a notice
          if (skippedCount > 0) {
            zipBuilder.addFile(
              "_INCOMPLETE_DOWNLOAD.txt",
              `WARNING: ${skippedCount} of ${submissions.length} submission(s) were skipped ` +
              `because the server reached its execution time limit (${maxDuration}s on Vercel Hobby).\n\n` +
              `To get all submission links, use the "Export Links (Excel)" option instead.\n` +
              `You can also try downloading again — the order may vary and different files may succeed.\n`
            );
          }

          // Add summary.txt
          zipBuilder.addFile("summary.txt", summaryText);

          // Finalize ZIP archive (writes central directory + EOCD and closes stream)
          zipBuilder.finalize();
        } catch (streamErr) {
          console.error("[ZIP] Critical error in ZIP stream generation:", streamErr);
          try {
            controller.error(streamErr);
          } catch (_) {}
        }
      }
    });

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "application/zip");
    responseHeaders.set("Content-Disposition", `attachment; filename="${zipName}"`);
    responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
    responseHeaders.set("X-Total-Submissions", totalAvailable.toString());
    responseHeaders.set("X-Batch-Processed", submissions.length.toString());
    responseHeaders.set("X-Batch-Offset", skipNum.toString());
    responseHeaders.set("Access-Control-Expose-Headers", "X-Total-Submissions, X-Batch-Processed, X-Batch-Offset, Content-Disposition");

    return new Response(stream, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Download submissions ZIP API error:", error);
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}
