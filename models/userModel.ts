import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcrypt";

export interface ITeaching {
  year: number;
  section: string;
  subject: string;
  assignmentsEnabled?: boolean;
}

export interface IUser extends Document {
  fullname: string;
  email: string;
  password?: string;
  role: "student" | "faculty";
  rollNumber?: string | null;
  yearOfStudy?: number | null;
  semester?: number | null;
  section?: string | null;
  branch?: string | null;
  designation?: string | null;
  teaching?: ITeaching[];
  isVerified: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const teachingSchema = new Schema<ITeaching>({
  year: { type: Number, required: true },
  section: { type: String, uppercase: true, required: true },
  subject: { type: String, required: true },
  assignmentsEnabled: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new Schema<IUser>({
  fullname: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "faculty"], default: "student" },
  rollNumber: { type: String, default: null },
  yearOfStudy: { type: Number, default: null },
  semester: { type: Number, default: null },
  section: { type: String, uppercase: true, default: null },
  branch: { type: String, default: null },
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

userSchema.pre<IUser>("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  try {
    const hashedPassword = await bcrypt.hash(this.password!, 10);
    this.password = hashedPassword;
  } catch (err: any) {
    throw err;
  }
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default User;
export type UserType = IUser & { _id: mongoose.Types.ObjectId };
