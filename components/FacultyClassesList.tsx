"use client";

import { useState } from "react";

interface Student {
  _id: string;
  fullname: string;
  rollNumber: string;
  branch?: string;
  submission?: {
    title: string;
    videoUrl: string;
    createdAt: string;
  } | null;
}

interface ClassItem {
  year: number;
  section: string;
  subject: string;
  branch?: string;
  assignmentsEnabled: boolean;
  students: Student[];
}

export default function FacultyClassesList({ classes }: { classes: ClassItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, boolean>>(() => {
    const initialMap: Record<string, boolean> = {};
    classes.forEach((cls) => {
      initialMap[`${cls.year}-${cls.section}-${cls.subject}`] = !!cls.assignmentsEnabled;
    });
    return initialMap;
  });

  const [downloadModal, setDownloadModal] = useState<{
    isOpen: boolean;
    cls: ClassItem | null;
    total: number;
    batchSize: number;
    totalParts: number;
    currentPart: number;
    status: "idle" | "fetching-info" | "downloading" | "completed" | "error" | "cancelled";
    errorMessage?: string;
  }>({
    isOpen: false,
    cls: null,
    total: 0,
    batchSize: 8,
    totalParts: 1,
    currentPart: 0,
    status: "idle",
  });

  const abortDownloadRef = { current: false };

  const startAutoDownload = async (cls: ClassItem) => {
    abortDownloadRef.current = false;
    setDownloadModal({
      isOpen: true,
      cls,
      total: 0,
      batchSize: 8,
      totalParts: 1,
      currentPart: 0,
      status: "fetching-info",
    });

    try {
      // 1. Fetch total submission count for this class
      const metaRes = await fetch(
        `/api/faculty/download-submissions?year=${cls.year}&section=${cls.section}&subject=${encodeURIComponent(
          cls.subject
        )}&action=meta`
      );
      const metaData = await metaRes.json();

      if (!metaRes.ok || !metaData.success || !metaData.total) {
        throw new Error(metaData.message || "No submissions found to download.");
      }

      const totalCount = metaData.total;
      // Use 8 submissions per batch to stay comfortably within Vercel's 60s limit
      const BATCH_SIZE = 8;
      const calculatedParts = Math.ceil(totalCount / BATCH_SIZE);

      setDownloadModal((prev) => ({
        ...prev,
        total: totalCount,
        batchSize: BATCH_SIZE,
        totalParts: calculatedParts,
        currentPart: 1,
        status: "downloading",
      }));

      // 2. Loop through all batches sequentially
      for (let part = 1; part <= calculatedParts; part++) {
        if (abortDownloadRef.current) {
          setDownloadModal((prev) => ({ ...prev, status: "cancelled" }));
          return;
        }

        setDownloadModal((prev) => ({
          ...prev,
          currentPart: part,
          status: "downloading",
        }));

        const offset = (part - 1) * BATCH_SIZE;
        const downloadUrl = `/api/faculty/download-submissions?year=${cls.year}&section=${cls.section}&subject=${encodeURIComponent(
          cls.subject
        )}&offset=${offset}&limit=${BATCH_SIZE}&part=${part}_of_${calculatedParts}`;

        // Fetch the file as a blob so we know exactly when it finishes before initiating the next part
        const fileRes = await fetch(downloadUrl);
        if (!fileRes.ok) {
          throw new Error(`Part ${part} failed with status ${fileRes.status}`);
        }

        const blob = await fileRes.blob();
        if (abortDownloadRef.current) {
          setDownloadModal((prev) => ({ ...prev, status: "cancelled" }));
          return;
        }

        // Trigger browser download via object URL
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        
        // Extract filename from Content-Disposition header if available
        const cdHeader = fileRes.headers.get("Content-Disposition");
        let filename = `submissions_Y${cls.year}_Sec${cls.section}_${cls.subject.replace(/[^a-zA-Z0-9_-]/g, "_")}_Part${part}_of_${calculatedParts}.zip`;
        if (cdHeader) {
          const match = cdHeader.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
          if (match && match[1]) {
            filename = decodeURIComponent(match[1]);
          }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);

        // Small pause between parts
        await new Promise((r) => setTimeout(r, 1200));
      }

      setDownloadModal((prev) => ({
        ...prev,
        status: "completed",
      }));
    } catch (err: any) {
      console.error("[Auto-Download Error]", err);
      setDownloadModal((prev) => ({
        ...prev,
        status: "error",
        errorMessage: err.message || "Failed to download submissions.",
      }));
    }
  };

  const toggleClass = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const handleToggleAssignments = async (year: number, section: string, subject: string, enabled: boolean) => {
    const key = `${year}-${section}-${subject}`;
    setToggling(key);

    // Optimistic UI Update
    setAssignmentsMap((prev) => ({ ...prev, [key]: enabled }));

    try {
      const res = await fetch("/api/faculty/assignments-toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ year, section, subject, enabled }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle assignments");
      }
    } catch (err) {
      console.error(err);
      // Rollback on error
      setAssignmentsMap((prev) => ({ ...prev, [key]: !enabled }));
      alert("Failed to update assignments setting. Please try again.");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-4">
      {classes.map((cls, idx) => {
        const isOpen = openIndex === idx;

        return (
          <div
            key={`${cls.year}-${cls.section}-${cls.subject}`}
            className="border border-slate-100 bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
          >
            {/* Accordion Header */}
            <div
              className="flex items-center justify-between p-5 bg-slate-50/50 hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors duration-200 select-none"
              onClick={() => toggleClass(idx)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-sm">
                  Y{cls.year}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Year {cls.year} — Section {cls.section}{cls.branch ? ` — Branch ${cls.branch}` : ""} — <span className="text-indigo-600">{cls.subject}</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Student Directory{cls.branch ? ` • ${cls.branch}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {/* Enable Assignments Toggle */}
                {(() => {
                  const key = `${cls.year}-${cls.section}-${cls.subject}`;
                  const isEnabled = !!assignmentsMap[key];
                  const isToggling = toggling === key;
                  return (
                    <div
                      className="flex items-center space-x-2 bg-slate-100/50 hover:bg-slate-100 px-3 py-1.5 rounded-2xl transition-colors duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs font-bold text-slate-600 select-none">Enable</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isEnabled}
                        onClick={() => handleToggleAssignments(cls.year, cls.section, cls.subject, !isEnabled)}
                        disabled={isToggling}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? "bg-indigo-600" : "bg-slate-300"
                        } ${isToggling ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })()}

                {/* Download Submissions as Excel (CSV) button */}
                {cls.students.some((s) => !!s.submission) ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/api/faculty/download-submissions?year=${cls.year}&section=${cls.section}&subject=${encodeURIComponent(cls.subject)}&format=excel`;
                    }}
                    className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 shadow-sm hover:shadow active:scale-[0.97] hover:scale-[1.02] transform transition-all duration-200 select-none mr-1"
                    title="Export all student submission links as an Excel sheet (CSV)"
                  >
                    <svg
                      className="h-3.5 w-3.5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export Links (Excel)
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 cursor-not-allowed select-none opacity-60 mr-1"
                    title="No student submissions available for export"
                  >
                    <svg
                      className="h-3.5 w-3.5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Export Links (Excel)
                  </button>
                )}

                {/* Download Submissions as ZIP button */}
                {cls.students.some((s) => !!s.submission) ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startAutoDownload(cls);
                    }}
                    className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 shadow-sm hover:shadow active:scale-[0.97] hover:scale-[1.02] transform transition-all duration-200 select-none"
                    title="Download all student submissions as ZIP archives (automated batching)"
                  >
                    <svg
                      className="h-3.5 w-3.5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download ZIP
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 cursor-not-allowed select-none opacity-60"
                    title="No student submissions available for download"
                  >
                    <svg
                      className="h-3.5 w-3.5 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download ZIP
                  </button>
                )}

                {/* Remove Class Button */}
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (
                      confirm(
                        `Are you sure you want to remove the class: Year ${cls.year} - Section ${cls.section}${cls.branch ? ` - Branch ${cls.branch}` : ""} - ${cls.subject}?\n\nThis will remove it from your dashboard but submissions remain stored.`
                      )
                    ) {
                      try {
                        const res = await fetch("/api/faculty/classes", {
                          method: "DELETE",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            year: cls.year,
                            section: cls.section,
                            subject: cls.subject,
                            branch: cls.branch,
                          }),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                          throw new Error(data.message || "Failed to remove class");
                        }
                        window.location.reload();
                      } catch (err: any) {
                        alert(err.message || "Failed to remove class. Please try again.");
                      }
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 shadow-sm active:scale-[0.97] transition-all duration-200 select-none"
                  title="Remove class"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </button>

                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                  {cls.students.length} students
                </span>
                <svg
                  className={`h-5 w-5 text-slate-400 transform transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Accordion Body */}
            {isOpen && (
              <div className="transition-all duration-300">
                {cls.students.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    No students registered in this section yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                    {cls.students.map((student) => (
                      <div
                        key={student._id}
                        className="flex items-center justify-between p-4 sm:px-6 hover:bg-slate-50/40 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 flex items-center justify-center text-xs font-bold shadow-inner">
                            {student.fullname.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-800">{student.fullname}</span>
                            <span className="text-xs text-slate-400 block sm:inline sm:ml-3">
                              Reg No: <strong className="text-slate-600 font-medium">{student.rollNumber}</strong>
                            </span>
                            {student.branch && (
                              <span className="text-xs text-slate-400 block sm:inline sm:ml-3">
                                Branch: <strong className="text-slate-600 font-medium">{student.branch}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {student.submission ? (
                            <>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm animate-pulse">
                                Submitted
                              </span>
                              <a
                                href={student.submission.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors duration-200"
                              >
                                <svg
                                  className="h-3.5 w-3.5 mr-1"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                                View Submission
                              </a>
                            </>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 shadow-inner">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* --- AUTOMATED BATCH DOWNLOAD PROGRESS MODAL --- */}
      {downloadModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 max-w-md w-full relative overflow-hidden transition-all duration-300">
            {/* Top gradient accent */}
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600"></div>

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {downloadModal.status === "completed" ? (
                    <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : downloadModal.status === "error" ? (
                    <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {downloadModal.status === "completed"
                      ? "Download Complete"
                      : downloadModal.status === "error"
                      ? "Download Failed"
                      : "Downloading Submissions"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {downloadModal.cls
                      ? `Year ${downloadModal.cls.year} - Sec ${downloadModal.cls.section}${downloadModal.cls.branch ? ` - Branch ${downloadModal.cls.branch}` : ""} (${downloadModal.cls.subject})`
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            {downloadModal.status === "fetching-info" && (
              <div className="py-6 text-center text-sm text-slate-600 flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                Analyzing submissions and computing batch sizes...
              </div>
            )}

            {downloadModal.status === "downloading" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>
                    Batch {downloadModal.currentPart} of {downloadModal.totalParts}
                  </span>
                  <span>
                    {Math.min(downloadModal.currentPart * downloadModal.batchSize, downloadModal.total)} / {downloadModal.total} submissions
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.round(
                        ((downloadModal.currentPart - 0.3) / downloadModal.totalParts) * 100
                      )}%`,
                    }}
                  ></div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">
                    Downloading Part {downloadModal.currentPart} of {downloadModal.totalParts}...
                  </p>
                  <p className="text-slate-500">
                    Submissions are automatically split into manageable batches so Vercel does not cut off the download. Each part will save directly to your browser.
                  </p>
                </div>
              </div>
            )}

            {downloadModal.status === "completed" && (
              <div className="py-4 space-y-3">
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-xs">
                  <p className="font-bold mb-1">All parts finished downloading!</p>
                  <p>
                    Downloaded {downloadModal.total} submissions across {downloadModal.totalParts} ZIP {downloadModal.totalParts === 1 ? "file" : "files"}. Please check your browser downloads folder.
                  </p>
                </div>
              </div>
            )}

            {downloadModal.status === "error" && (
              <div className="py-4 space-y-3">
                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100 text-rose-700 text-xs font-medium">
                  {downloadModal.errorMessage}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="mt-6 flex justify-end gap-2">
              {downloadModal.status === "downloading" ? (
                <button
                  type="button"
                  onClick={() => {
                    abortDownloadRef.current = true;
                    setDownloadModal((prev) => ({ ...prev, isOpen: false, status: "idle" }));
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel Download
                </button>
              ) : downloadModal.status === "error" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setDownloadModal((prev) => ({ ...prev, isOpen: false }))}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (downloadModal.cls) startAutoDownload(downloadModal.cls);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
                  >
                    Retry
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setDownloadModal((prev) => ({ ...prev, isOpen: false, status: "idle" }))}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
