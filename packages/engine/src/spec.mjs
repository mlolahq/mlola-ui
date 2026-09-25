import { parseColor } from "./color.mjs";

/**
 * The theme specification.
 *
 * A theme is a handful of decisions, not a list of tokens. Everything a page
 * renders — palettes in both modes, radius, depth, motion, type — is derived
 * from this spec by the engine, and contrast is solved rather than hoped for.
 * That is what lets a person, a script, or a model author a theme without being
 * able to break accessibility.
 *
 * Every field is one atomic decision, so it can be answered by one typed
 * question: a channel is a score on an ordered scale, a material or a font set
 * is a choice among named options, a colour is either given or chosen from a
 * hue family.
 *
 * Deliberate choices, because this has to survive a decade:
 *   - Plain JSON. A theme is readable by a human, a script, or a model.
 *   - Unknown keys are ignored and missing keys inherit, so a theme written for
 *     today's engine keeps working when the engine grows.
 *   - `normalizeSpec` never throws. `validateSpec` is the strict gate for
 *     machine-authored themes.
 */

export const SPEC_VERSION = 1;

/** The eight expression channels, in vector order. */
export const CHANNELS = ["type", "geometry", "density", "depth", "motion", "texture", "rhythm", "icon"];

/** Each channel as an ordered scale; the words are the poles a score moves between. */
export const CHANNEL_SCALES = {
  type: ["utilitarian", "editorial"],
  geometry: ["rectilinear", "organic"],
  density: ["compact", "spacious"],
  depth: ["flat", "layered"],
  motion: ["still", "kinetic"],
  texture: ["polished", "tactile"],
  rhythm: ["regular", "syncopated"],
  icon: ["systematic", "expressive"],
};

/** How surfaces are made. One choice, applied by every surface recipe. */
export const MATERIALS = {
  solid: "Opaque surfaces with soft, layered shadow.",
  glass: "Translucent surfaces that blur what is behind them.",
  paper: "Opaque surfaces with a faint printed grain.",
  anodized: "Opaque surfaces with a machined top highlight.",
};

/** Hue families a colour can be chosen from, as OKLCH hue angles. */
export const HUE_FAMILIES = {
  red: 25,
  orange: 50,
  amber: 70,
  yellow: 95,
  lime: 125,
  green: 150,
  teal: 180,
  cyan: 210,
  blue: 250,
  indigo: 270,
  violet: 290,
  purple: 310,
  pink: 350,
};

const INTER = 'var(--font-inter, "Inter"), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO = 'var(--font-jetbrains, "JetBrains Mono"), ui-monospace, "SFMono-Regular", Consolas, monospace';

/** Curated font pairings. A model picks one; it never invents a family name. */
export const FONT_SETS = {
  neutral: { label: "Neutral sans", sans: INTER, display: INTER, mono: MONO },
  editorial: {
    label: "Serif display, sans body",
    sans: INTER,
    display: 'var(--font-newsreader, "Newsreader"), "Iowan Old Style", Georgia, serif',
    mono: MONO,
  },
  technical: { label: "Monospace throughout", sans: MONO, display: MONO, mono: MONO },
  humanist: {
    label: "Humanist sans",
    sans: '"Source Sans 3", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
    display: '"Source Sans 3", "Segoe UI", ui-sans-serif, system-ui, sans-serif',
    mono: MONO,
  },
  geometric: {
    label: "Geometric sans",
    sans: '"Manrope", "Avenir Next", ui-sans-serif, system-ui, sans-serif',
    display: '"Manrope", "Avenir Next", ui-sans-serif, system-ui, sans-serif',
    mono: MONO,
  },
};

/** Tokens a palette defines. Anything else is derived in CSS from these. */
export const PALETTE_TOKENS = [
  "background",
  "background-subtle",
  "surface",
  "surface-elevated",
  "text",
  "text-muted",
  "text-faint",
  "border",
  "border-subtle",
  "primary",
  "primary-foreground",
  "primary-text",
  "primary-subtle",
  "success",
  "success-foreground",
  "success-text",
  "warning",
  "warning-foreground",
  "warning-text",
  "danger",
  "danger-foreground",
  "danger-text",
  "info",
  "info-foreground",
  "info-text",
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
  "chart-6",
];

const ID_PATTERN = /^[a-z][a-z0-9-]{0,47}$/;

const DEFAULT_SPEC = {
  specVersion: SPEC_VERSION,
  id: "custom",
  label: "Custom",
  vector: { type: 0.34, geometry: 0.4, density: 0.44, depth: 0.36, motion: 0.36, texture: 0, rhythm: 0.32, icon: 0.36 },
  color: {
    primary: "oklch(0.21 0.006 286)",
    primaryDark: null,
    neutral: { hue: 286, chroma: 0.004 },
    ink: null,
  },
  material: "solid",
  fonts: "neutral",
};

const clamp01 = (value, fallback) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;

function readVector(input, base) {
  const vector = { ...base };
  if (Array.isArray(input)) {
    CHANNELS.forEach((channel, index) => {
      vector[channel] = clamp01(input[index], base[channel]);
    });
  } else if (input && typeof input === "object") {
    for (const channel of CHANNELS) vector[channel] = clamp01(input[channel], base[channel]);
  }
  return vector;
}

function readTint(input, base) {
  if (!input || typeof input !== "object") return base;
  const hue = typeof input.hue === "number" && Number.isFinite(input.hue) ? ((input.hue % 360) + 360) % 360 : base?.hue ?? 0;
  const chroma = typeof input.chroma === "number" && Number.isFinite(input.chroma)
    ? Math.min(0.06, Math.max(0, input.chroma))
    : base?.chroma ?? 0;
  return { hue, chroma };
}

const readColor = (value, fallback) => (typeof value === "string" && parseColor(value) ? value.trim() : fallback);

/**
 * Font stacks are written into stylesheets verbatim, and Studio themes come
 * from strangers, so a stack may only hold family names, quotes, commas and
 * `var(--token)` references: nothing that can end a declaration or a block.
 */
export function isSafeFontStack(value) {
  if (typeof value !== "string" || !value.trim() || value.length > 300) return false;
  if (!/^[\w\s"',.()-]+$/.test(value)) return false;
  if (/\(/.test(value.replace(/var\(--[\w-]+/g, ""))) return false;
  const count = (character) => value.split(character).length - 1;
  return count('"') % 2 === 0 && count("'") % 2 === 0 && count("(") === count(")");
}

function readFonts(input, base) {
  if (typeof input === "string" && FONT_SETS[input]) return input;
  if (input && typeof input === "object") {
    const set = FONT_SETS[typeof base === "string" ? base : "neutral"] ?? FONT_SETS.neutral;
    const pick = (key) => (isSafeFontStack(input[key]) ? input[key].trim() : set[key]);
    return { sans: pick("sans"), display: pick("display"), mono: pick("mono") };
  }
  return base;
}

/** Resolve a font choice or an explicit stack to three font stacks. */
export function resolveFonts(fonts) {
  if (typeof fonts === "string") {
    const set = FONT_SETS[fonts] ?? FONT_SETS.neutral;
    return { sans: set.sans, display: set.display, mono: set.mono };
  }
  return fonts;
}

/**
 * Normalise any theme input into a complete spec. Never throws: a partial
 * theme inherits the rest from `base`, which defaults to a neutral spec.
 *
 * Also reads the pre-1.0 theme file shape (`theme` for the vector, `inherit`,
 * and `colors.light.signal`), so existing theme files keep working.
 */
export function normalizeSpec(input = {}, base = DEFAULT_SPEC) {
  const source = input && typeof input === "object" ? input : {};
  const legacySignal = source.colors?.light?.signal;
  const legacySignalDark = source.colors?.dark?.signal;
  const color = source.color && typeof source.color === "object" ? source.color : {};

  return {
    specVersion: SPEC_VERSION,
    id: typeof source.id === "string" && ID_PATTERN.test(source.id) ? source.id : base.id,
    label: typeof source.label === "string" && source.label.trim() ? source.label.trim().slice(0, 80) : base.label,
    vector: readVector(source.vector ?? source.theme, base.vector),
    color: {
      primary: readColor(color.primary ?? legacySignal, base.color.primary),
      primaryDark: readColor(color.primaryDark ?? legacySignalDark, base.color.primaryDark ?? null),
      neutral: readTint(color.neutral, base.color.neutral),
      ink: color.ink === null ? null : readTint(color.ink, base.color.ink ?? null),
    },
    material: typeof source.material === "string" && MATERIALS[source.material] ? source.material : base.material,
    fonts: readFonts(source.fonts, base.fonts),
  };
}

/**
 * The strict gate for machine-authored themes. Returns a list of problems;
 * an empty list means the spec can be stored as written.
 */
export function validateSpec(input) {
  const problems = [];
  if (!input || typeof input !== "object") return ["A theme spec must be an object."];
  if (input.specVersion !== SPEC_VERSION) problems.push(`specVersion must be ${SPEC_VERSION}.`);
  if (typeof input.id !== "string" || !ID_PATTERN.test(input.id)) {
    problems.push("id must start with a letter and use lowercase letters, digits and dashes (max 48).");
  }
  if (typeof input.label !== "string" || !input.label.trim()) problems.push("label is required.");
  for (const channel of CHANNELS) {
    const value = input.vector?.[channel];
    if (typeof value !== "number" || value < 0 || value > 1) problems.push(`vector.${channel} must be a number from 0 to 1.`);
  }
  if (!parseColor(input.color?.primary)) problems.push("color.primary must be an oklch() or hex colour.");
  if (input.color?.primaryDark != null && !parseColor(input.color.primaryDark)) {
    problems.push("color.primaryDark must be an oklch() or hex colour, or null.");
  }
  const neutral = input.color?.neutral;
  if (!neutral || typeof neutral.hue !== "number" || typeof neutral.chroma !== "number" || neutral.chroma < 0 || neutral.chroma > 0.06) {
    problems.push("color.neutral needs a hue and a chroma from 0 to 0.06.");
  }
  if (!MATERIALS[input.material]) problems.push(`material must be one of ${Object.keys(MATERIALS).join(", ")}.`);
  if (typeof input.fonts === "string" ? !FONT_SETS[input.fonts] : !["sans", "display", "mono"].every((key) => isSafeFontStack(input.fonts?.[key]))) {
    problems.push(`fonts must be one of ${Object.keys(FONT_SETS).join(", ")}, or an object with sans, display and mono font stacks.`);
  }
  return problems;
}

/** JSON Schema for the spec, published so editors and models can validate it. */
export function renderSpecSchema() {
  const unit = { type: "number", minimum: 0, maximum: 1 };
  const tint = {
    type: "object",
    properties: { hue: { type: "number", minimum: 0, maximum: 360 }, chroma: { type: "number", minimum: 0, maximum: 0.06 } },
    required: ["hue", "chroma"],
  };
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://ui.mlola.com/schema/theme-spec.json",
    title: "Mlola theme spec",
    description: "A theme as a few decisions. The engine derives every token and solves contrast in both modes.",
    type: "object",
    properties: {
      $schema: { type: "string" },
      studio: {
        type: "object",
        description: "Where a theme pulled from the Theme Studio came from. Informational; the engine ignores it.",
        properties: { id: { type: "string" }, version: { type: "integer", minimum: 1 }, source: { type: "string", format: "uri" } },
      },
      specVersion: { const: SPEC_VERSION },
      id: { type: "string", pattern: ID_PATTERN.source, description: "Used as data-theme=\"<id>\"." },
      label: { type: "string", maxLength: 80 },
      vector: {
        type: "object",
        description: "Eight expression channels from 0 to 1.",
        properties: Object.fromEntries(
          CHANNELS.map((channel) => [channel, { ...unit, description: `${CHANNEL_SCALES[channel][0]} (0) to ${CHANNEL_SCALES[channel][1]} (1)` }]),
        ),
      },
      color: {
        type: "object",
        properties: {
          primary: { type: "string", description: "Seed for the primary colour, oklch() or hex. Lightness is adjusted to meet contrast." },
          primaryDark: { type: ["string", "null"], description: "Optional different seed for dark mode." },
          neutral: { ...tint, description: "Tint of the page and surfaces." },
          ink: { anyOf: [tint, { type: "null" }], description: "Tint of text and dark-mode surfaces. Defaults to neutral." },
        },
        required: ["primary"],
      },
      material: { enum: Object.keys(MATERIALS) },
      fonts: {
        anyOf: [
          { enum: Object.keys(FONT_SETS) },
          {
            type: "object",
            properties: { sans: { type: "string" }, display: { type: "string" }, mono: { type: "string" } },
          },
        ],
      },
    },
    required: ["id"],
  };
}
