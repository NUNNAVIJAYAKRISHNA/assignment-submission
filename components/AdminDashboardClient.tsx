"use client";

import { useState, useEffect } from "react";
import AitamLogo from "./AitamLogo";

interface FacultyItem {
  _id: string;
  fullname: string;
  email: string;
  isVerified: boolean;
  designation: string;
  branch: string;
  teaching: Array<{
    year: number;
    section: string;
    subject: string;
    assignmentsEnabled?: boolean;
  }>;
  createdAt: string | null;
}

interface StudentItem {
  _id: string;
  fullname: string;
  rollNumber: string;
  email: string;
  isVerified: boolean;
  branch: string;
  semester: number;
  createdAt: string | null;
}

interface AdminDashboardClientProps {
  initialAdmin: {
    fullname: string;
    email: string;
    role: string;
  };
}

export default function AdminDashboardClient({ initialAdmin }: AdminDashboardClientProps) {
  const [activeView, setActiveView] = useState<"all" | "faculty" | "students">("all");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Open/Close accordion states for Years and Sections
  const [openYears, setOpenYears] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleYear = (year: number) => {
    setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const isSectionOpen = (year: number, secKey: string) => {
    const key = `${year}-${secKey}`;
    return openSections[key] !== false; // Defaults to open
  };

  const toggleSection = (year: number, secKey: string) => {
    const key = `${year}-${secKey}`;
    setOpenSections((prev) => ({ ...prev, [key]: !isSectionOpen(year, secKey) }));
  };

  const [data, setData] = useState<{
    stats: { totalFaculty: number; totalStudents: number };
    faculty: FacultyItem[];
    studentsByYear: Record<number, Record<string, StudentItem[]>>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Administrative Actions State
  const [actionLoadingUserId, setActionLoadingUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<{
    userId: string;
    fullname: string;
    email: string;
    role: string;
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleVerifyUser = async (userId: string, fullname: string) => {
    setActionLoadingUserId(userId);
    try {
      const res = await fetch("/api/admin/users/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to verify user at database level.");
      }
      showToast(result.message || `Successfully verified ${fullname} at database level.`, "success");
      await fetchData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Error verifying user", "error");
    } finally {
      setActionLoadingUserId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    const { userId, fullname } = deleteConfirmUser;
    setActionLoadingUserId(userId);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to delete unverified user from database.");
      }
      showToast(result.message || `Successfully deleted ${fullname} from database.`, "success");
      setDeleteConfirmUser(null);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Error deleting user", "error");
    } finally {
      setActionLoadingUserId(null);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/data");
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to fetch administrator data");
      }
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong loading dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Faculty List
  const filteredFaculty = (data?.faculty || []).filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.fullname.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      f.branch.toLowerCase().includes(q) ||
      f.designation.toLowerCase().includes(q) ||
      f.teaching.some((t) => t.subject.toLowerCase().includes(q) || t.section.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* --- TOP HEADER & BRANDING --- */}
      <header className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AitamLogo lightMode={true} className="w-8 h-8" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">ClassVault</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Admin Panel
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">{initialAdmin.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchData}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700/60"
              title="Refresh Data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
              </svg>
            </button>

            <a
              href="/api/logout"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </a>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
        {/* HERO BANNER & STATS SUMMARY */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                System Overview
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Administrator Control Center
              </h1>
              <p className="text-slate-400 mt-1 text-sm max-w-xl">
                Comprehensive directory of faculty teaching assignments, email verification statuses, and student enrollment across academic years & sections.
              </p>
            </div>

            {/* Quick Stats Counter */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
              <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4 min-w-[120px] text-center">
                <p className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">Registered Faculty</p>
                <p className="text-2xl font-black text-white mt-0.5">
                  {loading ? "..." : data?.stats.totalFaculty || 0}
                </p>
              </div>
              <div className="bg-slate-950/60 backdrop-blur-md border border-slate-800 rounded-2xl p-4 min-w-[120px] text-center">
                <p className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">Total Students</p>
                <p className="text-2xl font-black text-white mt-0.5">
                  {loading ? "..." : data?.stats.totalStudents || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
          {/* View Toggles */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveView("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === "all" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Sections
            </button>
            <button
              onClick={() => setActiveView("faculty")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === "faculty" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Faculty ({data?.stats.totalFaculty || 0})
            </button>
            <button
              onClick={() => setActiveView("students")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeView === "students" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Students ({data?.stats.totalStudents || 0})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, roll no..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-800 bg-slate-950 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-950/40 text-rose-300 border border-rose-800/40 text-sm font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-xs font-semibold">Loading system records...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* ========================================================= */}
            {/* CARD 1: FACULTY DIRECTORY (TABLE LAYOUT)                   */}
            {/* ========================================================= */}
            {(activeView === "all" || activeView === "faculty") && (
              <section className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-6">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-xl">
                      👨‍🏫
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-extrabold text-white tracking-tight">Faculty Directory</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {filteredFaculty.length} Registered
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Registered faculty members, email verification status, designation, and active teaching classes.
                      </p>
                    </div>
                  </div>
                </div>

                {filteredFaculty.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80 text-slate-400 text-sm">
                    No faculty members found matching search query.
                  </div>
                ) : (
                  /* FACULTY TABLE LAYOUT */
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/90 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-800 tracking-wider">
                        <tr>
                          <th className="py-3.5 px-4">Faculty Name</th>
                          <th className="py-3.5 px-4">Email Address</th>
                          <th className="py-3.5 px-4">Verification</th>
                          <th className="py-3.5 px-4">Designation & Branch</th>
                          <th className="py-3.5 px-4">Assigned Classes & Subjects</th>
                          <th className="py-3.5 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredFaculty.map((fac) => (
                          <tr key={fac._id} className="hover:bg-slate-900/50 transition-colors">
                            {/* Faculty Name */}
                            <td className="py-4 px-4 font-bold text-white whitespace-nowrap">
                              <div className="flex items-center space-x-2.5">
                                <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-extrabold text-xs">
                                  {fac.fullname.charAt(0).toUpperCase()}
                                </div>
                                <span>{fac.fullname}</span>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="py-4 px-4 font-mono text-indigo-400 whitespace-nowrap select-all">
                              {fac.email}
                            </td>

                            {/* Verification status pill */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              {fac.isVerified ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  Unverified
                                </span>
                              )}
                            </td>

                            {/* Designation & Branch */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <p className="font-semibold text-slate-200">{fac.designation}</p>
                              <p className="text-[10px] text-slate-400">{fac.branch}</p>
                            </td>

                            {/* Teaching Array */}
                            <td className="py-4 px-4">
                              {fac.teaching.length === 0 ? (
                                <span className="text-slate-500 italic text-[11px]">No classes assigned</span>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {fac.teaching.map((t, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-200"
                                    >
                                      Year {t.year} — Sec {t.section} <span className="text-indigo-400 font-semibold">({t.subject})</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Administrative Actions */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              {!fac.isVerified ? (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleVerifyUser(fac._id, fac.fullname)}
                                    disabled={actionLoadingUserId === fac._id}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/50 transition-all disabled:opacity-50"
                                    title="Verify faculty at database level"
                                  >
                                    {actionLoadingUserId === fac._id ? (
                                      <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                    <span>Verify</span>
                                  </button>

                                  <button
                                    onClick={() => setDeleteConfirmUser({ userId: fac._id, fullname: fac.fullname, email: fac.email, role: "Faculty" })}
                                    disabled={actionLoadingUserId === fac._id}
                                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/50 transition-all disabled:opacity-50"
                                    title="Delete unverified faculty from database"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Delete</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-medium italic">No action required</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* ========================================================= */}
            {/* CARD 2: STUDENTS DIRECTORY (COLLAPSIBLE YEARS & SECTIONS)  */}
            {/* ========================================================= */}
            {(activeView === "all" || activeView === "students") && (
              <section className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl relative overflow-hidden space-y-8">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xl">
                      🎓
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-extrabold text-white tracking-tight">Students Directory</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {data?.stats.totalStudents || 0} Registered
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Click on any Year card or Section card to expand/collapse.
                      </p>
                    </div>
                  </div>

                  {/* Year filter buttons */}
                  <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setSelectedYear("all")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        selectedYear === "all" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      All Years
                    </button>
                    {[1, 2, 3, 4].map((yr) => (
                      <button
                        key={yr}
                        onClick={() => setSelectedYear(yr)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          selectedYear === yr ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Year {yr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* YEAR CARDS CONTAINER (COLLAPSIBLE ON CLICK) */}
                <div className="space-y-6">
                  {[1, 2, 3, 4]
                    .filter((yearNum) => selectedYear === "all" || selectedYear === yearNum)
                    .map((yearNum) => {
                      const sectionsObj = data?.studentsByYear?.[yearNum] || {};
                      const sectionKeys = Object.keys(sectionsObj).sort();
                      const totalStudentsInYear = sectionKeys.reduce(
                        (acc, secKey) => acc + sectionsObj[secKey].length,
                        0
                      );
                      const isYearOpen = openYears[yearNum] !== false;

                      return (
                        <div
                          key={yearNum}
                          className="bg-slate-950 rounded-2xl border border-slate-800/90 overflow-hidden shadow-md transition-all duration-300"
                        >
                          {/* YEAR CARD HEADER (CLICKABLE TO OPEN/CLOSE) */}
                          <div
                            onClick={() => toggleYear(yearNum)}
                            className="flex items-center justify-between p-5 bg-slate-900/60 hover:bg-slate-900 cursor-pointer border-b border-slate-800/80 transition-colors select-none"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-sm">
                                Y{yearNum}
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                                  Year {yearNum} Students
                                  <span className="text-xs font-semibold text-slate-400">
                                    ({sectionKeys.length} Dynamic Section{sectionKeys.length !== 1 ? "s" : ""})
                                  </span>
                                </h3>
                                <p className="text-xs text-slate-500">Click to expand / collapse Year {yearNum} sections</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-900 text-indigo-300 border border-slate-800">
                                {totalStudentsInYear} Total Enrolled
                              </span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-5 w-5 text-slate-400 transform transition-transform duration-200 ${
                                  isYearOpen ? "rotate-180" : ""
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>

                          {/* YEAR CARD BODY (COLLAPSIBLE CONTENT) */}
                          {isYearOpen && (
                            <div className="p-5 space-y-5 animate-fade-in">
                              {sectionKeys.length === 0 ? (
                                <div className="p-6 text-center text-slate-500 text-xs italic bg-slate-900/40 rounded-xl border border-slate-800/60">
                                  No students registered in Year {yearNum} yet.
                                </div>
                              ) : (
                                /* DYNAMIC SECTIONS CARDS (COLLAPSIBLE ON CLICK) */
                                <div className="space-y-4">
                                  {sectionKeys.map((secKey) => {
                                    const rawStudentsInSection = sectionsObj[secKey] || [];
                                    const studentsInSection = rawStudentsInSection.filter((st) => {
                                      if (!searchQuery.trim()) return true;
                                      const q = searchQuery.toLowerCase();
                                      return (
                                        st.fullname.toLowerCase().includes(q) ||
                                        st.rollNumber.toLowerCase().includes(q) ||
                                        st.email.toLowerCase().includes(q) ||
                                        st.branch.toLowerCase().includes(q)
                                      );
                                    });

                                    const sectionIsOpen = isSectionOpen(yearNum, secKey);

                                    return (
                                      <div
                                        key={secKey}
                                        className="bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm transition-all"
                                      >
                                        {/* SECTION CARD HEADER (CLICKABLE TO OPEN/CLOSE) */}
                                        <div
                                          onClick={() => toggleSection(yearNum, secKey)}
                                          className="flex items-center justify-between px-4 py-3 bg-slate-950/80 hover:bg-slate-950 cursor-pointer border-b border-slate-800/80 transition-colors select-none"
                                        >
                                          <div className="flex items-center space-x-2.5">
                                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                                            <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                                              Section {secKey}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-semibold">
                                              ({studentsInSection.length} Student{studentsInSection.length !== 1 ? "s" : ""})
                                            </span>
                                          </div>

                                          <div className="flex items-center space-x-2">
                                            <span className="text-[10px] text-slate-500">Click to toggle list</span>
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              className={`h-4 w-4 text-slate-400 transform transition-transform duration-200 ${
                                                sectionIsOpen ? "rotate-180" : ""
                                              }`}
                                              fill="none"
                                              viewBox="0 0 24 24"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                            >
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                          </div>
                                        </div>

                                        {/* SECTION CARD BODY (STUDENT TABLE LAYOUT) */}
                                        {sectionIsOpen && (
                                          <div className="p-4 animate-fade-in">
                                            {studentsInSection.length === 0 ? (
                                              <div className="p-4 text-center text-slate-500 text-xs italic">
                                                No matching students found in Section {secKey}.
                                              </div>
                                            ) : (
                                              /* STUDENT TABLE LAYOUT */
                                              <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950">
                                                <table className="w-full text-left text-xs text-slate-300">
                                                  <thead className="bg-slate-900 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-800 tracking-wider">
                                                    <tr>
                                                      <th className="py-2.5 px-3">Student Name</th>
                                                      <th className="py-2.5 px-3">Regd / Roll No</th>
                                                      <th className="py-2.5 px-3">Email Address</th>
                                                      <th className="py-2.5 px-3">Verification</th>
                                                      <th className="py-2.5 px-3">Branch & Sem</th>
                                                      <th className="py-2.5 px-3">Actions</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-slate-800/60">
                                                    {studentsInSection.map((st) => (
                                                      <tr key={st._id} className="hover:bg-slate-900/50 transition-colors">
                                                        {/* Name */}
                                                        <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                                                          <div className="flex items-center space-x-2">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-extrabold text-[10px]">
                                                              {st.fullname.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span>{st.fullname}</span>
                                                          </div>
                                                        </td>

                                                        {/* Roll Number */}
                                                        <td className="py-3 px-3 font-mono text-indigo-300 font-bold whitespace-nowrap select-all">
                                                          {st.rollNumber}
                                                        </td>

                                                        {/* Email */}
                                                        <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap select-all">
                                                          {st.email}
                                                        </td>

                                                        {/* Verification Status */}
                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                          {st.isVerified ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                              </svg>
                                                              Verified
                                                            </span>
                                                          ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                              </svg>
                                                              Unverified
                                                            </span>
                                                          )}
                                                        </td>

                                                        {/* Branch & Semester */}
                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                          <span className="text-slate-300 font-medium">{st.branch}</span>
                                                          <span className="text-[10px] text-slate-500 ml-2">Sem {st.semester}</span>
                                                        </td>

                                                        {/* Administrative Actions */}
                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                          {!st.isVerified ? (
                                                            <div className="flex items-center space-x-2">
                                                              <button
                                                                onClick={() => handleVerifyUser(st._id, st.fullname)}
                                                                disabled={actionLoadingUserId === st._id}
                                                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/50 transition-all disabled:opacity-50"
                                                                title="Verify student at database level"
                                                              >
                                                                {actionLoadingUserId === st._id ? (
                                                                  <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                                                                ) : (
                                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                  </svg>
                                                                )}
                                                                <span>Verify</span>
                                                              </button>

                                                              <button
                                                                onClick={() => setDeleteConfirmUser({ userId: st._id, fullname: st.fullname, email: st.email, role: "Student" })}
                                                                disabled={actionLoadingUserId === st._id}
                                                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-300 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/50 transition-all disabled:opacity-50"
                                                                title="Delete unverified student from database"
                                                              >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                <span>Delete</span>
                                                              </button>
                                                            </div>
                                                          ) : (
                                                            <span className="text-[11px] text-slate-500 font-medium italic">No action required</span>
                                                          )}
                                                        </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* CONFIRM DELETE MODAL */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-600 to-amber-500"></div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xl">
                ⚠️
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Delete Unverified User</h3>
                <p className="text-xs text-rose-400 font-semibold">Database Level Action</p>
              </div>
            </div>

            <p className="text-sm text-slate-300">
              Are you sure you want to permanently delete unverified {deleteConfirmUser.role.toLowerCase()} user{" "}
              <strong className="text-white font-bold">{deleteConfirmUser.fullname}</strong> ({deleteConfirmUser.email}) from the database?
            </p>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs text-slate-400">
              This operation will permanently remove the user document and any associated data directly from MongoDB. This action cannot be undone.
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoadingUserId === deleteConfirmUser.userId}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all disabled:opacity-50"
              >
                {actionLoadingUserId === deleteConfirmUser.userId ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                <span>Delete User</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl border shadow-2xl flex items-center space-x-3 animate-fade-in ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-700 text-emerald-200"
              : "bg-rose-950/90 border-rose-700 text-rose-200"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
              toastMessage.type === "success" ? "bg-emerald-800/50 text-emerald-300" : "bg-rose-800/50 text-rose-300"
            }`}
          >
            {toastMessage.type === "success" ? "✓" : "✕"}
          </div>
          <div className="flex-1 text-xs font-semibold">{toastMessage.message}</div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white text-xs p-1">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

