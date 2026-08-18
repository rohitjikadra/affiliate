import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const categories = [
  {
    slug: "electronics",
    name: "Electronics",
    description: "Phones, laptops, audio and smart home",
  },
  {
    slug: "fashion",
    name: "Fashion",
    description: "Apparel, footwear and accessories",
  },
  {
    slug: "home-kitchen",
    name: "Home & Kitchen",
    description: "Appliances, cookware and decor",
  },
  {
    slug: "beauty",
    name: "Beauty",
    description: "Skincare, haircare and grooming",
  },
  {
    slug: "sports",
    name: "Sports",
    description: "Fitness gear and outdoor equipment",
  },
  {
    slug: "books",
    name: "Books",
    description: "Bestsellers, exam prep and comics",
  },
  {
    slug: "grocery",
    name: "Grocery",
    description: "Pantry staples and daily essentials",
  },
  {
    slug: "toys",
    name: "Toys",
    description: "Games, STEM kits and kids picks",
  },
];

const products = [
  {
    slug: "wireless-noise-cancelling-headphones",
    title: "Wireless noise-cancelling headphones",
    description: "Over-ear wireless headphones for commutes, calls, and long listening sessions.",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    price: "7999.00",
    originalPrice: "9999.00",
    rating: "4.5",
    affiliateUrl: "https://www.amazon.in/s?k=wireless+noise+cancelling+headphones&tag=affiliatehub-21",
    source: "AMAZON" as const,
    featured: true,
    categorySlug: "electronics",
  },
  {
    slug: "stainless-steel-cookware-set",
    title: "Stainless steel cookware set",
    description: "Everyday pots and pans for Indian cooking — durable, induction-friendly, and easy to clean.",
    imageUrl:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
    price: "5499.00",
    originalPrice: "6999.00",
    rating: "4.4",
    affiliateUrl: "https://www.amazon.in/s?k=stainless+steel+cookware+set&tag=affiliatehub-21",
    source: "AMAZON" as const,
    featured: true,
    categorySlug: "home-kitchen",
  },
  {
    slug: "everyday-running-shoes",
    title: "Everyday running shoes",
    description: "Cushioned road runners for daily training, walking, and beginner 5Ks.",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    price: "4299.00",
    originalPrice: null,
    rating: "4.3",
    affiliateUrl: "https://www.amazon.in/s?k=everyday+running+shoes&tag=affiliatehub-21",
    source: "AMAZON" as const,
    featured: true,
    categorySlug: "sports",
  },
  {
    slug: "vitamin-c-face-serum",
    title: "Vitamin C face serum",
    description: "A simple brightening serum for daily skincare routines.",
    imageUrl:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80",
    price: "899.00",
    originalPrice: "1299.00",
    rating: "4.2",
    affiliateUrl: "https://www.amazon.in/s?k=vitamin+c+face+serum&tag=affiliatehub-21",
    source: "AMAZON" as const,
    featured: true,
    categorySlug: "beauty",
  },
  {
    slug: "linen-overshirt",
    title: "Linen overshirt",
    description: "Breathable regular-fit overshirt for warm weather and layering.",
    imageUrl:
      "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=1200&q=80",
    price: "2199.00",
    originalPrice: null,
    rating: "4.1",
    affiliateUrl: "https://www.amazon.in/s?k=linen+overshirt+men&tag=affiliatehub-21",
    source: "AMAZON" as const,
    featured: false,
    categorySlug: "fashion",
  },
  {
    slug: "product-strategy-handbook",
    title: "The Product Strategy Handbook",
    description: "A practical guide to discovery, positioning, and growth for builders.",
    imageUrl:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
    price: "649.00",
    originalPrice: null,
    rating: "4.6",
    affiliateUrl: "https://www.amazon.in/s?k=product+strategy+handbook&tag=affiliatehub-21",
    source: "AMAZON" as const,
    featured: false,
    categorySlug: "books",
  },
];

async function seed() {
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const record = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
    });

    categoryIds.set(category.slug, record.id);
  }

  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Missing category for ${product.slug}`);
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        title: product.title,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price,
        originalPrice: product.originalPrice,
        rating: product.rating,
        affiliateUrl: product.affiliateUrl,
        source: product.source,
        featured: product.featured,
        categoryId,
        currency: "INR",
        isActive: true,
      },
      create: {
        slug: product.slug,
        title: product.title,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price,
        originalPrice: product.originalPrice,
        rating: product.rating,
        affiliateUrl: product.affiliateUrl,
        source: product.source,
        featured: product.featured,
        categoryId,
        currency: "INR",
        isActive: true,
      },
    });
  }
}

seed()
  .then(async () => {
    console.log(`Seeded ${categories.length} categories and ${products.length} products`);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
