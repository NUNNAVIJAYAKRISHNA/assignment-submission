import express from "express";
import {
  registrationPage,
  facultyRegistration,
  loginPage,
} from "../controllers/pageController.js";
import { registerUser, login } from "../controllers/authController.js";
import { verifyEmail } from "../controllers/verificationController.js";

const router = express.Router();

// Registration routes
router.get("/registration", registrationPage);
router.post("/register", registerUser);

// Faculty registration routes
router.get("/faculty/register", facultyRegistration);
router.post("/faculty/register", registerUser);

router.get("/verify-email", verifyEmail);

// Login routes
router.get("/login", loginPage);
router.post("/login", login);

export default router;