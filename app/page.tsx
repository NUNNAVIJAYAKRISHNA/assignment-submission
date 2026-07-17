import Link from "next/link";
import VirtualUrlBar from "../components/VirtualUrlBar";
import AitamLogo from "../components/AitamLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <header className="text-slate-600 body-font bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center">
          <Link href="/" className="flex title-font font-medium items-center text-slate-900 mb-4 md:mb-0">
            <AitamLogo />
          </Link>
          <nav className="md:ml-auto flex flex-wrap items-center text-base justify-center gap-6">
            <span className="hover:text-indigo-600 cursor-pointer text-sm font-semibold transition-colors">About</span>
            <Link href="/registration" className="hover:text-indigo-600 text-sm font-semibold transition-colors">
              Register
            </Link>
            <Link href="/login" className="hover:text-indigo-600 text-sm font-semibold transition-colors">
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="max-w-4xl text-center space-y-8 relative">
          <div className="absolute -right-24 -top-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight relative">
            Manage Academic Assignments <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Effortlessly
            </span>
          </h1>
          
          <p className="text-lg text-slate-500 max-w-xl mx-auto relative">
            A unified submission environment. Students submit assignments directly, and faculty members manage directories, classrooms, and grades in a dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <Link
              href="/registration"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-xl hover:shadow-indigo-100 transition-all active:scale-[0.98]"
            >
              Register as Student
            </Link>
          </div>

          <VirtualUrlBar />

        </div>
      </main>

      <footer className="py-8 text-center text-xs text-slate-400 bg-white border-t border-slate-100">
        <p>&copy; 2026 ClassVault. All rights reserved.</p>
      </footer>
    </div>
  );
}
