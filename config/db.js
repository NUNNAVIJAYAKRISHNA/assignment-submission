import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

// import { MongoClient } from "mongodb";

const uri = process.env.MONGO_DB_URI;

const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("DB connection failed:", error);
  }
}

export default connectDB;