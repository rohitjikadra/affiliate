import type { GuideProductBadge } from "@/types/product";

const FEATURED_BADGES: Partial<Record<GuideProductBadge, string>> = {
  BEST_OVERALL: "Best overall",
  BEST_BUDGET: "Best budget",
  BEST_PREMIUM: "Best premium",
  BEST_FOR_BEGINNERS: "Best for beginners",
};

export function featuredBadgeLabel(badge: GuideProductBadge): string | null {
  return FEATURED_BADGES[badge] ?? null;
}
