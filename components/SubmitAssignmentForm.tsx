"use client";

import { useState } from "react";
import Link from "next/link";

interface SubmitAssignmentFormProps {
  faculty: {
    _id: any;
    fullname: string;
    teaching?: Array<{
      year: number;
      section: string;
      subject: string;
    }>;
  };
  user: {
    yearOfStudy?: number | null;
    section?: string | null;
  };
}

export default function SubmitAssignmentForm({ faculty, user }: SubmitAssignmentFormProps) {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchedSubject = faculty.teaching?.find(
    (t) => t.year === user.yearOfStudy && t.section === user.section
  )?.subject || "Assigned Course";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/assignments/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          facultyId: faculty._id,
          title,
          videoUrl,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit assignment");
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-xl border border-slate-100/80 p-8 sm:p-10 text-center relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600"></div>
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">Assignment Submitted</h1>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
          Your video assignment for <strong className="text-slate-800">{matchedSubject}</strong> has been successfully submitted to <strong className="text-slate-800">{faculty.fullname}</strong>.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/studentDashboard"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-lg transition-all"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-xl border border-slate-100/80 p-8 sm:p-10 relative overflow-hidden transition-all duration-300 hover:shadow-2xl">
      <div className="absolute -right-24 -top-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600"></div>

      <div className="flex flex-col items-center mb-8 relative">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-center">Submit Assignment</h1>
        <p className="text-sm text-slate-500 mt-2 text-center max-w-md">
          Uploading video assignment for <span className="font-semibold text-indigo-600">{matchedSubject}</span> to <span className="font-semibold text-indigo-600">{faculty.fullname}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 text-sm font-semibold">
            {error}
          </div>
        )}
        {/* Title */}
        <div className="flex flex-col">
          <label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assignment Title</label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Video Presentation - Week 3"
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
          />
        </div>

        {/* Video Link */}
        <div className="flex flex-col">
          <label htmlFor="videoUrl" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Video Link (Google Drive / YouTube / OneDrive)</label>
          <input
            id="videoUrl"
            type="url"
            required
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or Drive shared link"
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col">
          <label htmlFor="description" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Additional Description / Notes</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter any comments or notes for your faculty member..."
            rows={4}
            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200 text-sm resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-2">
          <Link
            href="/studentDashboard"
            className="w-1/3 inline-flex items-center justify-center h-12 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors active:scale-[0.98]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="w-2/3 inline-flex items-center justify-center h-12 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-xl hover:shadow-indigo-100 transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit Assignment"}
          </button>
        </div>
      </form>
    </div>
  );
}
