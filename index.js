import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import indexRoutes from "./routes/indexRoutes.js";

dotenv.config();

const app = express();

connectDB();

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use("/", indexRoutes);

app.listen(8000, () => {
  console.log("http://localhost:8000");
});