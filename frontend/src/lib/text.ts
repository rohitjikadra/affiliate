export function splitLines(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean);
}
