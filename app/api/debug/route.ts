import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "../../../lib/db";
import { verifyToken } from "../../../lib/auth";
import User from "../../../models/userModel";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;

    const dbUriExists = !!process.env.MONGO_DB_URI;
    const jwtSecretExists = !!process.env.JWT_SECRET;
    const nodeEnv = process.env.NODE_ENV;

    let dbStatus = "Not connected";
    let dbUserFound = false;
    let dbError = null;

    try {
      await connectDB();
      dbStatus = "Connected successfully";
    } catch (e: any) {
      dbStatus = "Connection failed";
      dbError = e.message || String(e);
    }

    let tokenPayload = null;
    let verifyError = null;

    if (token) {
      try {
        tokenPayload = verifyToken(token);
      } catch (e: any) {
        verifyError = e.message || String(e);
      }
    }

    if (tokenPayload && tokenPayload._id && dbStatus === "Connected successfully") {
      try {
        const user = await User.findById(tokenPayload._id);
        dbUserFound = !!user;
      } catch (e: any) {
        dbUserFound = false;
      }
    }

    return NextResponse.json({
      env: {
        dbUriExists,
        jwtSecretExists,
        nodeEnv,
      },
      db: {
        status: dbStatus,
        error: dbError,
        userFound: dbUserFound,
      },
      cookie: {
        hasCookie: !!token,
        tokenLength: token ? token.length : 0,
      },
      token: {
        payload: tokenPayload,
        verifyError,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
