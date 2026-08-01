import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import User from "../../../models/userModel";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { token, email, newPassword } = await req.json();

    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Missing required fields." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Query user by email and non-expired reset password token
    const user = await User.findOne({
      email: cleanEmail,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired password reset link. Please request a new one." },
        { status: 400 }
      );
    }

    // Setting password will automatically trigger the Mongoose pre("save") bcrypt hashing hook
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Your password has been updated successfully! You can now log in."
    });
  } catch (error: any) {
    console.error("Reset Password API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to reset password." },
      { status: 500 }
    );
  }
}
