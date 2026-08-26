import type { Metadata } from "next";
import { serializeJsonLd } from "@/lib/json-ld-serialize";
import { absoluteUrl, pageTitle, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export function publicMetadata(input: {
  title?: string | null;
  description?: string | null;
  path: string;
  image?: string | null;
  noIndex?: boolean;
}): Metadata {
  const title = pageTitle(input.title);
  const description = input.description?.trim() || SITE_TAGLINE;
  const url = absoluteUrl(input.path);

  return {
    title: input.title?.trim() ? { absolute: title } : undefined,
    description,
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: input.image ? [{ url: input.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function jsonLd(data: Record<string, unknown>): string {
  return serializeJsonLd(data);
}
