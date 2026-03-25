import { getFacultyForStudent } from "../services/facultyService.js";

export async function studentDashboard(req, res) {
  const student = req.session.user;   // logged-in user
  const facultyList = await getFacultyForStudent(student);
  res.render("studentDashboard", {
    user: student,
    facultyList: facultyList
  });
}