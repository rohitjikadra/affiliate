export const SITE_NAME = "My Pasand Shop";
export const SITE_TAGLINE = "Kitchen appliance price comparison for Indian homes.";
export const SITE_HEADLINE = "Kitchen appliances for Indian homes";
export const SITE_CATEGORY_SLUG = "kitchen-appliances";
export const SITE_CATEGORY_NAV_LABEL = "Kitchen";
export const SITE_CATEGORY_FOOTER_LABEL = "Kitchen appliances";
export const SITE_GUIDES_BLURB = "Kitchen appliance recommendations for Indian homes.";

export function siteUrl(): string {
  const url = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("NEXT_PUBLIC_SITE_URL must be a valid URL in production");
    }
    if (parsed.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_SITE_URL must use https in production");
    }
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".localhost")) {
      throw new Error("NEXT_PUBLIC_SITE_URL must not be a localhost URL in production");
    }
  }
  return url;
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageTitle(title?: string | null): string {
  return title?.trim() ? `${title.trim()} — ${SITE_NAME}` : `${SITE_NAME} — ${SITE_HEADLINE}`;
}
