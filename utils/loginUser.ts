import bcrypt from "bcrypt";
import User, { IUser } from "../models/userModel";

export async function loginUser(email: string, password?: string): Promise<IUser> {
    if (!password) {
      throw new Error("Password is required");
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      throw new Error("User not found");
    }

    const match = await bcrypt.compare(password, user.password || "");

    if (!match) {
      throw new Error("Invalid password");
    }

    return user;
}
