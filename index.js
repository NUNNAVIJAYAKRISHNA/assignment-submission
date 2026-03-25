import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import connectDB from "./config/db.js";
import pageRoutes from "./routes/pageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "secret_key",
  resave: false,
  saveUninitialized: false
}));

await connectDB();

app.set("view engine", "ejs");
app.use(express.static("public"));

// Mount the routers
app.use("/", pageRoutes);
app.use("/", authRoutes);
app.use("/", dashboardRoutes);

app.listen(8000, () => {
  console.log("http://localhost:8000");
});