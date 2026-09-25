/**
 * Legacy aliases, tracked with a removal version.
 *
 * A compatibility alias without a deadline is a permanent second API. Each
 * entry here is emitted today and must be gone by `removeIn`; the test in
 * `tests/deprecations.test.mjs` fails if the package version reaches that
 * version with the alias still present, or if the alias is already gone but the
 * ledger entry remains.
 */

export const CURRENT_VERSION = "0.3.0";

export const DEPRECATIONS = [
  // 1.0 removed data-skin, the shadcn --background/--chart-*/--sidebar-*
  // aliases, the .ml-button-* class variants and every other duplicate
  // spelling in one break. New aliases go here with a removal version.
];

/** Numeric semver comparison. Returns -1, 0, or 1. */
export function compareVersions(left, right) {
  const parse = (value) => String(value).split(".").map((part) => Number.parseInt(part, 10) || 0);
  const a = parse(left);
  const b = parse(right);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  return 0;
}
