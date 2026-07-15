import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
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
