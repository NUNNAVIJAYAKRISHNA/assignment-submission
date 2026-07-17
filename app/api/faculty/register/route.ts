import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "../../../../lib/db";
import User from "../../../../models/userModel";
import { createUser } from "../../../../utils/createUser";
import { sendVerificationEmail } from "../../../../utils/sendEmail";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    body.role = "faculty";

    const userData = createUser(body);
    const user = new User(userData);
    
    const token = crypto.randomBytes(32).toString("hex");
    user.verificationToken = token;
    user.verificationTokenExpires = new Date(Date.now() + 3600000); // 1 hour
    
    await user.save();
    
    try {
      await sendVerificationEmail(user.email, token);
    } catch (emailError: any) {
      console.error("Failed to send verification email, rolling back registration:", emailError);
      await User.deleteOne({ _id: user._id }); // Rollback database record
      throw new Error(`Failed to send verification email: ${emailError.message || emailError}. Registration cancelled.`);
    }
    
    return NextResponse.json({
      success: true,
      message: "Verification email sent. Please check your inbox."
    });
  } catch (error: any) {
    console.error("Faculty Registration API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
