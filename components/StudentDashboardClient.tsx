"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AitamLogo from "./AitamLogo";

interface Faculty {
  _id: string;
  fullname: string;
  teaching?: Array<{
    year: number;
    section: string;
    subject: string;
    assignmentsEnabled?: boolean;
  }>;
}

interface User {
  _id: string;
  fullname: string;
  email: string;
  role: string;
  rollNumber?: string | null;
  yearOfStudy?: number | null;
  semester?: number | null;
  section?: string | null;
  branch?: string | null;
}

interface Submission {
  _id: string;
  title: string;
  videoUrl: string;
  description?: string;
  subject: string;
  facultyId: {
    _id: string;
    fullname: string;
  } | string;
  createdAt: string;
  updatedAt: string;
}

interface StudentDashboardClientProps {
  initialUser: User;
  initialFacultyList: Faculty[];
}

export default function StudentDashboardClient({
  initialUser,
  initialFacultyList,
}: StudentDashboardClientProps) {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<"courses" | "submissions" | "profile">("courses");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [facultyList, setFacultyList] = useState<Faculty[]>(initialFacultyList);

  // Submissions State
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    fullname: currentUser.fullname,
    yearOfStudy: currentUser.yearOfStudy || 1,
    semester: currentUser.semester || 1,
    section: currentUser.section || "",
    branch: currentUser.branch || "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Submission Edit Modal State
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [submissionForm, setSubmissionForm] = useState({
    title: "",
    videoUrl: "",
    description: "",
  });
  const [submissionSaving, setSubmissionSaving] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Fetch Submissions
  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    setSubmissionsError(null);
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load submissions");
      setSubmissions(data.submissions || []);
    } catch (err: any) {
      console.error(err);
      setSubmissionsError(err.message || "Something went wrong loading submissions.");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Fetch submissions on load or when tab changes to submissions
  useEffect(() => {
    if (activeTab === "submissions") {
      fetchSubmissions();
    }
  }, [activeTab]);

  // Sync profile form when user updates
  useEffect(() => {
    setProfileForm({
      fullname: currentUser.fullname,
      yearOfStudy: currentUser.yearOfStudy || 1,
      semester: currentUser.semester || 1,
      section: currentUser.section || "",
      branch: currentUser.branch || "",
    });
  }, [currentUser]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const res = await fetch("/api/profile/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      setCurrentUser(data.user);
      setProfileSuccess("Profile updated successfully! Refreshing dashboard...");
      
      // Reload page to re-fetch courses for updated year/section on the server
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Open Edit Submission Modal
  const openEditSubmission = (sub: Submission) => {
    setEditingSubmission(sub);
    setSubmissionForm({
      title: sub.title,
      videoUrl: sub.videoUrl,
      description: sub.description || "",
    });
    setSubmissionSuccess(null);
    setSubmissionError(null);
  };

  // Handle Submission Update
  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission) return;

    setSubmissionSaving(true);
    setSubmissionSuccess(null);
    setSubmissionError(null);

    try {
      const res = await fetch("/api/submissions/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: editingSubmission._id,
          title: submissionForm.title,
          videoUrl: submissionForm.videoUrl,
          description: submissionForm.description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update submission");
      }

      setSubmissionSuccess("Submission updated successfully!");
      setEditingSubmission(null);
      fetchSubmissions(); // reload list
    } catch (err: any) {
      setSubmissionError(err.message || "Failed to save submission.");
    } finally {
      setSubmissionSaving(false);
    }
  };

  const userInitials = currentUser.fullname
    ? currentUser.fullname.charAt(0).toUpperCase()
    : "S";

  // Sidebar navigation links definition
  const navigationItems = [
    {
      id: "courses" as const,
      label: "My Courses",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: "submissions" as const,
      label: "My Submissions",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "profile" as const,
      label: "Profile",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shrink-0 border-r border-slate-800">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <AitamLogo lightMode={true} className="w-8 h-8" />
        </div>

        {/* User Mini Profile */}
        <div className="p-4 border-b border-slate-800/60 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-lg">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate text-slate-100">{currentUser.fullname}</p>
            <p className="text-xs text-indigo-400 font-medium truncate capitalize">{currentUser.role}</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <a
            href="/api/logout"
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </a>
        </div>
      </aside>

      {/* --- MOBILE LAYOUT HEADER & MENU --- */}
      <div className="md:hidden w-full bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-4 sticky top-0 z-50 text-white">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <AitamLogo lightMode={true} className="w-6 h-6" />

        <a
          href="/api/logout"
          className="text-rose-400 hover:text-rose-300 font-semibold text-xs tracking-wide bg-rose-950/20 px-3 py-1.5 rounded-lg flex items-center gap-1 border border-rose-900/30"
        >
          Logout
        </a>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>

          {/* Drawer Panel */}
          <div className="relative flex flex-col w-64 max-w-xs bg-slate-900 text-white h-full shadow-2xl transition-transform animate-[slideIn_0.2s_ease-out]">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <span className="font-extrabold text-lg tracking-tight">Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-base">
                {userInitials}
              </div>
              <div>
                <p className="text-sm font-semibold truncate max-w-[140px]">{currentUser.fullname}</p>
                <p className="text-xs text-indigo-400 font-medium capitalize">{currentUser.role}</p>
              </div>
            </div>

            <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === item.id
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
              <a
                href="/api/logout"
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col min-h-0 bg-slate-50">
        <div className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* TAB CONTENT: MY COURSES */}
          {activeTab === "courses" && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 text-white p-6 sm:p-8 shadow-xl">
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -right-32 -bottom-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-center space-x-4 sm:space-x-6">
                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-bold text-indigo-300 shadow-inner">
                      {userInitials}
                    </div>
                    <div>
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                        Student Account
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Welcome, {currentUser.fullname}
                      </h1>
                      <p className="text-slate-300 mt-1 flex flex-wrap gap-x-4 text-sm sm:text-base">
                        {currentUser.rollNumber && (
                          <span>
                            Reg No: <strong className="text-white">{currentUser.rollNumber}</strong>
                          </span>
                        )}
                        {currentUser.branch && (
                          <>
                            <span className="hidden sm:inline text-slate-500">•</span>
                            <span>
                              Branch: <strong className="text-white">{currentUser.branch}</strong>
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Profile quick stats summary */}
                  <div className="grid grid-cols-3 gap-3 md:w-auto w-full border-t border-white/10 pt-4 md:pt-0 md:border-t-0">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center md:text-left">
                      <p className="text-[10px] text-indigo-300 font-medium uppercase">Year</p>
                      <p className="text-lg font-bold text-white">{currentUser.yearOfStudy || "N/A"}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center md:text-left">
                      <p className="text-[10px] text-indigo-300 font-medium uppercase">Section</p>
                      <p className="text-lg font-bold text-white">{currentUser.section || "N/A"}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center md:text-left">
                      <p className="text-[10px] text-indigo-300 font-medium uppercase">Semester</p>
                      <p className="text-lg font-bold text-white">{currentUser.semester || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course list */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Faculty & Courses</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Submit your assignments to the respective subject teachers.</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                    <span>Total Courses: {facultyList.length}</span>
                  </div>
                </div>

                {facultyList.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-50 text-slate-400 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No Faculty Assigned</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
                      We couldn&apos;t find any faculty members assigned to your Year ({currentUser.yearOfStudy}) and Section ({currentUser.section}) at this time. Go to Profile to update them if they are incorrect.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {facultyList.map((faculty) => {
                      const matchedTeaching = faculty.teaching?.find(
                        (t) => t.year === currentUser.yearOfStudy && t.section === currentUser.section
                      );

                      const assignmentsEnabled = matchedTeaching ? !!matchedTeaching.assignmentsEnabled : false;

                      const facultyInitials = faculty.fullname
                        ? faculty.fullname
                            .split(" ")
                            .map((n) => n.charAt(0))
                            .join("")
                            .toUpperCase()
                        : "F";

                      return (
                        <div
                          key={faculty._id}
                          className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                        >
                          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-5050 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700">
                                {matchedTeaching ? matchedTeaching.subject : "N/A"}
                              </span>
                              {assignmentsEnabled ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-400 border border-slate-200">
                                  Locked
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                {facultyInitials}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors duration-200">
                                  {faculty.fullname}
                                </p>
                                <p className="text-xs text-slate-500">Subject Faculty</p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-50">
                            {assignmentsEnabled ? (
                              <Link href={`/submit-video/${faculty._id}`} className="block w-full">
                                <button className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-lg hover:shadow-indigo-100 transform active:scale-98 transition-all duration-200">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  Submit Assignment
                                </button>
                              </Link>
                            ) : (
                              <button
                                disabled
                                className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed shadow-none"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Submit Assignment
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: MY SUBMISSIONS */}
          {activeTab === "submissions" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Submissions</h1>
                  <p className="text-sm text-slate-500 mt-1">Review, track, and update all assignment submissions you have made.</p>
                </div>
                <button
                  onClick={fetchSubmissions}
                  className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 bg-white shadow-sm transition-colors duration-200"
                  title="Reload submissions"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loadingSubmissions ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
                  </svg>
                </button>
              </div>

              {submissionsError && (
                <div className="p-4 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-sm font-medium">
                  {submissionsError}
                </div>
              )}

              {loadingSubmissions ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm font-medium">Loading submissions...</p>
                  </div>
                </div>
              ) : submissions.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-50 text-slate-400 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No Submissions Found</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
                    You haven&apos;t submitted any assignments yet. Go to &quot;My Courses&quot; to submit your first assignment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {submissions.map((sub) => {
                    const facultyName = typeof sub.facultyId === "object" ? sub.facultyId.fullname : "Assigned Faculty";
                    return (
                      <div
                        key={sub._id}
                        className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center md:justify-between gap-6"
                      >
                        <div className="space-y-3 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700">
                              {sub.subject}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Last updated: {new Date(sub.updatedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>

                          <div>
                            <h3 className="text-base font-bold text-slate-900 truncate">{sub.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">Submitted to: <span className="font-semibold text-slate-700">{facultyName}</span></p>
                          </div>

                          {sub.description && (
                            <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 max-w-2xl text-justify line-clamp-2">
                              {sub.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-1 text-xs text-indigo-600 font-semibold hover:text-indigo-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <a href={sub.videoUrl} target="_blank" rel="noopener noreferrer" className="hover:underline truncate max-w-[250px] sm:max-w-[400px]">
                              {sub.videoUrl}
                            </a>
                          </div>
                        </div>

                        {/* Edit CTA */}
                        <div className="shrink-0 flex items-center">
                          <button
                            onClick={() => openEditSubmission(sub)}
                            className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Update Submission
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: PROFILE */}
          {activeTab === "profile" && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profile Details</h1>
                <p className="text-sm text-slate-500 mt-1">Manage your student profile information, year, and semester settings.</p>
              </div>

              {profileSuccess && (
                <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-sm font-semibold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {profileSuccess}
                </div>
              )}

              {profileError && (
                <div className="p-4 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-sm font-semibold">
                  {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6 relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1 bg-indigo-500"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="flex flex-col sm:col-span-2">
                    <label htmlFor="fullname" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Full Name
                    </label>
                    <input
                      id="fullname"
                      type="text"
                      required
                      value={profileForm.fullname}
                      onChange={(e) => setProfileForm({ ...profileForm, fullname: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
                    />
                  </div>

                  {/* Email (Read only) */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Email Address (Read-only)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed text-sm"
                    />
                  </div>

                  {/* Roll Number (Read only) */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Registration Number (Read-only)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.rollNumber || "N/A"}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed text-sm"
                    />
                  </div>

                  {/* Branch */}
                  <div className="flex flex-col">
                    <label htmlFor="branch" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Branch
                    </label>
                    <input
                      id="branch"
                      type="text"
                      required
                      value={profileForm.branch}
                      onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })}
                      placeholder="e.g. Computer Science"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
                    />
                  </div>

                  {/* Section */}
                  <div className="flex flex-col">
                    <label htmlFor="section" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Section
                    </label>
                    <input
                      id="section"
                      type="text"
                      required
                      maxLength={5}
                      value={profileForm.section}
                      onChange={(e) => setProfileForm({ ...profileForm, section: e.target.value })}
                      placeholder="e.g. A, B"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
                    />
                  </div>

                  {/* Year of Study */}
                  <div className="flex flex-col">
                    <label htmlFor="yearOfStudy" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Year of Study
                    </label>
                    <select
                      id="yearOfStudy"
                      value={profileForm.yearOfStudy}
                      onChange={(e) => setProfileForm({ ...profileForm, yearOfStudy: Number(e.target.value) })}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>

                  {/* Semester */}
                  <div className="flex flex-col">
                    <label htmlFor="semester" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Semester
                    </label>
                    <select
                      id="semester"
                      value={profileForm.semester}
                      onChange={(e) => setProfileForm({ ...profileForm, semester: Number(e.target.value) })}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
                    >
                      <option value={1}>1st Semester</option>
                      <option value={2}>2nd Semester</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="inline-flex items-center justify-center px-6 h-11 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transform active:scale-98 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profileSaving ? "Saving..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* --- EDIT SUBMISSION MODAL --- */}
      {editingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingSubmission(null)}
          ></div>

          {/* Modal Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full p-6 sm:p-8 overflow-hidden animate-[modalIn_0.2s_ease-out] z-10">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600"></div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Update Submission</h2>
              <button
                onClick={() => setEditingSubmission(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              Editing submission for subject: <strong className="text-indigo-600">{editingSubmission.subject}</strong>
            </p>

            <form onSubmit={handleSubmissionSubmit} className="space-y-4">
              {submissionError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 text-xs font-semibold">
                  {submissionError}
                </div>
              )}

              {/* Title */}
              <div className="flex flex-col">
                <label htmlFor="modal-title" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Assignment Title
                </label>
                <input
                  id="modal-title"
                  type="text"
                  required
                  value={submissionForm.title}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, title: e.target.value })}
                  placeholder="e.g. Assignment Submission - Week 3"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                />
              </div>

              {/* Video URL */}
              <div className="flex flex-col">
                <label htmlFor="modal-videoUrl" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Submission Link (Drive / OneDrive / GitHub / YouTube)
                </label>
                <input
                  id="modal-videoUrl"
                  type="url"
                  required
                  value={submissionForm.videoUrl}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, videoUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col">
                <label htmlFor="modal-desc" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Additional Description / Notes
                </label>
                <textarea
                  id="modal-desc"
                  value={submissionForm.description}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, description: e.target.value })}
                  placeholder="Notes for faculty..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSubmission(null)}
                  className="w-1/3 h-10 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submissionSaving}
                  className="w-2/3 h-10 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transform active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {submissionSaving ? "Saving..." : "Update Submission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Embedded CSS animation helpers */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        @keyframes modalIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
