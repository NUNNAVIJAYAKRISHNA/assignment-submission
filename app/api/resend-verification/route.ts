import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "../../../lib/db";
import User from "../../../models/userModel";
import { sendVerificationEmail } from "../../../utils/sendEmail";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email } = await req.json();

    // Input validation - ensure email is a string
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    // Unified non-enumerating response regardless of user existence or verification status
    if (!user || user.isVerified) {
      return NextResponse.json({
        success: true,
        message: "If the email is registered and pending verification, a verification email has been sent."
      });
    }

    // Check if existing token is still valid and unexpired (issued < 5 minutes ago)
    const now = Date.now();
    const existingTokenValid =
      user.verificationToken &&
      user.verificationTokenExpires &&
      user.verificationTokenExpires.getTime() > now &&
      (user.verificationTokenExpires.getTime() - now) > 300000; // 5 minutes remaining

    if (existingTokenValid) {
      // Reuse existing token and check cooldown
      const timeSinceIssue = 3600000 - (user.verificationTokenExpires.getTime() - now);
      if (timeSinceIssue < 60000) {
        return NextResponse.json(
          { success: false, message: "Please wait at least 60 seconds before requesting another verification email." },
          { status: 429 }
        );
      }
      // Token is valid and cooldown passed - send email with existing token
      try {
        await sendVerificationEmail(user.email, user.verificationToken);
        return NextResponse.json({
          success: true,
          message: "Verification email sent! Check your inbox."
        });
      } catch (emailError: any) {
        console.error("Failed to send verification email:", emailError);
        return NextResponse.json(
          { success: false, message: "Unable to dispatch verification email at this time. Please try again later." },
          { status: 500 }
        );
      }
    }

    // Generate new verification token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenExpires = new Date(Date.now() + 3600000); // 1 hour expiry

    // Store previous token to restore on failure
    const previousToken = user.verificationToken;
    const previousTokenExpires = user.verificationTokenExpires;

    user.verificationToken = token;
    user.verificationTokenExpires = tokenExpires;

    await user.save();

    try {
      await sendVerificationEmail(user.email, token);
    } catch (emailError: any) {
      console.error("Failed to send verification email:", emailError);
      // Rollback to previous token on email failure
      user.verificationToken = previousToken;
      user.verificationTokenExpires = previousTokenExpires;
      await user.save();
      return NextResponse.json(
        { success: false, message: "Unable to dispatch verification email at this time. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent! Check your inbox."
    });
  } catch (error: any) {
    console.error("Resend Verification API Error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to dispatch verification email at this time. Please try again later." },
      { status: 500 }
    );
  }
}