import { redirect } from "next/navigation";
import { getUserSession } from "../../lib/auth";
import { getFacultyForStudent } from "../../services/facultyService";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const user = await getUserSession();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "student") {
    redirect("/facultyDashboard");
  }

  const facultyList = await getFacultyForStudent({
    yearOfStudy: user.yearOfStudy,
    section: user.section
  });

  const userInitials = user.fullname
    ? user.fullname.charAt(0).toUpperCase()
    : "S";

  return (
    <div className="min-h-screen bg-hush text-slate-800 flex flex-col font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg text-slate-900">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="w-8 h-8 text-white p-1.5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
                <span>AssignHub</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors duration-200"
              >
                Home
              </Link>
              <span className="h-4 w-px bg-slate-200"></span>
              <Link
                href="/api/logout"
                className="inline-flex items-center space-x-1.5 text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Logout</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        {/* Hero / Profile Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 text-white p-6 sm:p-8 lg:p-10 shadow-2xl mb-8">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -right-32 -bottom-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-bold text-indigo-300 shadow-inner">
                {userInitials}
              </div>
              <div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                  Student Profile
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome, {user.fullname}
                </h1>
                <p className="text-slate-300 mt-1 flex flex-wrap gap-x-4 text-sm sm:text-base">
                  {user.rollNumber && (
                    <span>
                      Reg No: <strong className="text-white">{user.rollNumber}</strong>
                    </span>
                  )}
                  {user.branch && (
                    <>
                      <span className="hidden sm:inline text-slate-500">•</span>
                      <span>
                        Branch: <strong className="text-white">{user.branch}</strong>
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Stats Grid (Inside Hero) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:w-auto w-full border-t border-white/10 pt-6 md:pt-0 md:border-t-0">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 min-w-[120px] text-center md:text-left">
                <p className="text-xs text-indigo-300 font-medium tracking-wide uppercase">Year of Study</p>
                <p className="text-2xl font-bold mt-1 text-white">{user.yearOfStudy}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 min-w-[120px] text-center md:text-left">
                <p className="text-xs text-indigo-300 font-medium tracking-wide uppercase">Section</p>
                <p className="text-2xl font-bold mt-1 text-white">{user.section}</p>
              </div>
              {user.semester && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 min-w-[120px] text-center md:text-left col-span-2 sm:col-span-1">
                  <p className="text-xs text-indigo-300 font-medium tracking-wide uppercase">Semester</p>
                  <p className="text-2xl font-bold mt-1 text-white">{user.semester}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assignments Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Faculty & Courses</h2>
              <p className="text-sm text-slate-500 mt-0.5">Submit your video assignments to the respective subject teachers.</p>
            </div>
            <div className="flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-semibold">
              <span>Total Courses: {facultyList.length}</span>
            </div>
          </div>

          {facultyList.length === 0 ? (
            /* Empty State */
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-400 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800">No Faculty Assigned</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
                We couldn&apos;t find any faculty members assigned to your Year and Section at this time. Please contact your coordinator.
              </p>
            </div>
          ) : (
            /* Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facultyList.map((faculty) => {
                const matchedTeaching = faculty.teaching?.find(
                  (t) => t.year === user.yearOfStudy && t.section === user.section
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
                    key={faculty._id.toString()}
                    className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <div className="space-y-4">
                      {/* Subject Badge & Info */}
                      <div className="flex items-start justify-between">
                        <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700">
                          {matchedTeaching ? matchedTeaching.subject : "N/A"}
                        </span>
                        
                        {/* Status Badge */}
                        {assignmentsEnabled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-50 text-slate-400 border border-slate-200">
                            Locked
                          </span>
                        )}
                      </div>

                      {/* Faculty Details */}
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

                    {/* Submit CTA Button */}
                    <div className="mt-6 pt-4 border-t border-slate-50">
                      {assignmentsEnabled ? (
                        <Link href={`/submit-video/${faculty._id}`} className="block w-full">
                          <button className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-lg hover:shadow-indigo-100 transform active:scale-98 transition-all duration-200 group-hover:scale-[1.01]">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                              />
                            </svg>
                            Submit Assignment
                          </button>
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-2xl text-sm font-semibold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed shadow-none"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
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
      </main>

      <footer className="py-8 text-center text-xs text-slate-400">
        <p>&copy; 2026 AssignHub. All rights reserved.</p>
      </footer>
    </div>
  );
}
