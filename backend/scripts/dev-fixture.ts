import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const PRODUCT_SLUG = "dev-fixture-mixer-grinder";
const SHOP_SLUG = "dev-fixture-shop";
const ALT_SLUG = "dev-fixture-alt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

function abortIfProduction(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to write dev fixtures while NODE_ENV=production.");
  }
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
}

function amazonPrice(daysAgoCount: number): number {
  if (daysAgoCount >= 60 && daysAgoCount <= 62) {
    return 3099;
  }
  if (daysAgoCount >= 40 && daysAgoCount <= 41) {
    return 4199;
  }
  if (daysAgoCount >= 20 && daysAgoCount <= 21) {
    return 3899;
  }
  if (daysAgoCount <= 6) {
    return 3499 - daysAgoCount * 10;
  }
  return 3499;
}

async function resetFixture(): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { slug: PRODUCT_SLUG },
    include: { offers: { select: { id: true } } },
  });
  if (product) {
    await prisma.priceSnapshot.deleteMany({ where: { offerId: { in: product.offers.map((offer) => offer.id) } } });
    await prisma.offer.deleteMany({ where: { productId: product.id } });
    await prisma.product.delete({ where: { id: product.id } });
  }

  for (const slug of [SHOP_SLUG, ALT_SLUG]) {
    const merchant = await prisma.merchant.findUnique({
      where: { slug },
      include: { _count: { select: { offers: true } } },
    });
    if (merchant && merchant._count.offers === 0) {
      await prisma.merchant.delete({ where: { id: merchant.id } });
    }
  }

  console.log(`Removed local fixture ${PRODUCT_SLUG}.`);
}

async function upsertMerchant(slug: string, name: string, websiteUrl: string, hosts: string[]) {
  return prisma.merchant.upsert({
    where: { slug },
    update: { name, websiteUrl, isActive: true, hostAllowlist: hosts, fetchEnabled: false },
    create: {
      slug,
      name,
      kind: "DIRECT",
      websiteUrl,
      isActive: true,
      hostAllowlist: hosts,
      fetchEnabled: false,
      disclosure: "Local development merchant. Not a real storefront.",
    },
  });
}

async function applyFixture(): Promise<void> {
  const kitchen = await prisma.category.findUnique({ where: { slug: "kitchen-appliances" } });
  const amazon = await prisma.merchant.findUnique({ where: { slug: "amazon" } });
  const fixtureShop = await upsertMerchant(SHOP_SLUG, "Dev Fixture Shop", "https://example.com", [
    "example.com",
    "www.example.com",
  ]);
  const altShop = await upsertMerchant(ALT_SLUG, "Dev Fixture Alt", "https://example.org", ["example.org", "www.example.org"]);
  const bestMerchant = fixtureShop;
  const recommendedMerchant = amazon ?? altShop;
  const cheapUrl = "https://example.com/dev-fixture-mixer";
  const dearUrl = amazon ? "https://www.amazon.in/dp/B08CFJBZRK" : "https://example.org/dev-fixture-mixer";
  const now = new Date();

  const product = await prisma.product.upsert({
    where: { slug: PRODUCT_SLUG },
    update: {
      title: "[Dev] Prestige Mixer Grinder 750W",
      isActive: true,
      status: "PUBLISHED",
      publishedAt: now,
      featured: false,
    },
    create: {
      slug: PRODUCT_SLUG,
      title: "[Dev] Prestige Mixer Grinder 750W",
      brand: "Prestige",
      modelNumber: "DEV-750",
      description:
        "Local development fixture only. Used to test two merchant offers, best-price highlighting, and on-site price history. Do not treat this as a real recommendation.",
      bestFor: "Local UI testing of offer comparison and price charts.",
      whoShouldAvoid: "Anyone shopping for a real mixer. This listing is a development fixture.",
      pros: "Two live-shaped offers\nDeterministic snapshot history for charts",
      cons: "Not a real product\nNot for production seed data",
      warranty: "None — development fixture",
      specs: [
        { label: "Wattage", value: "750 W" },
        { label: "Jars", value: "3" },
        { label: "Purpose", value: "Local UI fixture" },
      ],
      scoreBreakdown: [
        { label: "Value", score: 8.0 },
        { label: "Build", score: 7.5 },
      ],
      ourScore: "7.8",
      images: ["https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80"],
      imageUrl: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80",
      source: "MANUAL",
      featured: false,
      isActive: true,
      status: "PUBLISHED",
      publishedAt: now,
      categoryId: kitchen?.id ?? null,
    },
  });

  await prisma.offer.deleteMany({
    where: {
      productId: product.id,
      externalId: { in: ["DEV-FIXTURE-CHEAP", "DEV-FIXTURE-DEAR"] },
    },
  });

  const cheapOffer = await prisma.offer.upsert({
    where: {
      productId_merchantId_externalId: {
        productId: product.id,
        merchantId: bestMerchant.id,
        externalId: "DEV-FIXTURE-CHEAP",
      },
    },
    update: {
      title: "Fixture best offer",
      price: 3499,
      originalPrice: 3999,
      currency: "INR",
      affiliateUrl: cheapUrl,
      inStock: true,
      isPrimary: false,
      availability: "IN_STOCK",
      fetchStatus: "SUCCESS",
      lastCheckedAt: now,
      lastSuccessfulFetchAt: now,
    },
    create: {
      productId: product.id,
      merchantId: bestMerchant.id,
      title: "Fixture best offer",
      price: 3499,
      originalPrice: 3999,
      currency: "INR",
      affiliateUrl: cheapUrl,
      externalId: "DEV-FIXTURE-CHEAP",
      inStock: true,
      isPrimary: false,
      availability: "IN_STOCK",
      fetchStatus: "SUCCESS",
      lastCheckedAt: now,
      lastSuccessfulFetchAt: now,
    },
  });

  const dearOffer = await prisma.offer.upsert({
    where: {
      productId_merchantId_externalId: {
        productId: product.id,
        merchantId: recommendedMerchant.id,
        externalId: "DEV-FIXTURE-DEAR",
      },
    },
    update: {
      title: "Fixture recommended offer",
      price: 3899,
      currency: "INR",
      affiliateUrl: dearUrl,
      inStock: true,
      isPrimary: true,
      availability: "IN_STOCK",
      fetchStatus: "SUCCESS",
      lastCheckedAt: now,
      lastSuccessfulFetchAt: now,
    },
    create: {
      productId: product.id,
      merchantId: recommendedMerchant.id,
      title: "Fixture recommended offer",
      price: 3899,
      currency: "INR",
      affiliateUrl: dearUrl,
      externalId: "DEV-FIXTURE-DEAR",
      inStock: true,
      isPrimary: true,
      availability: "IN_STOCK",
      fetchStatus: "SUCCESS",
      lastCheckedAt: now,
      lastSuccessfulFetchAt: now,
    },
  });

  await prisma.priceSnapshot.deleteMany({ where: { offerId: { in: [cheapOffer.id, dearOffer.id] } } });

  const snapshots = Array.from({ length: 90 }, (_, index) => {
    const age = 89 - index;
    return {
      offerId: cheapOffer.id,
      price: amazonPrice(age),
      currency: "INR",
      recordedAt: daysAgo(age),
      availability: "IN_STOCK" as const,
      inStock: true,
      source: "ADMIN" as const,
      fetchStatus: "SUCCESS" as const,
    };
  });

  snapshots.push(
    {
      offerId: dearOffer.id,
      price: 3899,
      currency: "INR",
      recordedAt: daysAgo(2),
      availability: "IN_STOCK",
      inStock: true,
      source: "ADMIN",
      fetchStatus: "SUCCESS",
    },
    {
      offerId: dearOffer.id,
      price: 4099,
      currency: "INR",
      recordedAt: daysAgo(10),
      availability: "IN_STOCK",
      inStock: true,
      source: "ADMIN",
      fetchStatus: "SUCCESS",
    },
  );

  await prisma.priceSnapshot.createMany({ data: snapshots });

  console.log("Local dev fixture ready (not part of production seed).");
  console.log(`  Product: /products/${PRODUCT_SLUG}`);
  console.log(`  Best price: ${bestMerchant.name} ₹3499 (cheaper, not recommended)`);
  console.log(`  Recommended: ${recommendedMerchant.name} ₹3899 (editorial, not best price)`);
  console.log(`  Snapshots: ${snapshots.length} ADMIN rows for chart testing`);
  console.log("  Charts stay gated until PRICE_HISTORY_PUBLIC=true on the API process.");
}

async function main(): Promise<void> {
  abortIfProduction();
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  if (process.argv.includes("--reset")) {
    await resetFixture();
    return;
  }

  await applyFixture();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
