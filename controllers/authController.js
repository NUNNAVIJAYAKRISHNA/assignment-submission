import User from "../models/userModel.js";
import { createUser } from "../utils/createUser.js";
import { loginUser } from "../utils/loginUser.js";

import crypto from "crypto";
import { sendVerificationEmail } from "../utils/sendEmail.js";

export async function registerUser(req, res) {
  try {
    const userData = createUser(req.body);
    const user = new User(userData);
    const token = crypto.randomBytes(32).toString("hex");
    user.verificationToken = token;
    user.verificationTokenExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    await sendVerificationEmail(user.email, token);
    res.send("Verification email sent. Please check your inbox.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Registration failed");
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await loginUser(email, password);
    req.session.user = user;
    if (user.role === "student") {
      return res.redirect("/studentDashboard");
    }
    if (user.role === "faculty") {
      return res.redirect("/facultyDashboard");
    }
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(401).send(error.message || "Login failed");
  }
}