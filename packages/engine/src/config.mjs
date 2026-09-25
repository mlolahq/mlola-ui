import { CHANNELS, normalizeSpec } from "./spec.mjs";

export const dimensions = [
  ["type", "utilitarian", "editorial"],
  ["geometry", "rectilinear", "organic"],
  ["density", "compact", "spacious"],
  ["depth", "flat", "layered"],
  ["motion", "still", "kinetic"],
  ["texture", "polished", "tactile"],
  ["rhythm", "regular", "syncopated"],
  ["icon", "systematic", "expressive"],
];

/**
 * The theme a page gets when it names none. Every consumer (the `:root`
 * selector, `normalizeSpec` inheritance, the CLI, the registry, the preview)
 * reads this instead of hard-coding a name.
 */
export const DEFAULT_THEME = "graphite";

/**
 * The canonical themes, as specs.
 *
 * None of them carries a palette. Each is a handful of decisions — eight
 * channels, a primary seed, the tint of the neutrals, a material and a font
 * set — and the engine derives every token from those, exactly as it does for
 * a project theme or one generated from a prompt. There is one path, so the
 * canonical themes are also the proof that the path works.
 */
export const canonicalSpecs = {
  graphite: {
    id: "graphite",
    label: "Graphite",
    vector: { type: 0.34, geometry: 0.4, density: 0.44, depth: 0.36, motion: 0.36, texture: 0, rhythm: 0.32, icon: 0.36 },
    color: { primary: "oklch(0.21 0.006 286)", neutral: { hue: 286, chroma: 0.004 } },
    material: "solid",
    fonts: "neutral",
  },
  atelier: {
    id: "atelier",
    label: "Atelier Umami",
    vector: { type: 0.82, geometry: 0.68, density: 0.58, depth: 0.62, motion: 0.48, texture: 0.78, rhythm: 0.7, icon: 0.82 },
    color: {
      primary: "oklch(0.55 0.16 58)",
      primaryDark: "oklch(0.75 0.16 68)",
      neutral: { hue: 80, chroma: 0.016 },
      ink: { hue: 260, chroma: 0.018 },
    },
    material: "paper",
    fonts: "editorial",
  },
  machined: {
    id: "machined",
    label: "Machined Titanium",
    vector: { type: 0.22, geometry: 0.05, density: 0.3, depth: 0.34, motion: 0.22, texture: 0.18, rhythm: 0.24, icon: 0.3 },
    color: {
      primary: "oklch(0.22 0.01 240)",
      primaryDark: "oklch(0.78 0.15 210)",
      neutral: { hue: 240, chroma: 0.004 },
      ink: { hue: 240, chroma: 0.01 },
    },
    material: "anodized",
    fonts: "technical",
  },
  aerogel: {
    id: "aerogel",
    label: "Aerogel Glass",
    vector: { type: 0.54, geometry: 0.92, density: 0.76, depth: 0.94, motion: 0.82, texture: 0.38, rhythm: 0.76, icon: 0.68 },
    color: {
      primary: "oklch(0.55 0.24 285)",
      primaryDark: "oklch(0.75 0.2 285)",
      neutral: { hue: 260, chroma: 0.018 },
      ink: { hue: 270, chroma: 0.028 },
    },
    material: "glass",
    fonts: "neutral",
  },
  nordic: {
    id: "nordic",
    label: "Nordic Earth",
    vector: { type: 0.62, geometry: 0.74, density: 0.66, depth: 0.46, motion: 0.34, texture: 0.86, rhythm: 0.62, icon: 0.54 },
    color: {
      primary: "oklch(0.5 0.14 150)",
      primaryDark: "oklch(0.72 0.15 150)",
      neutral: { hue: 135, chroma: 0.018 },
      ink: { hue: 145, chroma: 0.024 },
    },
    material: "solid",
    fonts: "neutral",
  },
};

/** Descriptive copy for the docs and the theme menu. Not read by the engine. */
const canonicalMeta = {
  graphite: { genre: "Product & AI", flavor: "Neutral graphite, crisp hairlines, and ink that stays out of the way.", bone: "Tight corners", typography: "Neutral sans throughout" },
  atelier: { genre: "Editorial & Craft", flavor: "Warm cotton paper, artisanal ink, and an amber signal.", bone: "Soft corners", typography: "Serif display + sans body" },
  machined: { genre: "Industrial & Telemetry", flavor: "Aerospace telemetry, compact precision, and high contrast.", bone: "Hard corners", typography: "Monospace throughout" },
  aerogel: { genre: "Liquid AI & Optics", flavor: "Optical luminescence, liquid refraction, and specular depth.", bone: "Fluid radius", typography: "Airy sans" },
  nordic: { genre: "Organic & Minimal", flavor: "Forest moss, fjord stone, terracotta, and organic calm.", bone: "Organic radius", typography: "Even sans rhythm" },
};

/**
 * Canonical themes in the shape the rest of the build reads: the normalised
 * spec, its vector as an ordered array, and the descriptive copy.
 */
export const profiles = Object.fromEntries(
  Object.entries(canonicalSpecs).map(([id, input]) => {
    const spec = normalizeSpec(input);
    return [id, { ...canonicalMeta[id], aliases: [], label: spec.label, spec, vector: CHANNELS.map((channel) => spec.vector[channel]) }];
  }),
);

export const coupling = {
  "type×rhythm": 0.14,
  "geometry×texture": 0.18,
  "density×rhythm": -0.1,
  "depth×texture": 0.2,
  "depth×motion": 0.16,
  "motion×rhythm": 0.12,
  "icon×type": 0.08,
};

/** Accepts a vector as the ordered array or as an object keyed by channel. */
function vectorOf(input) {
  const vector = input.vector ?? input;
  return Array.isArray(vector) ? vector : CHANNELS.map((channel) => vector[channel] ?? 0);
}

export function derive(profile) {
  const [type, geometry, density, depth, motion, texture, rhythm, icon] = vectorOf(profile);
  const gt = geometry * texture;
  const dt = depth * texture;
  const dm = depth * motion;
  const mr = motion * rhythm;
  const tr = type * rhythm;
  const durationNormal = 180 + 140 * motion + 35 * mr;

  // The damped oscillator behind every spatial transition. The motion axis
  // sets the damping ratio (still ↔ kinetic becomes damped ↔ springy) and the
  // natural frequency is chosen so the spring settles inside the normal
  // duration, which keeps CSS transitions and pointer kinetics in step.
  const springDamping = 0.95 - 0.5 * motion;
  const springOmega = 4 / (Math.max(0.2, springDamping) * (durationNormal / 1000));

  return {
    spacing: 3.5 + 1.5 * density - 0.3 * density * rhythm,
    radius: 2 + 12 * geometry + 4 * gt,
    border: 1 + 0.45 * (1 - geometry) + 0.2 * texture,
    shadowY: 2 + 12 * depth + 4 * dm,
    shadowBlur: 4 + 30 * depth + 10 * dt,
    shadowAlpha: 0.04 + 0.1 * depth + 0.04 * dt,
    durationFast: 110 + 80 * motion + 20 * mr,
    durationNormal,
    durationSlow: 300 + 260 * motion + 60 * dm,
    // Entrances that draw something in (a chart, a bar filling): twice the slow step.
    durationReveal: 2 * (300 + 260 * motion + 60 * dm),
    springOmega,
    springDamping,
    springBounceDamping: Math.max(0.22, springDamping * 0.55),
    displayWeight: Math.round(690 + 140 * type + 40 * tr),
    bodyLeading: 1.42 + 0.16 * density + 0.04 * tr,
    tracking: -0.006 - 0.014 * type + 0.006 * rhythm,
    iconStroke: 2.1 - 0.55 * icon + 0.12 * (1 - geometry),
    textureOpacity: 0.01 + 0.055 * texture + 0.02 * dt,
    // Density sets how much room a control and a panel take. The spacing scale
    // stays theme-invariant so composed pages still line up.
    controlHeight: 2 + 0.5 * density - 0.06 * density * rhythm,
    panelPadding: 1 + 0.75 * density,
  };
}
