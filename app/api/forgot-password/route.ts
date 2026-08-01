import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "../../../lib/db";
import User from "../../../models/userModel";
import { sendPasswordResetEmail } from "../../../utils/sendEmail";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No account registered with this email address." },
        { status: 404 }
      );
    }

    // Generate random 32-byte token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour expiry

    await user.save();

    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (emailError: any) {
      console.error("Failed to send password reset email:", emailError);
      // Rollback token on email failure
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      throw new Error(`Failed to send password reset email: ${emailError.message || emailError}`);
    }

    return NextResponse.json({
      success: true,
      message: "Password verification link sent. Please check your email inbox."
    });
  } catch (error: any) {
    console.error("Forgot Password API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process request." },
      { status: 500 }
    );
  }
}
