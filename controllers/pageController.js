export function homePage(req, res) {
  res.render("index");
};

export function registrationPage(req, res) {
  res.render("registrationPage");
};

export function facultyRegistration(req, res) {
  res.render("facultyRegistration");
}

export function studentDashboard(req, res) {
  res.render("studentDashboard");
}
export function facultyDashboard(req, res) {
  res.render("facultyDashboard");
}

export function loginPage(req, res) {
  res.render("loginPage");
}

import User from "../models/userModel.js";
import { createUser } from "../utils/createUser.js";

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