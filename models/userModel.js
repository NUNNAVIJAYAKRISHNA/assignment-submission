import mongoose from "mongoose";

const teachingSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },

  section: {
    type: String,
    uppercase: true,
    required: true
  },

  subject: {
    type: String,
    required: true
  }
}, { _id: false });

const userSchema = new mongoose.Schema({

  fullname: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["student", "faculty"],
    default: "student"
  },

  // student fields
  rollNumber: {
    type: String,
    default: null
  },

  yearOfStudy: {
    type: Number,
    default: null
  },

  semester: {
    type: Number,
    default: null
  },

  section: {
    type: String,
    uppercase: true,
    default: null
  },

  // faculty fields
  designation: {
    type: String,
    default: null
  },

  teaching: {
    type: [teachingSchema],
    default: []
  }

}, { timestamps: true });

export default mongoose.model("User", userSchema);