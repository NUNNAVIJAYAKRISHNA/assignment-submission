import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "../../../lib/db";
import { loginUser } from "../../../utils/loginUser";
import { signToken } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();
    const user = await loginUser(email, password);

    // Check if user's email is verified
    if (!user.isVerified) {
      return NextResponse.json(
        {
          success: false,
          message: "Email not verified. Please check your inbox for the verification link.",
          code: "EMAIL_NOT_VERIFIED"
        },
        { status: 403 }
      );
    }

    // Set jwt token in cookie
    const token = signToken(user);

    const cookieStore = await cookies();
    cookieStore.set({
      name: "session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 // 1 day
    });

    return NextResponse.json({
      success: true,
      role: user.role,
      redirectUrl: user.role === "student" ? "/studentDashboard" : "/facultyDashboard"
    });
  } catch (error: any) {
    console.error("Login API Error:", error);

    // Check if error is an authentication/validation error vs system error
    const isAuthError = error.message && (
      error.message.includes("Invalid") ||
      error.message.includes("not found") ||
      error.message.includes("incorrect") ||
      error.message.includes("credentials") ||
      error.message.includes("unauthorized")
    );

    if (isAuthError) {
      return NextResponse.json(
        { success: false, message: error.message || "Invalid credentials" },
        { status: 401 }
      );
    }

    // System errors (DB connection, etc.) should return 500
    return NextResponse.json(
      { success: false, message: "An error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
