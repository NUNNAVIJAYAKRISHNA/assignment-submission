import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/userModel";
import { getUserSession } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUserSession();

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    // 1. Fetch all faculty
    const rawFaculty = await User.find({ role: "faculty" })
      .select("fullname email isVerified designation branch teaching createdAt")
      .sort({ fullname: 1 });

    const faculty = rawFaculty.map((f) => ({
      _id: f._id.toString(),
      fullname: f.fullname,
      email: f.email,
      isVerified: !!f.isVerified,
      designation: f.designation || "Faculty",
      branch: f.branch || "N/A",
      teaching: (f.teaching || []).map((t) => ({
        year: t.year,
        section: t.section,
        subject: t.subject,
        assignmentsEnabled: !!t.assignmentsEnabled,
      })),
      createdAt: f.createdAt ? f.createdAt.toISOString() : null,
    }));

    // 2. Fetch all students
    const rawStudents = await User.find({ role: "student" })
      .select("fullname rollNumber email isVerified branch yearOfStudy section semester createdAt")
      .sort({ rollNumber: 1, fullname: 1 });

    // 3. Structure students by Year (1, 2, 3, 4) and Section (A, B, C...)
    const studentsByYear: Record<number, Record<string, any[]>> = {
      1: {},
      2: {},
      3: {},
      4: {},
    };

    rawStudents.forEach((st) => {
      const year = st.yearOfStudy && st.yearOfStudy >= 1 && st.yearOfStudy <= 4 ? st.yearOfStudy : 1;
      const section = st.section ? st.section.toUpperCase().trim() : "Unassigned";

      if (!studentsByYear[year]) {
        studentsByYear[year] = {};
      }

      if (!studentsByYear[year][section]) {
        studentsByYear[year][section] = [];
      }

      studentsByYear[year][section].push({
        _id: st._id.toString(),
        fullname: st.fullname,
        rollNumber: st.rollNumber || "N/A",
        email: st.email,
        isVerified: !!st.isVerified,
        branch: st.branch || "N/A",
        semester: st.semester || 1,
        createdAt: st.createdAt ? st.createdAt.toISOString() : null,
      });
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalFaculty: faculty.length,
        totalStudents: rawStudents.length,
      },
      faculty,
      studentsByYear,
    });
  } catch (error: any) {
    console.error("Get admin data API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
