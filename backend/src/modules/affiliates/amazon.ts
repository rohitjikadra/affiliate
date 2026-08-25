import { env } from "../../config/env.js";
import type { AffiliateResolver } from "./types.js";

export function applyAmazonTag(url: string, tag: string | null | undefined): string {
  if (!tag) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (!/(^|\.)amazon\.[a-z.]+$/i.test(parsed.hostname)) {
      return url;
    }

    if (!parsed.searchParams.get("tag")) {
      parsed.searchParams.set("tag", tag);
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

export function isAmazonUrl(url: string): boolean {
  try {
    return /(^|\.)amazon\.[a-z.]+$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

export const amazonAffiliateResolver: AffiliateResolver = {
  key: "AMAZON",
  resolve({ url, merchant }) {
    return applyAmazonTag(url, merchant.defaultTag ?? env.amazonAssociateTag);
  },
};

