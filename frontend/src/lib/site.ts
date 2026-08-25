export const SITE_NAME = "My Pasand Shop";
export const SITE_TAGLINE = "Kitchen appliance price comparison for Indian homes.";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageTitle(title?: string | null): string {
  return title?.trim() ? `${title.trim()} — ${SITE_NAME}` : `${SITE_NAME} — Kitchen appliances for Indian homes`;
}
