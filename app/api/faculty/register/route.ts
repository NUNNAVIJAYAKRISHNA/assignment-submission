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

    // Verify Faculty Security Code (FACULTY_CODE in .env)
    const serverFacultyCode = process.env.FACULTY_CODE;
    if (!serverFacultyCode) {
      console.error("FACULTY_CODE is not defined in environment variables.");
      return NextResponse.json(
        { success: false, message: "Faculty registration is currently disabled by administrator." },
        { status: 503 }
      );
    }

    const { facultyCode, fullname, email, password, designation } = body;
    const cleanServerCode = serverFacultyCode.replace(/^['"]|['"]$/g, "").trim();

    if (!facultyCode || typeof facultyCode !== "string" || facultyCode.trim() !== cleanServerCode) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing Faculty Security Code. Registration denied." },
        { status: 403 }
      );
    }

    // Validate mandatory fields
    if (!fullname?.trim() || !email?.trim() || !password?.trim() || !designation?.trim()) {
      return NextResponse.json(
        { success: false, message: "All mandatory fields (Full Name, Email, Password, Designation) are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An account with this email address already exists." },
        { status: 409 }
      );
    }
    
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
      return NextResponse.json(
        { success: false, message: "Failed to send verification email. Registration was cancelled. Please try again." },
        { status: 500 }
      );
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
