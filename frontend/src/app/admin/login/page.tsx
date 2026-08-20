import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminSession } from "@/lib/api";
import { safeAdminPath } from "@/lib/admin";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const destination = safeAdminPath(next);

  if (await getAdminSession()) {
    redirect(destination);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <LoginForm next={destination} />
    </div>
  );
}
