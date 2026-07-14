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
  assignmentsEnabled: boolean;
  students: Student[];
}

export default function FacultyClassesList({ classes }: { classes: ClassItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, boolean>>(() => {
    const initialMap: Record<string, boolean> = {};
    classes.forEach((cls) => {
      initialMap[`${cls.year}-${cls.section}`] = !!cls.assignmentsEnabled;
    });
    return initialMap;
  });

  const toggleClass = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const handleToggleAssignments = async (year: number, section: string, enabled: boolean) => {
    const key = `${year}-${section}`;
    setToggling(key);

    // Optimistic UI Update
    setAssignmentsMap((prev) => ({ ...prev, [key]: enabled }));

    try {
      const res = await fetch("/api/faculty/assignments-toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ year, section, enabled }),
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
            key={`${cls.year}-${cls.section}`}
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
                    Year {cls.year} — Section {cls.section}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Student Directory</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 sm:space-x-4">
                {/* Enable Assignments Toggle */}
                {(() => {
                  const key = `${cls.year}-${cls.section}`;
                  const isEnabled = !!assignmentsMap[key];
                  const isToggling = toggling === key;
                  return (
                    <div
                      className="flex items-center space-x-2 bg-slate-100/50 hover:bg-slate-100 px-3 py-1.5 rounded-2xl transition-colors duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs font-bold text-slate-600 select-none">Enable Assignments</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isEnabled}
                        onClick={() => handleToggleAssignments(cls.year, cls.section, !isEnabled)}
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

                {/* Download Submissions as ZIP button */}
                {cls.students.some((s) => !!s.submission) ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/api/faculty/download-submissions?year=${cls.year}&section=${cls.section}`;
                    }}
                    className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 shadow-sm hover:shadow active:scale-[0.97] hover:scale-[1.02] transform transition-all duration-200 select-none"
                    title="Download all student submissions as a ZIP archive"
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
    </div>
  );
}
