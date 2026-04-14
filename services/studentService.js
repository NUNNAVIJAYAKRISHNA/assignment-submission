import User from "../models/userModel.js";

export const getStudentsForFaculty = async (faculty) => {

  const students = await User.find({
    role: "student",
    $or: faculty.teaching.map(t => ({
      yearOfStudy: t.year,
      section: t.section
    }))
  }).select("fullname rollNumber yearOfStudy section");
  const grouped = {};
  students.forEach(student => {
    const key = `${student.yearOfStudy}-${student.section}`;
    if (!grouped[key]) {
      grouped[key] = {
        year: student.yearOfStudy,
        section: student.section,
        students: []
      };
    }
    grouped[key].students.push(student);
  });
  return Object.values(grouped);
};