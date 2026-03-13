import bcrypt from "bcrypt";
import User from "../models/userModel.js";

export async function loginUser(req, res) {

  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.send("User not found");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.send("Invalid password");
    }

    if (user.role === "student") {
      return res.redirect("/studentDashboard");
    }

    if (user.role === "faculty") {
      return res.redirect("/facultyDashboard");
    }

    res.redirect("/");

  } catch (error) {

    console.error(error);
    res.status(500).send("Login failed");

  }

}