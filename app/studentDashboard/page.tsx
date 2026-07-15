import { redirect } from "next/navigation";
import { getUserSession } from "../../lib/auth";
import { getFacultyForStudent } from "../../services/facultyService";
import StudentDashboardClient from "../../components/StudentDashboardClient";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const user = await getUserSession();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "student") {
    redirect("/facultyDashboard");
  }

  const facultyList = await getFacultyForStudent({
    yearOfStudy: user.yearOfStudy,
    section: user.section
  });

  // Serialize to plain JavaScript objects for Client Component consumption
  const plainUser = {
    _id: user._id.toString(),
    fullname: user.fullname,
    email: user.email,
    role: user.role,
    rollNumber: user.rollNumber,
    yearOfStudy: user.yearOfStudy,
    semester: user.semester,
    section: user.section,
    branch: user.branch,
  };

  const plainFacultyList = facultyList.map((faculty) => ({
    _id: faculty._id.toString(),
    fullname: faculty.fullname,
    teaching: (faculty.teaching || []).map((t) => ({
      year: t.year,
      section: t.section,
      subject: t.subject,
      assignmentsEnabled: !!t.assignmentsEnabled,
    })),
  }));

  return (
    <StudentDashboardClient
      initialUser={plainUser}
      initialFacultyList={plainFacultyList}
    />
  );
}
