import express from "express";
import { facultyDashboard } from "../controllers/facultyController.js";
import { studentDashboard } from "../controllers/studentController.js";

const router = express.Router();

// Middleware to protect routes and ensure a user is logged in.
const isAuthenticated = (req, res, next) => {
  if (req.session?.user) {
    return next(); // User is authenticated, proceed to the route.
  }
  // User is not authenticated, redirect to the login page.
  res.redirect("/login");
};

router.get("/studentDashboard", isAuthenticated, studentDashboard);
router.get("/facultyDashboard", isAuthenticated, facultyDashboard);

export default router;