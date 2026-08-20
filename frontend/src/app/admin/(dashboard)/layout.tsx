import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!(await getAdminSession())) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
