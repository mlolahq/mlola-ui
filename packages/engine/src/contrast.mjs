/**
 * Colour math for the accessibility gate.
 *
 * The palettes are curated by hand, so "meets WCAG AA" has to be a measured
 * fact rather than a comment. This converts the engine's OKLCH tokens to sRGB,
 * composites translucent surfaces over their backdrop, and returns a contrast
 * ratio the way WCAG 2.2 defines it.
 */

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/** `oklch(L C H / A)` (alpha optional) to OKLab. */
export function parseOklch(value) {
  const match = String(value).match(
    /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?))?\s*\)$/i,
  );
  if (!match) return null;
  const read = (raw, scale = 1) =>
    raw.endsWith("%") ? (Number.parseFloat(raw) / 100) * scale : Number.parseFloat(raw);
  return {
    L: read(match[1], 1),
    C: read(match[2], 0.4),
    H: Number.parseFloat(match[3]),
    alpha: match[4] === undefined ? 1 : read(match[4], 1),
  };
}

/** OKLCH to gamma-encoded sRGB, clamped into gamut. */
export function oklchToSrgb({ L, C, H }) {
  const radians = (H * Math.PI) / 180;
  const a = C * Math.cos(radians);
  const b = C * Math.sin(radians);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return linear.map((channel) => {
    const encoded = channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055;
    return clamp01(encoded);
  });
}

/** Composite a possibly translucent colour over an opaque backdrop. */
function composite([top, alpha], [bottom]) {
  return top.map((channel, index) => channel * alpha + bottom[index] * (1 - alpha));
}

/** WCAG relative luminance from gamma-encoded sRGB. */
export function relativeLuminance([r, g, b]) {
  const lin = (channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(foreground, background) {
  const fg = parseOklch(foreground);
  const bg = parseOklch(background);
  if (!fg || !bg) return null;
  const backdrop = oklchToSrgb(bg);
  const top = oklchToSrgb(fg);
  const color = fg.alpha < 1 ? composite([top, fg.alpha], [backdrop, 1]) : top;
  const lighter = Math.max(relativeLuminance(color), relativeLuminance(backdrop));
  const darker = Math.min(relativeLuminance(color), relativeLuminance(backdrop));
  return (lighter + 0.05) / (darker + 0.05);
}
