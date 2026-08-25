import { HomePage } from "@/components/home/HomePage";
import { publicMetadata } from "@/lib/seo";
import { SITE_TAGLINE } from "@/lib/site";
import type { Metadata } from "next";

export const revalidate = 120;

export const metadata: Metadata = publicMetadata({
  title: SITE_TAGLINE.replace(/\.$/, ""),
  description: SITE_TAGLINE,
  path: "/",
});

export default function Home() {
  return <HomePage />;
}
