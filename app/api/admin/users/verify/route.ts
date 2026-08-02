import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../../lib/db";
import User from "../../../../../models/userModel";
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

    // Perform database level update
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found in database" },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { success: false, message: "User is already verified" },
        { status: 400 }
      );
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    return NextResponse.json({
      success: true,
      message: `User ${user.fullname} (${user.email}) has been verified successfully at database level.`,
      user: {
        _id: user._id.toString(),
        fullname: user.fullname,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error: any) {
    console.error("Admin user verification error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
