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
