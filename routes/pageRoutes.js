import express from "express";
import {
  homePage,
  registrationPage,
  registerUser,
  facultyRegistration,
  loginPage,
  studentDashboard,
  facultyDashboard
} from "../controllers/pageController.js";
import { loginUser } from "../utils/loginUser.js";

const router = express.Router();

router.get("/", homePage);

router.get("/registration", registrationPage);

router.get("/faculty/register", facultyRegistration);


router.post("/faculty/register", registerUser);

router.post("/register", registerUser);

router.get("/login", loginPage);
router.post("/login", loginUser);

router.get("/studentDashboard", studentDashboard);
router.get("/facultyDashboard", facultyDashboard);

export default router;