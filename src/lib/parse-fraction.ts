export function parseFractionQuantity(s: string): number | null {
  if (!s || !s.trim()) return null;
  const trimmed = s.trim();

  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
  }

  const fracMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fracMatch) {
    return parseInt(fracMatch[1]) / parseInt(fracMatch[2]);
  }

  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}
