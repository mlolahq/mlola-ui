/**
 * Color math the engine can rely on, in the browser or in Node.
 *
 * Everything is OKLCH in and OKLCH out. A color outside sRGB is brought into
 * gamut by reducing chroma at a fixed lightness and hue, the same strategy CSS
 * Color 4 uses, so the value the engine measures is the value the browser
 * paints. Contrast follows WCAG 2.2.
 */

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, places) => Number(value.toFixed(places));

/** Parse `oklch(L C H / A)` or `#rgb`, `#rrggbb`. Returns null when unreadable. */
export function parseColor(value) {
  const text = String(value ?? "").trim();
  const oklch = text.match(
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?))?\s*\)$/i,
  );
  if (oklch) {
    const read = (raw, scale) =>
      raw.endsWith("%") ? (Number.parseFloat(raw) / 100) * scale : Number.parseFloat(raw);
    return {
      L: clamp(read(oklch[1], 1), 0, 1),
      C: Math.max(0, read(oklch[2], 0.4)),
      H: ((Number.parseFloat(oklch[3]) % 360) + 360) % 360,
      alpha: oklch[4] === undefined ? 1 : clamp(read(oklch[4], 1), 0, 1),
    };
  }
  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((digit) => digit + digit).join("") : hex[1];
    const channels = [0, 2, 4].map((offset) => Number.parseInt(digits.slice(offset, offset + 2), 16) / 255);
    return { ...srgbToOklch(channels), alpha: 1 };
  }
  return null;
}

const decode = (channel) =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
const encode = (channel) =>
  channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;

function srgbToOklch([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(decode);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(a, bb);
  const H = C < 1e-6 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return { L, C, H };
}

/** Linear sRGB for an OKLCH color, not clamped. */
function toLinear({ L, C, H }) {
  const radians = (H * Math.PI) / 180;
  const a = C * Math.cos(radians);
  const b = C * Math.sin(radians);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const EPSILON = 1e-5;
const inGamut = (color) => toLinear(color).every((channel) => channel >= -EPSILON && channel <= 1 + EPSILON);

/** Reduce chroma until the color fits sRGB. Lightness and hue are kept. */
export function toGamut(color) {
  const L = clamp(color.L, 0, 1);
  const candidate = { ...color, L };
  if (inGamut(candidate)) return candidate;
  let low = 0;
  let high = candidate.C;
  for (let step = 0; step < 24; step += 1) {
    const middle = (low + high) / 2;
    if (inGamut({ ...candidate, C: middle })) low = middle;
    else high = middle;
  }
  return { ...candidate, C: low };
}

/** Gamma-encoded sRGB in 0..1, for an in-gamut color. */
export function toSrgb(color) {
  return toLinear(toGamut(color)).map((channel) => clamp(encode(clamp(channel, 0, 1)), 0, 1));
}

/** WCAG relative luminance. */
export function luminance(color) {
  const [r, g, b] = toLinear(toGamut(color)).map((channel) => clamp(channel, 0, 1));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function composite(top, bottom) {
  const alpha = top.alpha ?? 1;
  if (alpha >= 1) return top;
  const over = toSrgb(top);
  const under = toSrgb(bottom);
  const mixed = over.map((channel, index) => channel * alpha + under[index] * (1 - alpha));
  return { ...srgbToOklch(mixed), alpha: 1 };
}

/** WCAG 2.2 contrast ratio. Accepts color strings or parsed colors. */
export function contrast(foreground, background) {
  const fg = typeof foreground === "string" ? parseColor(foreground) : foreground;
  const bg = typeof background === "string" ? parseColor(background) : background;
  if (!fg || !bg) return null;
  const top = composite(fg, bg);
  const a = luminance(top);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Serialize an OKLCH color, gamut-mapped, at stable precision. */
export function formatColor(color) {
  const mapped = toGamut(color);
  const chroma = round(mapped.C, 3);
  const hue = chroma === 0 ? 0 : round(mapped.H, 1);
  const alpha = mapped.alpha ?? 1;
  const body = `${round(mapped.L, 3)} ${chroma} ${hue}`;
  return alpha < 1 ? `oklch(${body} / ${round(alpha, 3)})` : `oklch(${body})`;
}

/**
 * Find the lightness closest to `color.L` that reaches `target` contrast
 * against `against`, moving only in `direction`. Hue and requested chroma are
 * kept; chroma is reduced only where the gamut demands it. Returns the
 * extreme when even that cannot reach the target, so callers can detect it.
 */
export function solveLightness(color, against, target, direction) {
  const meets = (L) => contrast({ ...color, L, alpha: 1 }, against) >= target;
  const start = clamp(color.L, 0, 1);
  if (meets(start)) return { ...color, L: start };
  const limit = direction === "darker" ? 0 : 1;
  if (!meets(limit)) return { ...color, L: limit };
  let near = start;
  let far = limit;
  for (let step = 0; step < 32; step += 1) {
    const middle = (near + far) / 2;
    if (meets(middle)) far = middle;
    else near = middle;
  }
  return { ...color, L: far };
}
