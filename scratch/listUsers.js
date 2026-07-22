const mongoose = require("mongoose");
require("dotenv").config();

// Define a minimal User Schema to query
const UserSchema = new mongoose.Schema({
  fullname: String,
  email: String,
  role: String,
  isVerified: Boolean,
  teaching: Array,
  yearOfStudy: Number,
  section: String
}, { collection: "users" });

async function listUsers() {
  const uri = process.env.MONGO_DB_URI;
  console.log("Connecting to:", uri);
  try {
    await mongoose.connect(uri);
    console.log("Connected. Fetching users...");
    const User = mongoose.models.User || mongoose.model("User", UserSchema);
    const users = await User.find({});
    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`- ${u.fullname} (${u.email}) [Role: ${u.role}, Verified: ${u.isVerified}]`);
      if (u.role === 'faculty') {
        console.log(`  Teaching:`, JSON.stringify(u.teaching));
      } else {
        console.log(`  Student: Year ${u.yearOfStudy}, Sec ${u.section}`);
      }
    });
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

listUsers();
