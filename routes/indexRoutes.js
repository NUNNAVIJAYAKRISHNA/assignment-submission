import express from "express";
import { homePage } from "../controllers/userController.js";

const router = express.Router();

router.get("/", homePage);

export default router;