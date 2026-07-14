import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISubmission extends Document {
  studentId: mongoose.Types.ObjectId;
  studentName: string;
  studentRollNumber: string;
  studentYear: number;
  studentSection: string;
  facultyId: mongoose.Types.ObjectId;
  subject: string;
  title: string;
  videoUrl: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  studentName: { type: String, required: true },
  studentRollNumber: { type: String, required: true },
  studentYear: { type: Number, required: true },
  studentSection: { type: String, uppercase: true, required: true },
  facultyId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  description: { type: String, default: "" }
}, { timestamps: true });

const Submission: Model<ISubmission> = mongoose.models.Submission || mongoose.model<ISubmission>("Submission", submissionSchema);
export default Submission;
