import bcrypt from "bcrypt";
import User from "../models/userModel.js";

export async function loginUser(email, password) {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User not found");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new Error("Invalid password");
    }

    return user;
}