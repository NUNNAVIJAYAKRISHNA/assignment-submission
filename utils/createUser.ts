import { ITeaching } from "../models/userModel";

export interface CreateUserInput {
  fullname: string;
  email: string;
  password?: string;
  role?: "student" | "faculty";
  rollNumber?: string | null;
  branch?: string | null;
  yearOfStudy?: string | number | null;
  semester?: string | number | null;
  section?: string | null;
  designation?: string | null;
  teaching?: Array<{
    year?: string | number;
    section?: string;
    subject?: string;
  }> | null;
}

export function createUser({
  fullname,
  email,
  password,
  role = "student",
  rollNumber = null,
  branch = null,
  yearOfStudy = null,
  semester = null,
  section = null,
  designation = null,
  teaching = []
}: CreateUserInput) {
  return {
    fullname: fullname?.trim(),
    email: email?.toLowerCase().trim(),
    password,
    role,
    rollNumber: rollNumber ? rollNumber.trim().toUpperCase() : null,
    branch: branch ? branch.trim().toUpperCase() : null,
    yearOfStudy: yearOfStudy ? Number(yearOfStudy) : null,
    semester: semester ? Number(semester) : null,
    section: section ? section.trim().toUpperCase() : null,
    designation: designation?.trim() || null,
    teaching: (teaching || [])
      .filter((t) => t && (t.year || t.section?.trim() || t.subject?.trim()))
      .map((t) => ({
        year: Number(t.year),
        section: t.section ? t.section.trim().toUpperCase() : "",
        subject: t.subject?.trim() || ""
      })) as ITeaching[]
  };
}
