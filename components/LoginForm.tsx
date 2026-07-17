"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      router.push(data.redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100/80 w-full max-w-md relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <div className="absolute -right-24 -top-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600"></div>

      <div className="flex flex-col items-center mb-6 relative">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight text-center">Login</h1>
        <p className="text-xs text-slate-500 mt-1 text-center">Access your ClassVault account</p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-xl flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative">
        <div className="flex flex-col">
          <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

        <div className="flex flex-col">
          <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </span>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center h-12 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-xl hover:shadow-indigo-100 transform active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center gap-2 text-sm text-slate-500 relative">
        <div>
          Don&apos;t have an account?{" "}
          <Link href="/registration" className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors">
            Register Student
          </Link>
        </div>
      </div>
    </div>
  );
}
