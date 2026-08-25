import { prisma } from "../../config/prisma.js";
import type { PriceEventType } from "../../generated/prisma/client.js";

export async function recordPriceEvents(input: {
  productId: string;
  offerId: string;
  previousPrice: number | null;
  currentPrice: number | null;
  previousInStock: boolean;
  currentInStock: boolean;
}) {
  const events: { type: PriceEventType; previousPrice: number | null; currentPrice: number | null; percent: number | null }[] = [];

  if (input.previousPrice != null && input.currentPrice != null && input.previousPrice !== input.currentPrice) {
    const percent = Number((((input.currentPrice - input.previousPrice) / input.previousPrice) * 100).toFixed(2));
    events.push({
      type: input.currentPrice < input.previousPrice ? "DROP" : "RISE",
      previousPrice: input.previousPrice,
      currentPrice: input.currentPrice,
      percent,
    });
  }

  if (input.currentPrice != null) {
    const low = await prisma.priceSnapshot.aggregate({
      where: { offerId: input.offerId },
      _min: { price: true },
    });
    const historicLow = low._min.price != null ? Number(low._min.price) : null;
    if (historicLow != null && input.currentPrice <= historicLow) {
      events.push({
        type: input.previousPrice != null && input.previousPrice > historicLow ? "RETURN_TO_LOW" : "NEW_LOW",
        previousPrice: input.previousPrice,
        currentPrice: input.currentPrice,
        percent: input.previousPrice != null
          ? Number((((input.currentPrice - input.previousPrice) / input.previousPrice) * 100).toFixed(2))
          : null,
      });
    }
  }

  if (input.previousInStock && !input.currentInStock) {
    events.push({ type: "UNAVAILABLE", previousPrice: input.previousPrice, currentPrice: input.currentPrice, percent: null });
  }
  if (!input.previousInStock && input.currentInStock) {
    events.push({ type: "BACK_IN_STOCK", previousPrice: input.previousPrice, currentPrice: input.currentPrice, percent: null });
  }

  for (const event of events) {
    await prisma.priceEvent.create({
      data: {
        productId: input.productId,
        offerId: input.offerId,
        type: event.type,
        previousPrice: event.previousPrice,
        currentPrice: event.currentPrice,
        percent: event.percent,
      },
    });
  }

  return events;
}
