import { prisma } from "../../config/prisma.js";
import { truncate } from "../../lib/url.js";
import type { CreatePageViewInput } from "./pageview.schemas.js";

export async function recordPageView(input: CreatePageViewInput) {
  await prisma.pageView.create({
    data: {
      path: truncate(input.path, 500) ?? "/",
      entityType: input.entityType,
      entityId: input.entityId,
      referrer: truncate(input.referrer, 2000),
      utmSource: truncate(input.utmSource, 100),
      utmMedium: truncate(input.utmMedium, 100),
      utmCampaign: truncate(input.utmCampaign, 100),
    },
  });

  return { ok: true as const };
}
