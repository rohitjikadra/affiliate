type MerchantDisclosureProps = {
  text?: string | null;
  className?: string;
};

export function MerchantDisclosure({
  text,
  className = "mt-2 text-xs leading-5 text-ink-subtle",
}: MerchantDisclosureProps) {
  const disclosure = text?.trim() ?? "";
  if (!disclosure) {
    return null;
  }
  return <p className={className}>{disclosure}</p>;
}
