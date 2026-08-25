export function splitLines(value?: string | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
    .filter(Boolean);
}

export type FaqPair = {
  question: string;
  answer: string;
};

export function parseFaq(value?: string | null): FaqPair[] {
  if (!value?.trim()) {
    return [];
  }

  const blocks = value
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  const fromBlocks: FaqPair[] = [];

  for (const block of blocks) {
    const newline = block.indexOf("\n");
    if (newline > 0) {
      const question = block.slice(0, newline).trim();
      const answer = block.slice(newline).trim();
      if (question.endsWith("?") && answer) {
        fromBlocks.push({ question, answer });
      }
    }
  }

  if (fromBlocks.length > 0) {
    return fromBlocks;
  }

  const paired: FaqPair[] = [];
  for (let index = 0; index < blocks.length - 1; index += 2) {
    paired.push({ question: blocks[index], answer: blocks[index + 1] });
  }
  return paired;
}
