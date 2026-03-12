export function homePage(req, res) {
  res.render("index");
};

export function registrationPage(req, res) {
  res.render("registrationPage");
};

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