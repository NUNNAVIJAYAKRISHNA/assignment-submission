import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import connectDB from "./db";
import User, { IUser } from "../models/userModel";

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "secret_key");

if (!JWT_SECRET) {
  throw new Error("Please define the JWT_SECRET environment variable inside your environment configuration.");
}

export interface SessionUser {
  _id: string;
  email: string;
  role: "student" | "faculty" | "admin";
}

export function signToken(user: any): string {
  return jwt.sign(
    {
      _id: user._id ? user._id.toString() : "admin",
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch (error) {
    return null;
  }
}

export async function getUserSession(): Promise<any | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  if (payload.role === "admin") {
    return {
      _id: "admin",
      fullname: "System Administrator",
      email: payload.email,
      role: "admin",
    };
  }

  await connectDB();
  const user = await User.findById(payload._id);
  return user;
}
