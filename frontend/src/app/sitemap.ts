import type { MetadataRoute } from "next";
import { getSitemapEntities } from "@/lib/api";
import { siteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/guides`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/affiliate-disclosure`, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const data = await getSitemapEntities();
    return [
      ...staticRoutes,
      ...data.products.map((item) => ({
        url: `${base}/products/${item.slug}`,
        lastModified: item.updatedAt,
      })),
      ...data.categories.map((item) => ({
        url: `${base}/categories/${item.slug}`,
        lastModified: item.updatedAt,
      })),
      ...data.guides.map((item) => ({
        url: `${base}/${item.kind === "BEST_OF" ? "best" : "guides"}/${item.slug}`,
        lastModified: item.updatedAt,
      })),
      ...data.comparisons.map((item) => ({
        url: `${base}/compare/${item.slug}`,
        lastModified: item.updatedAt,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
