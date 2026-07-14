import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import { loginUser } from "../../../utils/loginUser";
import { signToken } from "../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();
    const user = await loginUser(email, password);

    // Set jwt token in cookie
    const token = signToken(user);
    const response = NextResponse.json({
      success: true,
      role: user.role,
      redirectUrl: user.role === "student" ? "/studentDashboard" : "/facultyDashboard"
    });

    response.cookies.set({
      name: "session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Login failed" },
      { status: 401 }
    );
  }
}
