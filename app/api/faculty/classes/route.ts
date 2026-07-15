import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../../lib/db";
import User from "../../../../models/userModel";
import { getUserSession } from "../../../../lib/auth";

// Add a class
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUserSession();
    if (!user || user.role !== "faculty") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { year, section, subject } = await req.json();

    if (!year || !section || !subject) {
      return NextResponse.json(
        { success: false, message: "Missing required fields (year, section, subject)" },
        { status: 400 }
      );
    }

    const yearNum = Number(year);
    if (isNaN(yearNum) || yearNum <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid year of study" },
        { status: 400 }
      );
    }

    const cleanSection = section.trim().toUpperCase();
    const cleanSubject = subject.trim();

    if (!cleanSection || !cleanSubject) {
      return NextResponse.json(
        { success: false, message: "Section and Subject cannot be empty" },
        { status: 400 }
      );
    }

    // Initialize teaching array if empty
    if (!user.teaching) {
      user.teaching = [];
    }

    // Check if configuration already exists
    const exists = user.teaching.some(
      (t) =>
        t.year === yearNum &&
        t.section.toUpperCase() === cleanSection &&
        t.subject.toLowerCase() === cleanSubject.toLowerCase()
    );

    if (exists) {
      return NextResponse.json(
        { success: false, message: "This class is already in your list" },
        { status: 400 }
      );
    }

    // Add class config
    user.teaching.push({
      year: yearNum,
      section: cleanSection,
      subject: cleanSubject,
      assignmentsEnabled: false,
    });

    await user.save();

    return NextResponse.json({ success: true, teaching: user.teaching });
  } catch (error: any) {
    console.error("Add class API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Remove a class
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const user = await getUserSession();
    if (!user || user.role !== "faculty") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { year, section, subject } = await req.json();

    if (!year || !section || !subject) {
      return NextResponse.json(
        { success: false, message: "Missing required fields (year, section, subject)" },
        { status: 400 }
      );
    }

    const yearNum = Number(year);
    const cleanSection = section.trim().toUpperCase();
    const cleanSubject = subject.trim();

    if (!user.teaching || user.teaching.length === 0) {
      return NextResponse.json(
        { success: false, message: "No classes found to remove" },
        { status: 400 }
      );
    }

    // Filter out the matching class configuration
    const originalLength = user.teaching.length;
    user.teaching = user.teaching.filter(
      (t) =>
        !(
          t.year === yearNum &&
          t.section.toUpperCase() === cleanSection &&
          t.subject.toLowerCase() === cleanSubject.toLowerCase()
        )
    );

    if (user.teaching.length === originalLength) {
      return NextResponse.json(
        { success: false, message: "Class not found in your list" },
        { status: 404 }
      );
    }

    await user.save();

    return NextResponse.json({ success: true, teaching: user.teaching });
  } catch (error: any) {
    console.error("Remove class API error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
