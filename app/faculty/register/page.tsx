import { redirect } from "next/navigation";
import { getUserSession } from "../../../lib/auth";
import FacultyRegistrationForm from "../../../components/FacultyRegistrationForm";

export default async function FacultyRegistrationPage() {
  const sessionUser = await getUserSession();

  if (sessionUser) {
    if (sessionUser.role === "student") {
      redirect("/studentDashboard");
    } else if (sessionUser.role === "faculty") {
      redirect("/facultyDashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-hush">
      <FacultyRegistrationForm />
    </div>
  );
}
