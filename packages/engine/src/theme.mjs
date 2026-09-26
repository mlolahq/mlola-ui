import { DEFAULT_THEME, profiles } from "./config.mjs";
import { derivePalette } from "./palette.mjs";
import { CHANNELS, normalizeSpec } from "./spec.mjs";
import { renderSpecCss } from "./theme-css.mjs";

/**
 * A project's own theme, from `mlola.theme.json`.
 *
 * The file is a theme spec (see spec.mjs) plus two escape hatches:
 *
 *   - `inherit` names the canonical theme whose decisions fill anything the
 *     file leaves out.
 *   - `scale` overrides spacing or type steps, and `extend` adds raw custom
 *     properties, for anything the engine has not modeled yet. Both are
 *     emitted after the derived tokens, so they win.
 *
 * The spec itself renders through the same function as every canonical theme.
 */

export const THEME_CHANNELS = CHANNELS;

export function defineTheme(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const inherit = typeof source.inherit === "string" && profiles[source.inherit] ? source.inherit : DEFAULT_THEME;
  const base = { ...profiles[inherit].spec, id: "custom", label: "" };
  const spec = normalizeSpec(source, base);
  return {
    ...spec,
    label: spec.label || spec.id,
    inherit,
    scale: source.scale && typeof source.scale === "object" ? { ...source.scale } : {},
    extend: source.extend && typeof source.extend === "object" ? { ...source.extend } : {},
  };
}

function overrideLines(theme) {
  const lines = [];
  for (const [name, value] of Object.entries(theme.scale)) {
    lines.push(`  --ml-${name.replace(/^--ml-/, "")}: ${value};`);
  }
  for (const [name, value] of Object.entries(theme.extend)) {
    lines.push(`  ${name.startsWith("--") ? name : `--${name}`}: ${value};`);
  }
  return lines;
}

/** Emit the project theme on the same `data-theme` contract as every theme. */
export function renderThemeCss(input) {
  const theme = defineTheme(input);
  const overrides = overrideLines(theme);
  const selector = `[data-theme="${theme.id}"]`;
  const tail = overrides.length ? `\n:root${selector},\n${selector} {\n${overrides.join("\n")}\n}\n` : "";
  return `/* Generated from the project theme file. Do not hand edit. */\n${renderSpecCss(theme, { banner: false })}${tail}`;
}

function manifestEntry(id, spec, extra) {
  return {
    id,
    label: spec.label,
    name: spec.label,
    swatch: derivePalette(spec, "light").primary,
    material: spec.material,
    theme: { ...spec.vector },
    spec,
    ...extra,
  };
}

/**
 * Describe every theme this build can render. The workbench and any other
 * consumer read this instead of keeping their own list, so adding a theme is
 * one spec and nothing else.
 */
export function renderThemeManifest(projectThemeInput = null) {
  const canonical = Object.entries(profiles).map(([id, profile]) =>
    manifestEntry(id, profile.spec, {
      genre: profile.genre,
      flavor: profile.flavor,
      bone: profile.bone,
      typography: profile.typography,
      origin: "canonical",
    }),
  );
  if (!projectThemeInput) return canonical;
  const theme = defineTheme(projectThemeInput);
  return [
    ...canonical,
    manifestEntry(theme.id, theme, {
      genre: "Project",
      flavor: `Defined in mlola.theme.json, inheriting ${theme.inherit}`,
      bone: "From your theme",
      typography: "From your theme",
      origin: "project",
      inherit: theme.inherit,
    }),
  ];
}
