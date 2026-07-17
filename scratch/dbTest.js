const mongoose = require("mongoose");
require("dotenv").config();

async function testConn() {
  const uri = process.env.MONGO_DB_URI;
  console.log("URI:", uri);
  try {
    await mongoose.connect(uri);
    console.log("SUCCESSFULLY CONNECTED");
    process.exit(0);
  } catch (err) {
    console.error("CONNECTION FAILED:", err);
    process.exit(1);
  }
}

testConn();
