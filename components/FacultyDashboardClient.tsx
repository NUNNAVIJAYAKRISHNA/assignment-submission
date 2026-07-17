"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FacultyClassesList from "./FacultyClassesList";
import AitamLogo from "./AitamLogo";

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
  assignmentsEnabled: boolean;
  students: Student[];
}

interface User {
  _id: string;
  fullname: string;
  email: string;
  role: string;
  designation?: string | null;
  branch?: string | null;
}

interface FacultyDashboardClientProps {
  initialUser: User;
  classes: ClassItem[];
}

export default function FacultyDashboardClient({
  initialUser,
  classes,
}: FacultyDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"classes" | "profile">("classes");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(initialUser);

  // Class Management States
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [addClassForm, setAddClassForm] = useState({
    year: 1,
    section: "",
    subject: "",
  });
  const [addClassSaving, setAddClassSaving] = useState(false);
  const [addClassSuccess, setAddClassSuccess] = useState<string | null>(null);
  const [addClassError, setAddClassError] = useState<string | null>(null);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    fullname: currentUser.fullname,
    branch: currentUser.branch || "",
    designation: currentUser.designation || "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Sync profile form when user updates
  useEffect(() => {
    setProfileForm({
      fullname: currentUser.fullname,
      branch: currentUser.branch || "",
      designation: currentUser.designation || "",
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

      // Reload page to re-fetch session on server
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setProfileError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Add Class
  const handleAddClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddClassSaving(true);
    setAddClassSuccess(null);
    setAddClassError(null);

    try {
      const res = await fetch("/api/faculty/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addClassForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to add class");
      }

      setAddClassSuccess("Class added successfully! Refreshing class list...");
      setIsAddClassModalOpen(false);
      setAddClassForm({ year: 1, section: "", subject: "" });

      // Reload page to re-fetch classes list on server
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setAddClassError(err.message || "Failed to add class. Please try again.");
    } finally {
      setAddClassSaving(false);
    }
  };

  const userInitials = currentUser.fullname
    ? currentUser.fullname.charAt(0).toUpperCase()
    : "F";

  const totalStudents = classes.reduce((acc, cls) => acc + cls.students.length, 0);

  const navigationItems = [
    {
      id: "classes" as const,
      label: "My Classes",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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
            <p className="text-xs text-indigo-400 font-medium truncate capitalize">{currentUser.role} Account</p>
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
          <Link
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
          </Link>
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

        <Link
          href="/api/logout"
          className="text-rose-400 hover:text-rose-300 font-semibold text-xs tracking-wide bg-rose-950/20 px-3 py-1.5 rounded-lg flex items-center gap-1 border border-rose-900/30"
        >
          Logout
        </Link>
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
                <p className="text-xs text-indigo-400 font-medium capitalize">{currentUser.role} Coordinator</p>
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
              <Link
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
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col min-h-0 bg-slate-50">
        <div className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* TAB CONTENT: MY CLASSES */}
          {activeTab === "classes" && (
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
                        Faculty Coordinator
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                        Welcome, {currentUser.fullname}
                      </h1>
                      {currentUser.designation && (
                        <p className="text-slate-300 mt-1 text-sm sm:text-base">
                          Designation: <strong className="text-white">{currentUser.designation}</strong>
                        </p>
                      )}
                      {currentUser.branch && (
                        <p className="text-slate-300 mt-0.5 text-sm sm:text-base">
                          Branch: <strong className="text-white">{currentUser.branch}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-4 md:w-auto w-full border-t border-white/10 pt-4 md:pt-0 md:border-t-0">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center md:text-left min-w-[100px]">
                      <p className="text-[10px] text-indigo-300 font-medium uppercase">Assigned Classes</p>
                      <p className="text-lg font-bold text-white">{classes.length}</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 text-center md:text-left min-w-[100px]">
                      <p className="text-[10px] text-indigo-300 font-medium uppercase">Total Students</p>
                      <p className="text-lg font-bold text-white">{totalStudents}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Classes Accordion View */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Classes</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Manage your assigned classes, view student directories, and check assignments.</p>
                  </div>
                  <button
                    onClick={() => setIsAddClassModalOpen(true)}
                    className="inline-flex items-center justify-center h-10 px-5 bg-indigo-600 hover:bg-indigo-750 text-white hover:bg-indigo-700 rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:shadow-indigo-100 transition-all duration-200 select-none active:scale-[0.98]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Class
                  </button>
                </div>

                {classes.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-50 text-slate-400 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No Classes Assigned</h3>
                    <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
                      We couldn&apos;t find any classes assigned to your account. Click &quot;Add New Class&quot; above to setup your courses.
                    </p>
                  </div>
                ) : (
                  <FacultyClassesList classes={classes} />
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: PROFILE */}
          {activeTab === "profile" && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profile Details</h1>
                <p className="text-sm text-slate-500 mt-1">Manage your faculty details, designation, and branch settings.</p>
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

                  {/* Designation */}
                  <div className="flex flex-col">
                    <label htmlFor="designation" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Designation
                    </label>
                    <input
                      id="designation"
                      type="text"
                      required
                      value={profileForm.designation}
                      onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                      placeholder="e.g. Assistant Professor"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
                    />
                  </div>

                  {/* Branch */}
                  <div className="flex flex-col sm:col-span-2">
                    <label htmlFor="branch" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Branch
                    </label>
                    <input
                      id="branch"
                      type="text"
                      required
                      value={profileForm.branch}
                      onChange={(e) => setProfileForm({ ...profileForm, branch: e.target.value })}
                      placeholder="e.g. Computer Science & Engineering"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
                    />
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

      {/* --- ADD CLASS MODAL --- */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAddClassModalOpen(false)}
          ></div>

          {/* Modal Container */}
          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-8 overflow-hidden animate-[modalIn_0.2s_ease-out] z-10">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 to-violet-600"></div>

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Add New Class</h2>
              <button
                onClick={() => setIsAddClassModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {addClassError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-xs font-semibold">
                {addClassError}
              </div>
            )}

            {addClassSuccess && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-semibold">
                {addClassSuccess}
              </div>
            )}

            <form onSubmit={handleAddClassSubmit} className="space-y-4">
              {/* Subject */}
              <div className="flex flex-col">
                <label htmlFor="modal-subject" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Subject Name
                </label>
                <input
                  id="modal-subject"
                  type="text"
                  required
                  value={addClassForm.subject}
                  onChange={(e) => setAddClassForm({ ...addClassForm, subject: e.target.value })}
                  placeholder="e.g. Operating Systems"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                />
              </div>

              {/* Year */}
              <div className="flex flex-col">
                <label htmlFor="modal-year" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Year of Study
                </label>
                <select
                  id="modal-year"
                  value={addClassForm.year}
                  onChange={(e) => setAddClassForm({ ...addClassForm, year: Number(e.target.value) })}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition-all duration-200"
                >
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                </select>
              </div>

              {/* Section */}
              <div className="flex flex-col">
                <label htmlFor="modal-section" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Section
                </label>
                <input
                  id="modal-section"
                  type="text"
                  required
                  value={addClassForm.section}
                  onChange={(e) => setAddClassForm({ ...addClassForm, section: e.target.value })}
                  placeholder="e.g. A"
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="w-1/3 h-10 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addClassSaving}
                  className="w-2/3 h-10 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transform active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {addClassSaving ? "Adding..." : "Add Class"}
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
