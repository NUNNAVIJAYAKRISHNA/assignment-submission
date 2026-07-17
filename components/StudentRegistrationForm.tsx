"use client";

import { useState } from "react";
import Link from "next/link";

export default function StudentRegistrationForm() {
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rollNumber, setRollNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [semester, setSemester] = useState("");
  const [section, setSection] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname,
          email,
          password,
          rollNumber,
          branch,
          yearOfStudy,
          semester,
          section,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Registration failed");
      }

      setMessage(data.message || "Registration successful! Please check your email.");
      // Clear form
      setFullname("");
      setEmail("");
      setPassword("");
      setRollNumber("");
      setBranch("");
      setYearOfStudy("");
      setSemester("");
      setSection("");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-xl border border-slate-100/80 p-8 sm:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <div className="absolute -right-24 -top-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600"></div>

      <div className="flex flex-col items-center mb-8 relative">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-center">Student Registration</h1>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">Create your account to start submitting assignments to your courses.</p>
      </div>

      {error && (
        <div className="mb-5 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {message && (
        <div className="mb-5 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-x-6 gap-y-5 relative">
        {/* Full Name */}
        <div className="md:col-span-6 flex flex-col">
          <label htmlFor="fullname" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <input
              id="fullname"
              type="text"
              required
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="John Doe"
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
            />
          </div>
        </div>

        {/* Email Address */}
        <div className="md:col-span-3 flex flex-col">
          <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div className="md:col-span-3 flex flex-col">
          <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 pl-11 pr-11 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Registration Number */}
        <div className="md:col-span-3 flex flex-col">
          <label htmlFor="rollNumber" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Registration Number</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm5 3h3" />
              </svg>
            </span>
            <input
              id="rollNumber"
              type="text"
              required
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="23ACSE113"
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
            />
          </div>
        </div>

        {/* Branch */}
        <div className="md:col-span-3 flex flex-col">
          <label htmlFor="branch" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Branch</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </span>
            <input
              id="branch"
              type="text"
              required
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="CSE"
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
            />
          </div>
        </div>

        {/* Year of Study */}
        <div className="md:col-span-2 flex flex-col">
          <label htmlFor="yearOfStudy" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Year of Study</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              id="yearOfStudy"
              type="number"
              min="1"
              max="4"
              required
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(e.target.value)}
              placeholder="1 - 4"
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
            />
          </div>
        </div>

        {/* Semester */}
        <div className="md:col-span-2 flex flex-col">
          <label htmlFor="semester" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Semester</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            <input
              id="semester"
              type="number"
              min="1"
              max="8"
              required
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              placeholder="1 - 8"
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
            />
          </div>
        </div>

        {/* Section */}
        <div className="md:col-span-2 flex flex-col">
          <label htmlFor="section" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Section</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </span>
            <input
              id="section"
              type="text"
              required
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="A/B/C/D"
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
            />
          </div>
        </div>

        {/* Register Button */}
        <div className="md:col-span-6 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center h-12 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-xl hover:shadow-indigo-100 transform active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? "Registering..." : "Register Account"}</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center items-center text-sm text-slate-500 relative">
        <div>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors duration-200">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
