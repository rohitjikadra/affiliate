export function contactEmail(): string | null {
  const value = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "";
  if (!value || /@example\.com$/i.test(value)) {
    return null;
  }
  return value;
}
