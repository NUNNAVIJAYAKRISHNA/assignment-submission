import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/userModel";
import { getUserSession } from "../../../../lib/auth";

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { fullname, yearOfStudy, semester, section, branch, designation } = await req.json();

    if (!fullname || !fullname.trim()) {
      return NextResponse.json(
        { success: false, message: "Full name is required" },
        { status: 400 }
      );
    }

    user.fullname = fullname.trim();

    // Both student and faculty can edit branch
    if (branch !== undefined) {
      user.branch = branch ? branch.trim() : null;
    }

    if (user.role === "student") {
      if (yearOfStudy !== undefined && yearOfStudy !== null) {
        const yearNum = Number(yearOfStudy);
        if (isNaN(yearNum) || yearNum <= 0) {
          return NextResponse.json(
            { success: false, message: "Invalid year of study" },
            { status: 400 }
          );
        }
        user.yearOfStudy = yearNum;
      }
      
      if (semester !== undefined && semester !== null) {
        const semNum = Number(semester);
        if (isNaN(semNum) || semNum <= 0) {
          return NextResponse.json(
            { success: false, message: "Invalid semester" },
            { status: 400 }
          );
        }
        user.semester = semNum;
      }

      if (section !== undefined && section !== null) {
        user.section = section.trim().toUpperCase() || null;
      }
    } else if (user.role === "faculty") {
      if (designation !== undefined) {
        user.designation = designation ? designation.trim() : null;
      }
    }

    await user.save();

    // Return the updated user object (omitting password)
    const updatedUser = {
      _id: user._id.toString(),
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      yearOfStudy: user.yearOfStudy,
      semester: user.semester,
      section: user.section,
      branch: user.branch,
      designation: user.designation,
    };

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Update profile API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
