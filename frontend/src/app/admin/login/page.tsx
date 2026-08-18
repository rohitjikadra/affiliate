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
    <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-16 sm:px-6">
      <LoginForm next={destination} />
    </div>
  );
}
