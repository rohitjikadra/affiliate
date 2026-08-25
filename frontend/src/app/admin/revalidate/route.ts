import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isRevalidatePath } from "@/lib/revalidate-shop";

function bearerMatches(header: string | null, secret: string | undefined): boolean {
  if (!header || !secret || !header.startsWith("Bearer ")) {
    return false;
  }
  const token = header.slice("Bearer ".length);
  const left = Buffer.from(token);
  const right = Buffer.from(secret);
  return left.length === right.length && timingSafeEqual(left, right);
}

async function isAdminSession(): Promise<boolean> {
  const session = (await cookies()).get("ah_session");
  if (!session?.value) {
    return false;
  }
  const apiOrigin = process.env.API_ORIGIN ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const me = await fetch(`${apiOrigin}/api/auth/me`, {
    headers: { Cookie: `ah_session=${session.value}` },
    cache: "no-store",
  });
  return me.ok;
}

export async function POST(request: Request) {
  const workerOk = bearerMatches(request.headers.get("authorization"), process.env.REVALIDATE_SECRET);
  if (!workerOk && !(await isAdminSession())) {
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
  revalidatePath("/products");
  revalidatePath("/sitemap.xml");

  return NextResponse.json({ ok: true });
}
