const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const UserSchema = new mongoose.Schema({
  email: String,
  password: { type: String, required: true },
  role: String,
  isVerified: Boolean,
}, { collection: "users" });

async function resetPassword(email, newPassword) {
  const uri = process.env.MONGO_DB_URI;
  if (!uri) {
    console.error("MONGO_DB_URI is not defined in environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const User = mongoose.models.User || mongoose.model("User", UserSchema);
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.error(`User with email "${email}" not found.`);
      process.exit(1);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    // ensure user is verified so they can log in
    if (!user.isVerified) {
      user.isVerified = true;
      console.log("Also updated user.isVerified = true.");
    }
    await user.save();

    console.log(`Successfully updated password for ${user.email} (Role: ${user.role}).`);
    process.exit(0);
  } catch (err) {
    console.error("Error updating password:", err);
    process.exit(1);
  }
}

const targetEmail = process.argv[2] || "cppapril25@gmail.com";
const newPassword = process.argv[3] || "Password@123";

console.log(`Resetting password for: ${targetEmail}`);
console.log(`New password will be: ${newPassword}`);
resetPassword(targetEmail, newPassword);
