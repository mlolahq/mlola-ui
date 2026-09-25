/** Numbers as people type them, in their own locale. */

/** The locale's decimal and group separators, from how it writes 12345.6. */
export function separators(locale = "en") {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  return { decimal: parts.find((part) => part.type === "decimal")?.value ?? ".", group: parts.find((part) => part.type === "group")?.value ?? "," };
}

/**
 * Read what was typed: group separators, currency signs and units are
 * ignored, the locale's decimal separator (or a dot) marks the fraction, and
 * a leading minus or parentheses make it negative. Returns null for nothing
 * numeric.
 */
export function parseNumber(text: string, locale = "en"): number | null {
  const { decimal, group } = separators(locale);
  let body = text.trim();
  if (!body) return null;
  const negative = /^\(.*\)$/.test(body) || /^[-−]/.test(body) || /[-−]$/.test(body);
  body = body.split(group).join("").replace(/\s/g, "");
  if (decimal !== ".") body = body.split(decimal).join(".");
  body = body.replace(/[^\d.]/g, "");
  if (!body || body === ".") return null;
  const firstDot = body.indexOf(".");
  if (firstDot !== -1) body = body.slice(0, firstDot + 1) + body.slice(firstDot + 1).replace(/\./g, "");
  const value = Number(body);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

/** Clamp into [min, max] and round to `precision` decimals, without float noise. */
export function settle(value: number, { min = -Infinity, max = Infinity, precision }: { min?: number; max?: number; precision?: number }) {
  const bounded = Math.min(max, Math.max(min, value));
  return precision === undefined ? Number(bounded.toFixed(10)) : Number(bounded.toFixed(precision));
}

/**
 * Step from a value by `delta` steps and land on the step grid measured from
 * min (or zero), so 3.3 steps up to 4 and down to 2. An empty field starts
 * at min, or zero.
 */
export function stepValue(value: number | null, delta: number, { step = 1, min, max }: { step?: number; min?: number; max?: number }) {
  const origin = min !== undefined && Number.isFinite(min) ? min : 0;
  const decimals = (String(step).split(".")[1] ?? "").length;
  const precision = decimals || undefined;
  if (value === null) return settle(origin, { min, max, precision });
  const next = value + delta * step;
  const onGrid = origin + Math.round((next - origin) / step) * step;
  return settle(onGrid, { min, max, precision });
}
