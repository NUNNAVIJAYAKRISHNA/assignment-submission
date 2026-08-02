import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import User from "../../../../../models/userModel";
import Submission from "../../../../../models/submissionModel";
import { getUserSession } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const adminUser = await getUserSession();

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found in database" },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, message: "Only unverified users can be deleted via this action" },
        { status: 400 }
      );
    }

    const deletedUserName = user.fullname;
    const deletedUserEmail = user.email;

    // Remove any associated submissions from database
    await Submission.deleteMany({
      $or: [{ studentId: userId }, { facultyId: userId }],
    });

    // Delete user from database
    await User.deleteOne({ _id: userId });

    return NextResponse.json({
      success: true,
      message: `Unverified user ${deletedUserName} (${deletedUserEmail}) deleted successfully from database.`,
      deletedUserId: userId,
    });
  } catch (error: any) {
    console.error("Admin user deletion error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
