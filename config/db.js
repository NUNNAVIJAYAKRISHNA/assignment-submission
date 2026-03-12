import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function connectDB() {
  try {

    await mongoose.connect(process.env.MONGO_DB_URI);

    console.log("MongoDB Connected");
    console.log("DB Name:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);

  } catch (error) {

    console.error("DB connection failed:", error);
    process.exit(1);

  }
}

export default connectDB;