"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VirtualUrlBar() {
  const [urlPath, setUrlPath] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleNavigate = () => {
    setError("");
    const cleanedPath = urlPath.trim().replace(/^\/+|\/+$/g, ""); // Remove leading and trailing slashes

    if (!cleanedPath) {
      setError("Please enter a path.");
      return;
    }

    const lowerPath = cleanedPath.toLowerCase();

    // Check for faculty registration path specifically
    if (lowerPath === "faculty/register" || lowerPath === "faculty/registration") {
      router.push("/faculty/register");
      return;
    }

    // Support standard public pages as well for a seamless simulation
    if (lowerPath === "registration" || lowerPath === "register") {
      router.push("/registration");
      return;
    }
    if (lowerPath === "login") {
      router.push("/login");
      return;
    }
    if (lowerPath === "home" || lowerPath === "") {
      router.push("/");
      return;
    }

    // Fallback: try navigating to any custom typed path
    router.push(`/${cleanedPath}`);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-12 p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-100/80 shadow-lg relative overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Background blur decorative circles */}
      <div className="absolute -right-16 -top-16 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase ml-1">Virtual URL Box</span>
        </div>
        <span className="text-[10px] font-mono text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Active</span>
      </div>

      <p className="text-xs text-slate-500 mb-4 leading-relaxed">
        <strong>Mobile & Tablet Helper:</strong> Use this field to navigate directly to hidden paths.
      </p>

      <div className="space-y-3">
        <textarea
          rows={1}
          value={urlPath}
          onChange={(e) => setUrlPath(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleNavigate();
            }
          }}
          placeholder="Type path and hit Enter"
          className="w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-white/80 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-mono transition-all duration-200"
        />

        {error && (
          <p className="text-xs text-rose-500 font-medium animate-pulse">
            {error}
          </p>
        )}

        <button
          onClick={handleNavigate}
          className="w-full inline-flex items-center justify-center h-10 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
        >
          Navigate
        </button>
      </div>
    </div>
  );
}
