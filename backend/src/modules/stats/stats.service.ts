import { prisma } from "../../config/prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

function countMap(rows: { productId: string; _count: { _all: number } }[]): Map<string, number> {
  return new Map(rows.map((row) => [row.productId, row._count._all]));
}

export async function getClickStats() {
  const sevenDaysAgo = daysAgo(7);
  const thirtyDaysAgo = daysAgo(30);

  const [products, total, last7Days, last30Days, allCounts, counts7, counts30, recent] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        source: true,
        isActive: true,
      },
      orderBy: { title: "asc" },
    }),
    prisma.affiliateClick.count(),
    prisma.affiliateClick.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.affiliateClick.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.affiliateClick.groupBy({
      by: ["productId"],
      _count: { _all: true },
    }),
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
    prisma.affiliateClick.findMany({
      take: 25,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        source: true,
        referrer: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
          },
        },
      },
    }),
  ]);

  const allMap = countMap(allCounts);
  const map7 = countMap(counts7);
  const map30 = countMap(counts30);

  const productStats = products
    .map((product) => ({
      id: product.id,
      slug: product.slug,
      title: product.title,
      source: product.source,
      isActive: product.isActive,
      clicks: {
        all: allMap.get(product.id) ?? 0,
        last7Days: map7.get(product.id) ?? 0,
        last30Days: map30.get(product.id) ?? 0,
      },
    }))
    .sort((left, right) => right.clicks.all - left.clicks.all || left.title.localeCompare(right.title));

  return {
    totals: {
      all: total,
      last7Days,
      last30Days,
    },
    products: productStats,
    recent: recent.map((click) => ({
      id: click.id,
      source: click.source,
      referrer: click.referrer,
      createdAt: click.createdAt.toISOString(),
      product: click.product,
    })),
  };
}
