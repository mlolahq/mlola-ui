/**
 * Color conversions for the picker: hex, rgb() and oklch() in and out, HSV
 * for the picking surface, and WCAG contrast. sRGB throughout; OKLCH through
 * OKLab, the space the Mlola engine derives its palettes in.
 */
export interface RGBA {
  /** 0 to 255. */
  r: number;
  g: number;
  b: number;
  /** 0 to 1. */
  a: number;
}

export interface HSVA {
  /** 0 to 360. */
  h: number;
  /** 0 to 1. */
  s: number;
  v: number;
  a: number;
}

export type ColorFormat = "hex" | "rgb" | "oklch";

const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const round = (value: number, digits = 0) => Number(value.toFixed(digits));

const toLinear = (channel: number) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
const toGamma = (channel: number) => (channel <= 0.0031308 ? 12.92 * channel : 1.055 * channel ** (1 / 2.4) - 0.055);

export function rgbToOklch({ r, g, b }: RGBA) {
  const [lr, lg, lb] = [r, g, b].map((channel) => toLinear(channel / 255));
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.sqrt(A * A + B * B);
  const h = C < 0.0001 ? 0 : ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360;
  return { l: L, c: C, h };
}

export function oklchToRgb(L: number, C: number, h: number, a = 1): RGBA {
  const radians = (h * Math.PI) / 180;
  const A = C * Math.cos(radians);
  const B = C * Math.sin(radians);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const linear = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  const [r, g, b] = linear.map((channel) => Math.round(clamp(toGamma(clamp(channel))) * 255));
  return { r, g, b, a };
}

/** Read #rgb, #rgba, #rrggbb, #rrggbbaa, rgb()/rgba() or oklch(); null for anything else. */
export function parseColor(text: string): RGBA | null {
  const value = text.trim().toLowerCase();
  const hex = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(value);
  if (hex) {
    let digits = hex[1];
    if (digits.length <= 4) digits = [...digits].map((digit) => digit + digit).join("");
    const channel = (index: number) => parseInt(digits.slice(index * 2, index * 2 + 2), 16);
    return { r: channel(0), g: channel(1), b: channel(2), a: digits.length === 8 ? round(channel(3) / 255, 3) : 1 };
  }
  const rgb = /^rgba?\(\s*([\d.]+%?)[\s,]+([\d.]+%?)[\s,]+([\d.]+%?)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(value);
  if (rgb) {
    const channel = (part: string) => clamp(part.endsWith("%") ? (parseFloat(part) / 100) * 255 : parseFloat(part), 0, 255);
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith("%") ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4]);
    return { r: Math.round(channel(rgb[1])), g: Math.round(channel(rgb[2])), b: Math.round(channel(rgb[3])), a: clamp(alpha) };
  }
  const oklch = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*([\d.]+%?))?\s*\)$/.exec(value);
  if (oklch) {
    const lightness = oklch[1].endsWith("%") ? parseFloat(oklch[1]) / 100 : parseFloat(oklch[1]);
    const alpha = oklch[4] === undefined ? 1 : oklch[4].endsWith("%") ? parseFloat(oklch[4]) / 100 : parseFloat(oklch[4]);
    return oklchToRgb(lightness, parseFloat(oklch[2]), parseFloat(oklch[3]), clamp(alpha));
  }
  return null;
}

export function rgbToHsv({ r, g, b, a }: RGBA): HSVA {
  const [red, green, blue] = [r / 255, g / 255, b / 255];
  const max = Math.max(red, green, blue);
  const delta = max - Math.min(red, green, blue);
  let h = 0;
  if (delta) {
    if (max === red) h = ((green - blue) / delta) % 6;
    else if (max === green) h = (blue - red) / delta + 2;
    else h = (red - green) / delta + 4;
  }
  return { h: (h * 60 + 360) % 360, s: max ? delta / max : 0, v: max, a };
}

export function hsvToRgb({ h, s, v, a }: HSVA): RGBA {
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const match = v - chroma;
  const [r, g, b] = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return { r: Math.round((r + match) * 255), g: Math.round((g + match) * 255), b: Math.round((b + match) * 255), a };
}

const hex2 = (value: number) => Math.round(value).toString(16).padStart(2, "0");

export function formatColor(color: RGBA, format: ColorFormat = "hex"): string {
  const alpha = color.a < 1;
  if (format === "rgb") return alpha ? `rgb(${color.r} ${color.g} ${color.b} / ${round(color.a, 2)})` : `rgb(${color.r} ${color.g} ${color.b})`;
  if (format === "oklch") {
    const { l, c, h } = rgbToOklch(color);
    return `oklch(${round(l * 100, 1)}% ${round(c, 3)} ${round(h, 1)}${alpha ? ` / ${round(color.a, 2)}` : ""})`;
  }
  return `#${hex2(color.r)}${hex2(color.g)}${hex2(color.b)}${alpha ? hex2(color.a * 255) : ""}`;
}

/** WCAG 2 relative luminance and contrast ratio, 1 to 21. */
export function luminance({ r, g, b }: RGBA) {
  const [lr, lg, lb] = [r, g, b].map((channel) => toLinear(channel / 255));
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

export function contrastRatio(first: RGBA, second: RGBA) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}
