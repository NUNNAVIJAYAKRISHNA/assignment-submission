import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/userModel";
import Submission from "../../../../models/submissionModel";
import { getUserSession } from "../../../../lib/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUserSession();
    
    if (!user || user.role !== "student") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { facultyId, title, videoUrl, description } = await req.json();

    if (!facultyId || !title || !videoUrl) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Verify faculty exists
    const faculty = await User.findById(facultyId);
    if (!faculty || faculty.role !== "faculty") {
      return NextResponse.json({ success: false, message: "Faculty not found" }, { status: 404 });
    }

    // Verify matched teaching configuration and check if assignments are enabled
    const matchedTeaching = faculty.teaching?.find(
      (t) => t.year === user.yearOfStudy && t.section === user.section
    );

    if (!matchedTeaching) {
      return NextResponse.json({ success: false, message: "This faculty member does not teach your class" }, { status: 400 });
    }

    if (!matchedTeaching.assignmentsEnabled) {
      return NextResponse.json({ success: false, message: "Assignments are currently disabled for this class" }, { status: 403 });
    }

    // Save or update the submission
    const submission = await Submission.findOneAndUpdate(
      {
        studentId: user._id,
        facultyId: faculty._id,
        subject: matchedTeaching.subject
      },
      {
        studentName: user.fullname,
        studentRollNumber: user.rollNumber || "N/A",
        studentYear: user.yearOfStudy || 0,
        studentSection: user.section || "",
        title,
        videoUrl,
        description: description || ""
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    console.error("Submit assignment API error:", error);
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}
