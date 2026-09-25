/**
 * Windowing arithmetic: which rows of a long list are on screen, given each
 * row's height (measured, or estimated until measured).
 */

/** Running offsets: offsets[i] is where row i starts; offsets[count] is the total height. */
export function offsetsOf(count: number, sizeOf: (index: number) => number): number[] {
  const offsets = new Array<number>(count + 1);
  offsets[0] = 0;
  for (let index = 0; index < count; index++) offsets[index + 1] = offsets[index] + sizeOf(index);
  return offsets;
}

/** The first row whose bottom is below `y` (binary search). */
export function rowAt(offsets: number[], y: number): number {
  let low = 0;
  let high = offsets.length - 2;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (offsets[middle + 1] <= y) low = middle + 1;
    else high = middle;
  }
  return Math.max(0, low);
}

/** Rows to render for a viewport, with `overscan` extra rows on each side. */
export function visibleRange(offsets: number[], scrollTop: number, viewport: number, overscan = 4) {
  const count = offsets.length - 1;
  if (count <= 0) return { start: 0, end: -1 };
  const first = rowAt(offsets, scrollTop);
  const last = rowAt(offsets, scrollTop + viewport);
  return { start: Math.max(0, first - overscan), end: Math.min(count - 1, last + overscan) };
}
