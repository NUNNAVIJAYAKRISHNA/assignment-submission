import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/userModel";
import { getUserSession } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUserSession();
    
    if (!user || user.role !== "faculty") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { year, section, subject, enabled } = await req.json();

    if (year === undefined || section === undefined || enabled === undefined) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    // Update the teaching array element for this faculty
    const elemFilter: any = { "elem.year": year, "elem.section": section };
    if (subject) {
      elemFilter["elem.subject"] = subject;
    }

    const result = await User.updateOne(
      { _id: user._id },
      { $set: { "teaching.$[elem].assignmentsEnabled": enabled } },
      { arrayFilters: [elemFilter] }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "Class not found for this faculty" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Status updated successfully" });
  } catch (error: any) {
    console.error("Toggle assignments API error:", error);
    return NextResponse.json({ success: false, message: error.message || "Internal server error" }, { status: 500 });
  }
}
