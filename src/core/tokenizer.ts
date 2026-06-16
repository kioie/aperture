/** ~4 chars per token heuristic for code. */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateLineSliceTokens(
  lines: string[],
  start: number,
  end: number,
): number {
  const slice = lines.slice(start - 1, end).join("\n");
  return estimateTokens(slice);
}
