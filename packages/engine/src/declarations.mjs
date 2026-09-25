import { derive } from "./config.mjs";
import { CHANNELS, resolveFonts } from "./spec.mjs";

/**
 * The derived custom properties a theme emits, besides its palette.
 *
 * Canonical themes, project themes and prompt-generated themes all come
 * through here, so every theme gets the same radius, density, depth, motion
 * and material tokens. Recipes read only these tokens — never a theme's name —
 * which is what lets a theme nobody has seen yet look finished.
 */

const round = (value, places = 3) => Number(value.toFixed(places));
const px = (value) => `${round(value)}px`;
const rem = (value) => `${round(value, 4)}rem`;
const ms = (value) => `${Math.round(value)}ms`;

/**
 * Dark surfaces swallow shadow, so the same elevation needs a denser one to
 * read at all. One multiplier keeps the two modes on the same curve.
 */
const DARK_SHADOW_GAIN = 2.6;

/**
 * Layered elevation: a tight contact shadow that anchors the surface, plus an
 * ambient one that grows with the step. A single blurred shadow reads as a
 * glow; two read as an object resting on a plane.
 */
export function shadowDeclarations(derived, gain = 1) {
  const alpha = (factor) => `oklch(0 0 0 / ${round(Math.min(0.6, derived.shadowAlpha * factor * gain), 4)})`;
  const { shadowY: y, shadowBlur: blur } = derived;
  return [
    `--ml-shadow-xs: 0 1px 2px ${alpha(0.55)}`,
    `--ml-shadow-sm: 0 1px 2px ${alpha(0.45)}, 0 ${px(y * 0.3)} ${px(blur * 0.4)} -1px ${alpha(0.6)}`,
    `--ml-shadow-md: 0 1px 2px ${alpha(0.4)}, 0 ${px(y * 0.6)} ${px(blur * 0.9)} -2px ${alpha(0.8)}`,
    `--ml-shadow-lg: 0 2px 4px ${alpha(0.35)}, 0 ${px(y * 1.2)} ${px(blur * 1.6)} -4px ${alpha(1)}`,
    `--ml-shadow-xl: 0 4px 8px ${alpha(0.3)}, 0 ${px(y * 2.2)} ${px(blur * 2.8)} -8px ${alpha(1.25)}`,
  ];
}

export function darkShadowDeclarations(vector) {
  return shadowDeclarations(derive({ vector }), DARK_SHADOW_GAIN);
}

/**
 * Surface material as tokens. Every surface recipe applies all four, so a
 * theme's material changes cards, menus, dialogs and bars at once without a
 * single theme-specific selector.
 */
export function materialDeclarations(material, vector) {
  const none = {
    "--ml-surface-alpha": "100%",
    "--ml-surface-blur": "none",
    "--ml-surface-grain": "none",
    "--ml-surface-highlight": "0 0 #0000",
  };
  const tokens = { ...none };
  if (material === "glass") {
    tokens["--ml-surface-alpha"] = "78%";
    tokens["--ml-surface-blur"] = `blur(${px(10 + 12 * vector.depth)}) saturate(150%)`;
    tokens["--ml-surface-highlight"] = "inset 0 1px color-mix(in oklab, oklch(1 0 0) 22%, transparent)";
  } else if (material === "paper") {
    tokens["--ml-surface-grain"] =
      "radial-gradient(color-mix(in srgb, var(--ml-text) calc(var(--ml-texture-opacity) * 100%), transparent) 0.6px, transparent 0.7px)";
  } else if (material === "anodized") {
    tokens["--ml-surface-highlight"] = "inset 0 1px color-mix(in oklab, var(--ml-text) 10%, transparent)";
  }
  return [`--ml-material: ${material}`, ...Object.entries(tokens).map(([name, value]) => `${name}: ${value}`)];
}

/** Geometry, type, density, motion, depth and material for one spec. */
export function themeDeclarations(spec) {
  const derived = derive(spec);
  const fonts = resolveFonts(spec.fonts);
  const control = derived.controlHeight;
  return [
    `--ml-theme: "${spec.id}"`,
    ...CHANNELS.map((channel) => `--ml-theme-${channel}: ${spec.vector[channel]}`),
    `--ml-radius-xs: ${px(Math.max(2, derived.radius * 0.38))}`,
    `--ml-radius-sm: ${px(derived.radius * 0.68)}`,
    `--ml-radius-md: ${px(derived.radius)}`,
    `--ml-radius-lg: ${px(derived.radius * 1.48)}`,
    `--ml-radius-pill: 9999px`,
    `--ml-border-width: ${derived.border >= 1.4 ? "1.5px" : "1px"}`,
    `--ml-control-sm: ${rem(control - 0.25)}`,
    `--ml-control-md: ${rem(control)}`,
    `--ml-control-lg: ${rem(control + 0.5)}`,
    `--ml-panel-padding: ${rem(derived.panelPadding)}`,
    `--ml-target-min: 2.75rem`,
    `--ml-font-sans: ${fonts.sans}`,
    `--ml-font-display: ${fonts.display}`,
    `--ml-font-mono: ${fonts.mono}`,
    `--ml-display-weight: ${derived.displayWeight}`,
    `--ml-body-leading: ${round(derived.bodyLeading)}`,
    `--ml-tracking: ${round(derived.tracking, 4)}em`,
    `--ml-icon-stroke: ${round(derived.iconStroke)}`,
    `--ml-duration-fast: ${ms(derived.durationFast)}`,
    `--ml-duration-normal: ${ms(derived.durationNormal)}`,
    `--ml-duration-slow: ${ms(derived.durationSlow)}`,
    `--ml-duration-reveal: ${ms(derived.durationReveal)}`,
    `--ml-ease-standard: cubic-bezier(0.2, 0, 0, 1)`,
    `--ml-ease-spring: cubic-bezier(0.16, 1, 0.3, 1)`,
    `--ml-ease-bounce: cubic-bezier(0.34, 1.4, 0.64, 1)`,
    `--ml-texture-opacity: ${round(derived.textureOpacity, 4)}`,
    ...materialDeclarations(spec.material, spec.vector),
    ...shadowDeclarations(derived),
  ];
}

/**
 * Tokens that are pure functions of the palette. Same formula in every theme
 * and mode, so they are declared once per block instead of stored per palette.
 */
export const PALETTE_DERIVED = [
  "--ml-focus: var(--ml-primary-text)",
  // Hover and pressed fills move a colour toward the page, so they lighten in
  // light mode and darken in dark mode without a second palette.
  "--ml-primary-hover: color-mix(in oklab, var(--ml-primary) 88%, var(--ml-background))",
  "--ml-fill-hover: color-mix(in oklab, var(--ml-text) 5%, transparent)",
  "--ml-fill-active: color-mix(in oklab, var(--ml-text) 9%, transparent)",
  // A soft, translucent track for switches, meters and sliders that stays
  // visible on any surface it sits on.
  "--ml-track: color-mix(in oklab, var(--ml-text) 12%, transparent)",
  // Checkbox, radio and similar boundaries must reach 3:1 against the page.
  "--ml-control-border: var(--ml-text-faint)",
  "--ml-ring: 0 0 0 3px color-mix(in oklab, var(--ml-focus) 24%, transparent)",
  // The veil behind overlays: the page's own background taken near black, so
  // it carries the theme's tint, and more opaque the darker the page, so it
  // reads as a light veil by day and still separates layers at night.
  "--ml-scrim: oklch(from var(--ml-background) calc(l * 0.22) c h / calc(0.54 - l * 0.28))",
];
