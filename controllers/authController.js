import User from "../models/userModel.js";
import { createUser } from "../utils/createUser.js";
import { loginUser } from "../utils/loginUser.js";

export async function registerUser(req, res) {

  try {

    const userData = createUser(req.body);

    const user = new User(userData);

    await user.save();

    res.redirect("/");

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