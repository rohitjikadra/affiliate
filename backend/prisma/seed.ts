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

async function seed() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
    });
  }
}

seed()
  .then(async () => {
    console.log(`Seeded ${categories.length} categories`);
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
