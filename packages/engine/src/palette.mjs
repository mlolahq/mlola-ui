import { contrast, formatColor, parseColor, solveLightness } from "./color.mjs";

/**
 * Palettes are derived, not curated.
 *
 * A spec gives a primary seed and the tint of the neutrals; this module builds
 * every color token for light and dark mode from them. Each text or fill
 * pairing is solved to a WCAG target instead of being picked and then tested,
 * so any seed a person or a model supplies produces an accessible palette.
 *
 * Roles, so a token is never asked to do two jobs:
 *   - `primary`, `success`, ... are fills; their `-foreground` sits on them.
 *   - `primary-text` is the brand color solved for text on the page (links,
 *     focus rings). A vivid yellow stays a yellow button; its links go darker.
 *   - `success-text`, `danger-text`, ... are the status colors for text on
 *     the page, which a fill color usually cannot be in both modes.
 */

/** WCAG thresholds with a small margin, so rounding never drops below them. */
export const TARGETS = {
  text: 17,
  textDark: 17.5,
  // Colored text is solved with headroom, so it still clears AA on the
  // hover fills and ~15% tints the library draws under it.
  body: 5.3,
  // Every text role is readable text. Faint is the quietest level, not a
  // decorative one: it still clears AA, and muted sits clearly between.
  muted: 6.8,
  faint: 5.2,
  control: 3.1,
  borderLight: 1.33,
  borderSubtleLight: 1.18,
  borderDark: 1.5,
  borderSubtleDark: 1.28,
  separation: 1.55,
};

/** Of the page's backgrounds (including subtle panels), the one text has the least contrast against. */
function hardestBackground(foreground, neutrals) {
  return [neutrals.background, neutrals.surface, neutrals.subtle].reduce((worst, candidate) =>
    contrast(foreground, candidate) < contrast(foreground, worst) ? candidate : worst,
  );
}

/** Solve a text color against every page background it may sit on. */
function solveText(color, neutrals, target, direction) {
  let solved = solveLightness(color, neutrals.background, target, direction);
  solved = solveLightness(solved, hardestBackground(solved, neutrals), target, direction);
  return solved;
}

const WHITE = { L: 0.99, C: 0, H: 0 };

const STATUS = {
  success: { H: 150, C: 0.15, light: 0.52, dark: 0.72 },
  warning: { H: 75, C: 0.16, light: 0.76, dark: 0.8 },
  danger: { H: 25, C: 0.2, light: 0.56, dark: 0.7 },
  info: { H: 250, C: 0.16, light: 0.54, dark: 0.74 },
};

/** The darkest ink a fill can carry, tinted toward the fill's own hue. */
const inkOn = (hue) => ({ L: 0.18, C: 0.02, H: hue });

/**
 * Pick whichever of white or dark ink reads better on `fill`. If neither
 * reaches the target, move the fill until the better one does.
 */
function fillPair(fill, target, preferLight) {
  let base = fill;
  const dark = inkOn(fill.H);
  const light = contrast(WHITE, base);
  const deep = contrast(dark, base);
  if (Math.max(light, deep) >= target) {
    return { fill: base, foreground: light >= deep ? WHITE : dark };
  }
  if (preferLight ? deep > light : light >= deep) {
    base = solveLightness(base, dark, target, "lighter");
    return { fill: base, foreground: dark };
  }
  base = solveLightness(base, WHITE, target, "darker");
  return { fill: base, foreground: WHITE };
}

const tint = (hue, chroma, L) => ({ L, C: chroma, H: hue });

function neutralsLight(spec) {
  const { texture, depth } = spec.vector;
  const paper = spec.color.neutral;
  const ink = spec.color.ink ?? paper;
  // Tactile themes sit on a tinted canvas with lighter cards; polished ones
  // are flat, with cards separated by hairlines and shadow alone.
  const surfaceL = 1 - 0.014 * texture;
  const surface = tint(paper.hue, paper.chroma * 0.6, surfaceL);
  const background = tint(paper.hue, paper.chroma, surfaceL - 0.02 * texture - 0.004 * depth * texture);
  const elevated = tint(paper.hue, paper.chroma * 0.4, Math.min(1, surfaceL + 0.006));
  const subtle = tint(paper.hue, paper.chroma * 1.2 + 0.001, background.L - 0.032);
  const border = solveLightness(tint(paper.hue, paper.chroma * 1.3 + 0.002, 0.95), background, TARGETS.borderLight, "darker");
  const borderSubtle = solveLightness(tint(paper.hue, paper.chroma + 0.002, 0.97), background, TARGETS.borderSubtleLight, "darker");
  const text = solveLightness(tint(ink.hue, Math.max(ink.chroma, 0.006), 0.26), background, TARGETS.text, "darker");
  const muted = solveLightness(tint(ink.hue, Math.max(ink.chroma * 1.5, 0.01), 0.56), subtle, TARGETS.muted, "darker");
  const faint = solveLightness(tint(ink.hue, Math.max(ink.chroma, 0.008), 0.6), subtle, TARGETS.faint, "darker");
  return { background, subtle, surface, elevated, border, borderSubtle, text, muted, faint };
}

function neutralsDark(spec) {
  const { texture, depth } = spec.vector;
  const paper = spec.color.neutral;
  const ink = spec.color.ink ?? paper;
  // Dark surfaces take the ink's hue: a warm paper theme reads as cool ink at
  // night, the way printed matter does. Text takes the paper's.
  const chroma = Math.max(ink.chroma * 1.2, 0.004);
  const background = tint(ink.hue, chroma, 0.148 - 0.018 * texture);
  const surface = tint(ink.hue, chroma, background.L + 0.025 + 0.02 * depth);
  const elevated = tint(ink.hue, chroma * 1.1, surface.L + 0.035);
  const subtle = tint(ink.hue, chroma * 1.1, background.L + 0.058);
  const border = solveLightness(tint(ink.hue, chroma * 1.3, 0.25), background, TARGETS.borderDark, "lighter");
  const borderSubtle = solveLightness(tint(ink.hue, chroma * 1.1, 0.2), background, TARGETS.borderSubtleDark, "lighter");
  const text = solveLightness(tint(paper.hue, Math.min(paper.chroma, 0.01), 0.9), background, TARGETS.textDark, "lighter");
  const lightest = elevated.L > subtle.L ? elevated : subtle;
  const muted = solveLightness(tint(paper.hue, Math.max(paper.chroma * 1.4, 0.01), 0.66), lightest, TARGETS.muted, "lighter");
  const faint = solveLightness(tint(paper.hue, Math.max(paper.chroma, 0.008), 0.5), lightest, TARGETS.faint, "lighter");
  return { background, subtle, surface, elevated, border, borderSubtle, text, muted, faint };
}

const isAchromatic = (color) => color.C < 0.03;

/**
 * WCAG 2's ratio favours dark ink on mid-tone saturated colors, but eyes read
 * white on a violet, blue, green or red far better. In light mode a chromatic,
 * non-warm fill darkens a little (at most 0.12 L) so white clears the target;
 * yellows and oranges keep dark ink, as convention expects.
 */
function deepenForWhite(fill, mode) {
  const warm = fill.H > 40 && fill.H < 130;
  if (mode !== "light" || isAchromatic(fill) || warm || contrast(WHITE, fill) >= TARGETS.body) return fill;
  const deeper = solveLightness(fill, WHITE, TARGETS.body, "darker");
  return fill.L - deeper.L <= 0.12 ? deeper : fill;
}

function primaryFor(spec, mode, neutrals) {
  const seedText = mode === "dark" ? spec.color.primaryDark ?? spec.color.primary : spec.color.primary;
  const seed = parseColor(seedText) ?? { L: 0.21, C: 0.006, H: 286 };
  let fill = { L: seed.L, C: seed.C, H: seed.H };
  if (mode === "dark" && !spec.color.primaryDark) {
    // Without an explicit night seed, a near-black brand inverts to near-white
    // and a deep brand color is lifted, so neither sinks into the page.
    fill = isAchromatic(seed)
      ? { L: neutrals.text.L, C: seed.C, H: seed.H }
      : { L: Math.max(seed.L, 0.62), C: seed.C, H: seed.H };
  }
  // A fill keeps the brand's color; it only has to stand apart from the page
  // and carry its own label. Text contrast is primary-text's job.
  if (contrast(fill, neutrals.background) < TARGETS.separation) {
    fill = solveLightness(fill, neutrals.background, TARGETS.separation, mode === "light" ? "darker" : "lighter");
  }
  fill = deepenForWhite(fill, mode);
  const pair = fillPair(fill, TARGETS.body, mode === "dark");
  // Links and focus rings follow the brand. A monochrome brand inverted for
  // the night reads as the inverted ink, not a mid gray lifted from the day's.
  const textSeed = mode === "dark" && !spec.color.primaryDark && isAchromatic(seed) ? fill : seed;
  const text = solveText({ L: textSeed.L, C: textSeed.C, H: textSeed.H }, neutrals, TARGETS.body, mode === "light" ? "darker" : "lighter");
  const subtleChroma = isAchromatic(seed) ? Math.max(spec.color.neutral.chroma, 0.003) : Math.min(seed.C * 0.35, 0.06);
  const subtle = mode === "light"
    ? { L: neutrals.subtle.L + 0.01, C: subtleChroma, H: seed.H }
    : { L: neutrals.subtle.L + 0.03, C: Math.min(subtleChroma * 1.2, 0.07), H: seed.H };
  return { primary: pair.fill, foreground: pair.foreground, text, subtle };
}

function statusFor(name, mode, neutrals) {
  const { H, C, light, dark } = STATUS[name];
  const start = deepenForWhite({ L: mode === "light" ? light : dark, C, H }, mode);
  const pair = fillPair(start, TARGETS.body, mode === "dark" || name === "warning");
  const text = solveText(
    { L: mode === "light" ? Math.min(light, 0.55) : Math.max(dark, 0.72), C, H },
    neutrals,
    TARGETS.body,
    mode === "light" ? "darker" : "lighter",
  );
  return { fill: pair.fill, foreground: pair.foreground, text };
}

/**
 * Six categorical colors for charts, apart from the status roles so a series
 * never reads as "good" or "bad" by accident. The first follows the brand's
 * hue (blue for a monochrome brand); the rest are the hues furthest from those
 * already taken, so neighbors never share a family. Each is solved to 3:1
 * against the surface (WCAG 1.4.11 for graphics).
 */
const CHART_HUES = [255, 185, 300, 50, 10, 145];

function chartPalette(spec, mode, neutrals) {
  const seed = parseColor(spec.color.primary) ?? { L: 0.21, C: 0.006, H: 286 };
  const anchor = isAchromatic(seed) ? 255 : seed.H;
  const distance = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
  // The brand takes the place of the nearest hue, so there are always six.
  const nearest = CHART_HUES.reduce((best, hue) => (distance(hue, anchor) < distance(best, anchor) ? hue : best));
  const hues = [anchor];
  const pool = CHART_HUES.filter((hue) => hue !== nearest);
  while (hues.length < 6 && pool.length) {
    pool.sort((a, b) => Math.min(...hues.map((hue) => distance(b, hue))) - Math.min(...hues.map((hue) => distance(a, hue))));
    hues.push(pool.shift());
  }
  const chroma = isAchromatic(seed) ? 0.15 : Math.min(0.17, Math.max(0.11, seed.C));
  return hues.map((hue) => {
    // Warm hues read darker than they measure; they start lighter and richer so
    // the contrast solve lands on orange, not brown.
    const warm = hue > 30 && hue < 110;
    const start = mode === "light" ? { L: warm ? 0.7 : 0.62, C: warm ? chroma + 0.03 : chroma, H: hue } : { L: 0.74, C: chroma * 0.92, H: hue };
    return solveLightness(start, neutrals.surface, 3.05, mode === "light" ? "darker" : "lighter");
  });
}

/**
 * The fill under a pointer. It moves a little toward the page, as a hover
 * does, unless that would cost its label contrast; then it moves away from
 * the label instead. Either way hovering never drops below the target.
 */
function hoverFor(fill, foreground, neutrals) {
  const toward = { L: fill.L + (neutrals.background.L - fill.L) * 0.12, C: fill.C * 0.88, H: fill.H };
  if (contrast(foreground, toward) >= TARGETS.body) return toward;
  const away = foreground.L > fill.L ? -0.05 : 0.05;
  return solveLightness({ L: Math.min(1, Math.max(0, fill.L + away)), C: fill.C, H: fill.H }, foreground, TARGETS.body, away < 0 ? "darker" : "lighter");
}

/** Every palette token for one mode, as serialized OKLCH strings. */
export function derivePalette(spec, mode = "light") {
  const neutrals = mode === "dark" ? neutralsDark(spec) : neutralsLight(spec);
  const primary = primaryFor(spec, mode, neutrals);
  const palette = {
    background: neutrals.background,
    "background-subtle": neutrals.subtle,
    surface: neutrals.surface,
    "surface-elevated": neutrals.elevated,
    text: neutrals.text,
    "text-muted": neutrals.muted,
    "text-faint": neutrals.faint,
    border: neutrals.border,
    "border-subtle": neutrals.borderSubtle,
    primary: primary.primary,
    "primary-foreground": primary.foreground,
    "primary-hover": hoverFor(primary.primary, primary.foreground, neutrals),
    "primary-text": primary.text,
    "primary-subtle": primary.subtle,
  };
  for (const name of Object.keys(STATUS)) {
    const status = statusFor(name, mode, neutrals);
    palette[name] = status.fill;
    palette[`${name}-foreground`] = status.foreground;
    palette[`${name}-hover`] = hoverFor(status.fill, status.foreground, neutrals);
    palette[`${name}-text`] = status.text;
  }
  chartPalette(spec, mode, neutrals).forEach((color, index) => {
    palette[`chart-${index + 1}`] = color;
  });
  return Object.fromEntries(Object.entries(palette).map(([token, value]) => [token, formatColor(value)]));
}

/** The pairings the guarantee covers, as [foreground, background, minimum]. */
export const GUARANTEED_PAIRS = [
  ["text", "background", 7],
  ["text", "surface", 7],
  ["text", "surface-elevated", 7],
  ["text-muted", "background", 4.5],
  ["text-muted", "surface", 4.5],
  ["text-muted", "background-subtle", 4.5],
  ["chart-1", "surface", 3],
  ["chart-2", "surface", 3],
  ["chart-3", "surface", 3],
  ["chart-4", "surface", 3],
  ["chart-5", "surface", 3],
  ["chart-6", "surface", 3],
  ["text-faint", "background", 4.5],
  ["text-faint", "surface", 4.5],
  ["text-faint", "background-subtle", 4.5],
  ["primary-text", "background-subtle", 4.5],
  ["success-text", "background-subtle", 4.5],
  ["warning-text", "background-subtle", 4.5],
  ["danger-text", "background-subtle", 4.5],
  ["info-text", "background-subtle", 4.5],
  ["primary", "background", 1.5],
  ["primary-text", "background", 4.5],
  ["primary-text", "surface", 4.5],
  ["primary-foreground", "primary", 4.5],
  ["primary-foreground", "primary-hover", 4.5],
  ["success-foreground", "success-hover", 4.5],
  ["warning-foreground", "warning-hover", 4.5],
  ["danger-foreground", "danger-hover", 4.5],
  ["info-foreground", "info-hover", 4.5],
  ["success-foreground", "success", 4.5],
  ["warning-foreground", "warning", 4.5],
  ["danger-foreground", "danger", 4.5],
  ["info-foreground", "info", 4.5],
  ["success-text", "background", 4.5],
  ["warning-text", "background", 4.5],
  ["danger-text", "background", 4.5],
  ["info-text", "background", 4.5],
  ["success-text", "surface", 4.5],
  ["warning-text", "surface", 4.5],
  ["danger-text", "surface", 4.5],
  ["info-text", "surface", 4.5],
];

/** Measure a palette against the guarantee. Returns the failing pairs. */
export function auditPalette(palette) {
  const failures = [];
  for (const [foreground, background, minimum] of GUARANTEED_PAIRS) {
    const ratio = contrast(palette[foreground], palette[background]);
    if (ratio === null || ratio < minimum) {
      failures.push({ foreground, background, minimum, ratio: ratio === null ? null : Number(ratio.toFixed(2)) });
    }
  }
  return failures;
}
