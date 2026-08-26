export function assertNotProductionSeed(nodeEnv = process.env.NODE_ENV): void {
  if (nodeEnv === "production") {
    throw new Error(
      "Refusing to run prisma seed while NODE_ENV=production. Seed deletes all catalog data. Use a non-production environment.",
    );
  }
}
