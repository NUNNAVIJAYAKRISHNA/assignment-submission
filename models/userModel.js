import mongoose from "mongoose";
import bcrypt from "bcrypt";


const teachingSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  section: { type: String, uppercase: true, required: true },
  subject: { type: String, required: true }
}, { _id: false });


const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "faculty"], default: "student" },
  rollNumber: { type: String, default: null },
  yearOfStudy: { type: Number, default: null },
  semester: { type: Number, default: null },
  section: { type: String, uppercase: true, default: null },
  designation: { type: String, default: null },
  teaching: { type: [teachingSchema], default: [] },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpires: {
    type: Date,
    default: null
  }
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  try {
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
  } catch (err) {
    next(err);
  }
});
export default mongoose.model("User", userSchema);