import express from "express";
import { homePage } from "../controllers/pageController.js";

const router = express.Router();

router.get("/", homePage);

export default router;