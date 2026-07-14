import connectDB from "../../lib/db";
import User from "../../models/userModel";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface VerifyPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyPageProps) {
  const { token } = await searchParams;

  let status: "success" | "invalid" | "error" = "invalid";

  if (token) {
    try {
      await connectDB();
      const user = await User.findOne({
        verificationToken: token,
        verificationTokenExpires: { $gt: new Date() },
      });

      if (user) {
        user.isVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpires = null;
        await user.save();
        status = "success";
      }
    } catch (err) {
      console.error("Email verification error:", err);
      status = "error";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-hush">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-slate-100/80 p-8 sm:p-10 text-center relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600"></div>

        {status === "success" && (
          <div className="space-y-6 relative">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Email Verified</h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Your account has been successfully verified! You can now log in to access your dashboard.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-md hover:shadow-xl hover:shadow-indigo-100 transform active:scale-[0.98] transition-all"
              >
                Go to Login
              </Link>
            </div>
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-6 relative">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Verification Link Expired</h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              The verification token is invalid or has expired. Please log in to request a new link, or register again.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center h-11 rounded-xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transform active:scale-[0.98] transition-all"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6 relative">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Verification Failed</h1>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              An error occurred during account verification. Please verify your internet connection and try again.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center h-11 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transform active:scale-[0.98] transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
