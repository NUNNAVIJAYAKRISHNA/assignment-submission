const connectDB = require("../lib/db").default;
const User = require("../models/userModel").default;
require("dotenv").config();

async function checkUsers() {
  await connectDB();
  const users = await User.find({ email: "teststudent@gmail.com" });
  console.log("USERS:", users);
  process.exit(0);
}

checkUsers();
