import { HomePage } from "@/components/home/HomePage";
import { publicMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const revalidate = 120;

export const metadata: Metadata = publicMetadata({
  title: "Kitchen appliance recommendations for Indian homes",
  description:
    "Editorial picks for mixer grinders, air fryers, induction cooktops, kettles, and hand blenders — then check the live price on Amazon.",
  path: "/",
});

export default function Home() {
  return <HomePage />;
}
