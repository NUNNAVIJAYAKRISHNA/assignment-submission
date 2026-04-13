import { getStudentsForFaculty } from "../services/studentService.js";

export async function facultyDashboard(req, res) {
  const faculty = req.session.user;   // logged-in faculty
  const studentList = await getStudentsForFaculty(faculty);
  res.render("facultyDashboard", {
    user: faculty,
    studentList: studentList
  });
}