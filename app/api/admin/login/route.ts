import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signToken } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const expectedEmail = process.env.ADMIN_EMAIL || "admin@classvault.edu";
    const expectedPassword = process.env.ADMIN_PASSWORD || "Admin@123456";

    if (
      !email ||
      !password ||
      email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase() ||
      password !== expectedPassword
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid administrator credentials" },
        { status: 401 }
      );
    }

    const token = signToken({
      _id: "admin",
      email: expectedEmail,
      role: "admin"
    });

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
      redirectUrl: "/adminDashboard"
    });
  } catch (error: any) {
    console.error("Admin Login API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Admin login failed" },
      { status: 500 }
    );
  }
}
