const ALLOWED = [/^\/$/, /^\/products/, /^\/guides/, /^\/best/, /^\/compare/, /^\/categories/, /^\/sitemap\.xml$/];

export function isRevalidatePath(path: string): boolean {
  return ALLOWED.some((pattern) => pattern.test(path));
}

export async function revalidateShop(paths: string[]): Promise<void> {
  try {
    await fetch("/admin/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      redirect: "manual",
      body: JSON.stringify({ paths: paths.filter(isRevalidatePath) }),
    });
  } catch {
    // ISR refresh is best-effort; the next revalidate window still applies.
  }
}
