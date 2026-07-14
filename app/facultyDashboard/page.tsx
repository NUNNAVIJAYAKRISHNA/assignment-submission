import { redirect } from "next/navigation";
import { getUserSession } from "../../lib/auth";
import { getStudentsForFaculty } from "../../services/studentService";
import FacultyClassesList from "../../components/FacultyClassesList";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FacultyDashboardPage() {
  const user = await getUserSession();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "faculty") {
    redirect("/studentDashboard");
  }

  const studentList = await getStudentsForFaculty(user);
  
  const totalStudents = studentList.reduce((acc, cls) => acc + cls.students.length, 0);

  const userInitials = user.fullname
    ? user.fullname.charAt(0).toUpperCase()
    : "F";

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
                  className="w-8 h-8 text-white p-1.5 bg-gradient-to-br from-indigo-50 to-violet-600 rounded-xl"
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
                  Faculty Profile
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome, {user.fullname}
                </h1>
                {user.designation && (
                  <p className="text-slate-300 mt-1 text-sm sm:text-base">
                    Designation: <strong className="text-white">{user.designation}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Stats Grid (Inside Hero) */}
            <div className="grid grid-cols-2 gap-4 md:w-auto w-full border-t border-white/10 pt-6 md:pt-0 md:border-t-0">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 min-w-[120px] text-center md:text-left">
                <p className="text-xs text-indigo-300 font-medium tracking-wide uppercase">Assigned Classes</p>
                <p className="text-2xl font-bold mt-1 text-white">{studentList.length}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 min-w-[120px] text-center md:text-left">
                <p className="text-xs text-indigo-300 font-medium tracking-wide uppercase">Total Students</p>
                <p className="text-2xl font-bold mt-1 text-white">{totalStudents}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Classes List Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Classes</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage your assigned classes, view student directories, and check assignments.</p>
          </div>

          {studentList.length === 0 ? (
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
              <h3 className="text-lg font-bold text-slate-800">No Classes Assigned</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2 text-sm">
                We couldn&apos;t find any student lists assigned to your account. Please reach out to your system administrator.
              </p>
            </div>
          ) : (
            <FacultyClassesList classes={studentList} />
          )}
        </div>
      </main>

      <footer className="py-8 text-center text-xs text-slate-400 mt-auto">
        <p>&copy; 2026 AssignHub. All rights reserved.</p>
      </footer>
    </div>
  );
}
