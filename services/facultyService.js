import User from "../models/userModel.js";

export async function getFacultyForStudent(student) {

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