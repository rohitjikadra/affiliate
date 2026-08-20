export function formatMoney(
  amount: string | number,
  currency = "INR",
  maximumFractionDigits = 2,
): string {
  const value = typeof amount === "number" ? amount : Number(amount);

  if (Number.isNaN(value)) {
    return String(amount);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(value);
}

export function formatOptionalMoney(
  amount: string | number | null | undefined,
  currency = "INR",
  maximumFractionDigits = 2,
): string | null {
  if (amount === null || amount === undefined || amount === "") {
    return null;
  }

  const value = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(value)) {
    return null;
  }

  return formatMoney(value, currency, maximumFractionDigits);
}

export function discountPercent(price: number, originalPrice: number): number | null {
  if (!Number.isFinite(price) || !Number.isFinite(originalPrice) || originalPrice <= price) {
    return null;
  }

  return Math.round(((originalPrice - price) / originalPrice) * 100);
}
