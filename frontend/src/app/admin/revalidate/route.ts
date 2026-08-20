import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isRevalidatePath } from "@/lib/revalidate-shop";

export async function POST(request: Request) {
  const session = (await cookies()).get("ah_session");
  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiOrigin = process.env.API_ORIGIN ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const me = await fetch(`${apiOrigin}/api/auth/me`, {
    headers: { Cookie: `ah_session=${session.value}` },
    cache: "no-store",
  });
  if (!me.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let paths: string[] = [];
  try {
    const body = (await request.json()) as { paths?: unknown };
    paths = Array.isArray(body.paths) ? body.paths.filter((path): path is string => typeof path === "string") : [];
  } catch {
    paths = [];
  }

  for (const path of paths) {
    if (isRevalidatePath(path)) {
      revalidatePath(path);
    }
  }
  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ ok: true });
}
