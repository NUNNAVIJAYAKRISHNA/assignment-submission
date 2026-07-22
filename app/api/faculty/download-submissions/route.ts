import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/userModel";
import Submission from "../../../../models/submissionModel";
import { getUserSession } from "../../../../lib/auth";
import { createZip } from "../../../../utils/zip";

interface FileEntry {
  name: string;
  content: string | Uint8Array;
}

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

async function fetchSubmissionFile(
  studentName: string,
  rollNumber: string,
  url: string
): Promise<FileEntry> {
  const cleanedStudentName = studentName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanedRollNumber = rollNumber.replace(/[^a-zA-Z0-9_-]/g, "_");

  let targetUrl = url;

  // Check if it's a Google Drive or Docs link
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    const driveUrl = getGoogleDriveDownloadUrl(url);
    if (driveUrl) {
      targetUrl = driveUrl;
    }
  }

  try {
    const controller = new AbortController();
    // Set a timeout of 15 seconds to prevent hanging the API
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const contentType = res.headers.get("content-type") || "";
    
    // If it returns HTML (and is not a direct file), fall back to a shortcut link
    if (contentType.includes("text/html") || url.includes("youtube.com") || url.includes("youtu.be")) {
      return {
        name: `${cleanedRollNumber}_${cleanedStudentName}_submission.url`,
        content: `[InternetShortcut]\r\nURL=${url}\r\n`
      };
    }

    // Guess file extension by trying multiple strategies
    let extension = "bin";

    // 1. Try to guess from Content-Disposition header (most reliable for original names)
    const contentDisposition = res.headers.get("content-disposition") || "";
    let filenameFromHeader = "";
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
      if (filenameMatch && filenameMatch[1]) {
        filenameFromHeader = decodeURIComponent(filenameMatch[1]);
      }
    }

    if (filenameFromHeader) {
      const lastDot = filenameFromHeader.lastIndexOf(".");
      if (lastDot !== -1 && filenameFromHeader.length - lastDot <= 10) {
        extension = filenameFromHeader.substring(lastDot + 1).toLowerCase();
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
          const urlPath = new URL(url).pathname;
          const lastDot = urlPath.lastIndexOf(".");
          if (lastDot !== -1 && urlPath.length - lastDot <= 6) {
            extension = urlPath.substring(lastDot + 1).toLowerCase();
          }
        } catch (_) {}
      }
    }

    const arrayBuffer = await res.arrayBuffer();
    return {
      name: `${cleanedRollNumber}_${cleanedStudentName}_submission.${extension}`,
      content: new Uint8Array(arrayBuffer)
    };

  } catch (err) {
    console.error(`Failed to download submission from ${url}:`, err);
    // On download failure, fall back to a shortcut link so the faculty still has the submission URL
    return {
      name: `${cleanedRollNumber}_${cleanedStudentName}_submission.url`,
      content: `[InternetShortcut]\r\nURL=${url}\r\n`
    };
  }
}

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
      (t) => t.year === year && t.section === section && (!subject || t.subject.toLowerCase() === subject.toLowerCase())
    );

    if (!matchedTeaching) {
      return NextResponse.json({ success: false, message: "You do not teach this class" }, { status: 403 });
    }

    // Fetch all submissions for this class section & subject
    const submissions = await Submission.find({
      facultyId: user._id,
      studentYear: year,
      studentSection: section,
      subject: matchedTeaching.subject
    });

    if (submissions.length === 0) {
      return NextResponse.json({ success: false, message: "No submissions found for this class section." }, { status: 404 });
    }

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

    // Prepare files list for ZIP by fetching submission links concurrently
    const filePromises = submissions.map((sub) =>
      fetchSubmissionFile(sub.studentName, sub.studentRollNumber || "N/A", sub.videoUrl)
    );
    const files: FileEntry[] = await Promise.all(filePromises);

    // Create summary.txt
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

    files.push({ name: "summary.txt", content: summaryText });

    // Generate ZIP buffer
    const zipBuffer = createZip(files);

    const safeSubject = matchedTeaching.subject.replace(/[^a-zA-Z0-9_-]/g, "_");
    const zipName = `submissions_Y${year}_Sec${section}_${safeSubject}.zip`;

    return new Response(Buffer.from(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
        "Content-Length": zipBuffer.length.toString()
      }
    });

  } catch (error: any) {
    console.error("Download submissions ZIP API error:", error);
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}
