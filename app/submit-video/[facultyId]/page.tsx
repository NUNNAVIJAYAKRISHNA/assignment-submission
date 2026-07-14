import { redirect } from "next/navigation";
import { getUserSession } from "../../../lib/auth";
import connectDB from "../../../lib/db";
import User from "../../../models/userModel";
import SubmitAssignmentForm from "../../../components/SubmitAssignmentForm";

export const dynamic = "force-dynamic";

interface SubmitPageProps {
  params: Promise<{ facultyId: string }>;
}

export default async function SubmitVideoPage({ params }: SubmitPageProps) {
  const { facultyId } = await params;
  const user = await getUserSession();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "student") {
    redirect("/facultyDashboard");
  }

  await connectDB();
  const faculty = await User.findById(facultyId);

  if (!faculty || faculty.role !== "faculty") {
    redirect("/studentDashboard");
  }

  const matchedTeaching = faculty.teaching?.find(
    (t) => t.year === user.yearOfStudy && t.section === user.section
  );

  if (!matchedTeaching || !matchedTeaching.assignmentsEnabled) {
    redirect("/studentDashboard");
  }

  const plainFaculty = {
    _id: faculty._id.toString(),
    fullname: faculty.fullname,
    teaching: (faculty.teaching || []).map((t) => ({
      year: t.year,
      section: t.section,
      subject: t.subject,
    })),
  };

  const plainUser = {
    yearOfStudy: user.yearOfStudy,
    section: user.section,
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-hush">
      <SubmitAssignmentForm faculty={plainFaculty} user={plainUser} />
    </div>
  );
}
