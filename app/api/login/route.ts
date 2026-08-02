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
    return NextResponse.json(
      { success: false, message: error.message || "Login failed" },
      { status: 401 }
    );
  }
}
