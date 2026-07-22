import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/userModel";
import Submission from "../../../../models/submissionModel";
import { getUserSession } from "../../../../lib/auth";

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUserSession();
    if (!user || user.role !== "student") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { submissionId, title, videoUrl, description } = await req.json();

    if (!submissionId || !title || !videoUrl) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the submission and make sure it belongs to the logged-in student
    const submission = await Submission.findOne({
      _id: submissionId,
      studentId: user._id,
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, message: "Submission not found or unauthorized" },
        { status: 404 }
      );
    }

    // Verify if assignments are enabled for this class by the faculty member
    const faculty = await User.findById(submission.facultyId);
    if (!faculty || faculty.role !== "faculty") {
      return NextResponse.json(
        { success: false, message: "Associated faculty member not found" },
        { status: 404 }
      );
    }

    const matchedTeaching = faculty.teaching?.find(
      (t) =>
        t.year === submission.studentYear &&
        t.section.toUpperCase() === submission.studentSection.toUpperCase() &&
        t.subject.toLowerCase() === submission.subject.toLowerCase()
    );

    if (!matchedTeaching) {
      return NextResponse.json(
        { success: false, message: "No class configuration found for this submission" },
        { status: 400 }
      );
    }

    if (!matchedTeaching.assignmentsEnabled) {
      return NextResponse.json(
        { success: false, message: "Submissions are currently locked/disabled for this class by the faculty" },
        { status: 403 }
      );
    }

    // Update fields
    submission.title = title.trim();
    submission.videoUrl = videoUrl.trim();
    submission.description = (description || "").trim();

    await submission.save();

    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    console.error("Update submission API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
