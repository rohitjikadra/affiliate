import { getPriceHistory } from "../src/modules/history/history.service.ts";
import { disconnectPrisma } from "../src/config/prisma.ts";

const SLUG = "dev-fixture-mixer-grinder";
const EMPTY_SLUG = "prestige-pic-20-induction-cooktop";

async function main(): Promise<void> {
  const gatedNote = process.env.PRICE_HISTORY_PUBLIC;
  console.log(`PRICE_HISTORY_PUBLIC=${gatedNote ?? "(unset)"}`);

  for (const range of ["7d", "30d", "90d"] as const) {
    const history = await getPriceHistory(SLUG, range);
    console.log(
      `${SLUG} ${range}: enabled=${history.enabled} points=${history.points.length} low=${history.stats?.low ?? "-"} high=${history.stats?.high ?? "-"} avg=${history.stats?.average ?? "-"} label=${history.stats?.label ?? "-"}`,
    );
  }

  const empty = await getPriceHistory(EMPTY_SLUG, "90d");
  console.log(
    `${EMPTY_SLUG} 90d: enabled=${empty.enabled} points=${empty.points.length} stats=${empty.stats ? "yes" : "null"}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
