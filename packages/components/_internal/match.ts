/**
 * Rank a command against a query the way people type: a prefix beats the
 * start of a later word, which beats a substring, which beats letters in
 * order ("dkm" → "Dark mode"). Returns null for no match, and the matched
 * character positions so the view can bold them.
 */
export interface CommandMatch {
  score: number;
  positions: number[];
}

export function matchCommand(label: string, query: string, keywords: string[] = []): CommandMatch | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return { score: 0, positions: [] };
  const text = label.toLowerCase();
  const range = (start: number) => Array.from({ length: needle.length }, (_, index) => start + index);

  if (text.startsWith(needle)) return { score: 100 - text.length * 0.1, positions: range(0) };
  const wordStart = text.search(new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  if (wordStart > 0) return { score: 80 - wordStart * 0.5, positions: range(wordStart) };
  const inside = text.indexOf(needle);
  if (inside >= 0) return { score: 60 - inside * 0.5, positions: range(inside) };
  if (keywords.some((keyword) => keyword.toLowerCase().includes(needle))) return { score: 45, positions: [] };

  // Letters in order, preferring word starts and runs.
  const positions: number[] = [];
  let from = 0;
  let bonus = 0;
  for (const char of needle) {
    const found = text.indexOf(char, from);
    if (found < 0) return null;
    if (found === 0 || text[found - 1] === " ") bonus += 3;
    if (positions.length && found === positions[positions.length - 1] + 1) bonus += 2;
    positions.push(found);
    from = found + 1;
  }
  const spread = positions[positions.length - 1] - positions[0];
  return { score: 20 + bonus - spread * 0.2, positions };
}
