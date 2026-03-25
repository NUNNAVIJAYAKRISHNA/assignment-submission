import express from "express";
import {
  registrationPage,
  facultyRegistration,
  loginPage,
} from "../controllers/pageController.js";
import { registerUser, login } from "../controllers/authController.js";

const router = express.Router();

// Registration routes
router.get("/registration", registrationPage);
router.post("/register", registerUser);

// Faculty registration routes
router.get("/faculty/register", facultyRegistration);
router.post("/faculty/register", registerUser);

// Login routes
router.get("/login", loginPage);
router.post("/login", login);

export default router;