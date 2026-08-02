import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "../../../lib/db";
import User from "../../../models/userModel";
import { createUser } from "../../../utils/createUser";
import { sendVerificationEmail } from "../../../utils/sendEmail";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { fullname, email, password, rollNumber, branch, yearOfStudy, semester, section } = body;

    // Validate mandatory fields for student registration
    if (
      !fullname?.trim() ||
      !email?.trim() ||
      !password?.trim() ||
      !rollNumber?.trim() ||
      !branch?.trim() ||
      yearOfStudy === undefined ||
      yearOfStudy === null ||
      yearOfStudy === "" ||
      semester === undefined ||
      semester === null ||
      semester === "" ||
      !section?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All registration fields (Full Name, Email, Password, Registration Number, Department/Branch, Year of Study, Semester, Section) are mandatory.",
        },
        { status: 400 }
      );
    }

    body.role = "student";

    const userData = createUser(body);

    if (userData.semester === null || userData.semester < 1 || userData.semester > 2) {
      return NextResponse.json({ success: false, message: "Semester is mandatory and must be 1 or 2" }, { status: 400 });
    }
    if (userData.yearOfStudy === null || userData.yearOfStudy < 1 || userData.yearOfStudy > 4) {
      return NextResponse.json({ success: false, message: "Year of study is mandatory and must be between 1 and 4" }, { status: 400 });
    }

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
    console.error("Student Registration API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
