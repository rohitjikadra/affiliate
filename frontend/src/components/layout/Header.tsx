import { cookies } from "next/headers";
import { SiteHeader } from "@/components/layout/SiteHeader";

export async function Header() {
  const isAdmin = Boolean((await cookies()).get("ah_session")?.value);
  return <SiteHeader isAdmin={isAdmin} />;
}
