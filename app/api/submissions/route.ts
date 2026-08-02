import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/db";
import Submission from "../../../models/submissionModel";
import { getUserSession } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUserSession();
    if (!user || user.role !== "student") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Retrieve all submissions for this student, populated with faculty info
    const submissions = await Submission.find({ studentId: user._id })
      .populate("facultyId", "fullname")
      .sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, submissions });
  } catch (error: any) {
    console.error("Get submissions API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
