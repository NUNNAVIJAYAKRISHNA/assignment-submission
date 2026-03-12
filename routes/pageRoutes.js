import express from "express";
import {
  homePage,
  registrationPage,
  registerUser
} from "../controllers/pageController.js";

const router = express.Router();

router.get("/", homePage);

router.get("/registration", registrationPage);

router.post("/registration", registerUser);

export default router;