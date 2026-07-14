import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "../../../lib/db";
import User from "../../../models/userModel";
import { createUser } from "../../../utils/createUser";
import { sendVerificationEmail } from "../../../utils/sendEmail";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    body.role = "student";

    const userData = createUser(body);
    const user = new User(userData);
    
    const token = crypto.randomBytes(32).toString("hex");
    user.verificationToken = token;
    user.verificationTokenExpires = new Date(Date.now() + 3600000); // 1 hour
    
    await user.save();
    await sendVerificationEmail(user.email, token);
    
    return NextResponse.json({
      success: true,
      message: "Verification email sent. Please check your inbox."
    });
  } catch (error: any) {
    console.error("Student Registration API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
