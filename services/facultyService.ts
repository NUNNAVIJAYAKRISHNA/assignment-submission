import User, { IUser } from "../models/userModel";

export async function getFacultyForStudent(student: { yearOfStudy?: number | null; section?: string | null }): Promise<IUser[]> {
  if (!student.yearOfStudy || !student.section) {
    return [];
  }
  return await User.find({
    role: "faculty",
    teaching: {
      $elemMatch: {
        year: student.yearOfStudy,
        section: student.section
      }
    }
  });
}
