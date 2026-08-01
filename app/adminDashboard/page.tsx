import { redirect } from "next/navigation";
import { getUserSession } from "../../lib/auth";
import AdminDashboardClient from "../../components/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getUserSession();

  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  const plainAdmin = {
    fullname: user.fullname || "System Administrator",
    email: user.email,
    role: user.role,
  };

  return <AdminDashboardClient initialAdmin={plainAdmin} />;
}
