import { prisma } from "../../config/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

export async function getClickStats() {
  const sevenDaysAgo = daysAgo(7);
  const thirtyDaysAgo = daysAgo(30);

  const [
    products,
    merchants,
    total,
    last7Days,
    last30Days,
    allCounts,
    counts7,
    counts30,
    merchantCounts,
    recent,
    pageViews,
    pageViews7,
    topPaths,
    utmRows,
  ] = await Promise.all([
    prisma.product.findMany({
      select: { id: true, slug: true, title: true, source: true, isActive: true },
      orderBy: { title: "asc" },
    }),
    prisma.merchant.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.affiliateClick.count(),
    prisma.affiliateClick.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.affiliateClick.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.affiliateClick.groupBy({ by: ["productId"], _count: { _all: true } }),
    prisma.affiliateClick.groupBy({
      by: ["productId"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { _all: true },
    }),
    prisma.affiliateClick.groupBy({
      by: ["productId"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
    }),
    prisma.affiliateClick.groupBy({
      by: ["merchantId"],
      where: { merchantId: { not: null } },
      _count: { _all: true },
    }),
    prisma.affiliateClick.findMany({
      take: 25,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        source: true,
        referrer: true,
        landingPath: true,
        utmSource: true,
        utmCampaign: true,
        device: true,
        createdAt: true,
        product: { select: { id: true, slug: true, title: true } },
        merchant: { select: { id: true, slug: true, name: true } },
        offer: { select: { id: true } },
      },
    }),
    prisma.pageView.count(),
    prisma.pageView.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.pageView.groupBy({
      by: ["path"],
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
    prisma.affiliateClick.groupBy({
      by: ["utmSource"],
      where: { utmSource: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const allMap = new Map(allCounts.map((row) => [row.productId, row._count._all]));
  const map7 = new Map(counts7.map((row) => [row.productId, row._count._all]));
  const map30 = new Map(counts30.map((row) => [row.productId, row._count._all]));
  const merchantMap = new Map(
    merchantCounts.filter((row) => row.merchantId).map((row) => [row.merchantId as string, row._count._all]),
  );

  const productViews = await prisma.pageView.groupBy({
    by: ["entityId"],
    where: { entityType: "product", entityId: { not: null } },
    _count: { _all: true },
  });
  const viewMap = new Map(
    productViews.filter((row) => row.entityId).map((row) => [row.entityId as string, row._count._all]),
  );

  const productStats = products
    .map((product) => {
      const clicks = allMap.get(product.id) ?? 0;
      const views = viewMap.get(product.id) ?? 0;
      return {
        id: product.id,
        slug: product.slug,
        title: product.title,
        source: product.source,
        isActive: product.isActive,
        clicks: {
          all: clicks,
          last7Days: map7.get(product.id) ?? 0,
          last30Days: map30.get(product.id) ?? 0,
        },
        pageViews: views,
        ctr: views > 0 ? Number((clicks / views).toFixed(4)) : null,
      };
    })
    .sort((left, right) => right.clicks.all - left.clicks.all || left.title.localeCompare(right.title));

  return {
    totals: {
      all: total,
      last7Days,
      last30Days,
      pageViews,
      pageViewsLast7Days: pageViews7,
    },
    products: productStats,
    merchants: merchants
      .map((merchant) => ({
        ...merchant,
        clicks: merchantMap.get(merchant.id) ?? 0,
      }))
      .sort((left, right) => right.clicks - left.clicks),
    topPages: topPaths.map((row) => ({ path: row.path, views: row._count._all })),
    campaigns: utmRows
      .filter((row) => row.utmSource)
      .map((row) => ({ source: row.utmSource as string, clicks: row._count._all }))
      .sort((left, right) => right.clicks - left.clicks),
    recent: recent.map((click) => ({
      id: click.id,
      source: click.source,
      referrer: click.referrer,
      landingPath: click.landingPath,
      utmSource: click.utmSource,
      utmCampaign: click.utmCampaign,
      device: click.device,
      createdAt: click.createdAt.toISOString(),
      product: click.product,
      merchant: click.merchant,
      offerId: click.offer?.id ?? null,
    })),
  };
}
