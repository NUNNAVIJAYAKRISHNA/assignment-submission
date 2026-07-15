import { redirect } from "next/navigation";
import { getUserSession } from "../../lib/auth";
import { getStudentsForFaculty } from "../../services/studentService";
import FacultyDashboardClient from "../../components/FacultyDashboardClient";

export const dynamic = "force-dynamic";

export default async function FacultyDashboardPage() {
  const user = await getUserSession();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "faculty") {
    redirect("/studentDashboard");
  }

  const studentList = await getStudentsForFaculty(user);
  
  // Serialize user
  const plainUser = {
    _id: user._id.toString(),
    fullname: user.fullname,
    email: user.email,
    role: user.role,
    designation: user.designation,
  };

  // Serialize classes list and nested students/submissions safely
  const plainClasses = studentList.map((cls) => ({
    year: cls.year,
    section: cls.section,
    subject: cls.subject,
    assignmentsEnabled: cls.assignmentsEnabled,
    students: cls.students.map((student) => ({
      _id: student._id.toString(),
      fullname: student.fullname,
      rollNumber: student.rollNumber,
      branch: student.branch,
      submission: student.submission ? {
        title: student.submission.title,
        videoUrl: student.submission.videoUrl,
        createdAt: student.submission.createdAt instanceof Date
          ? student.submission.createdAt.toISOString()
          : String(student.submission.createdAt),
      } : null,
    })),
  }));

  return (
    <FacultyDashboardClient
      initialUser={plainUser}
      classes={plainClasses}
    />
  );
}
