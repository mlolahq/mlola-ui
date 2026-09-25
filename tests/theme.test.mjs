import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { derivePalette } from "../packages/engine/src/palette.mjs";
import { defineTheme, renderThemeCss, THEME_CHANNELS } from "../packages/engine/src/theme.mjs";

/**
 * A theme file is the one thing a brand writes by hand, so it has to be
 * forgiving: partial today, still valid after the engine grows, and never a
 * crash because someone typed a key that does not exist yet.
 */

test("an empty theme is valid and inherits the default theme", () => {
  const theme = defineTheme({});
  assert.equal(theme.id, "custom");
  assert.equal(theme.inherit, "graphite");
  assert.deepEqual(Object.keys(theme.vector), THEME_CHANNELS);
  assert.ok(theme.color.primary);
  assert.equal(theme.material, "solid");
});

test("only the decisions a file names are replaced", () => {
  const theme = defineTheme({ inherit: "atelier", color: { primary: "#1d4ed8" } });
  assert.equal(theme.color.primary, "#1d4ed8");
  assert.equal(theme.material, "paper", "everything else comes from the inherited theme");
  assert.equal(theme.fonts, "editorial");
});

test("unknown keys are ignored rather than fatal", () => {
  const theme = defineTheme({ somethingFromTheFuture: { nested: true }, color: { notARealToken: "red", primary: "#0f766e" } });
  assert.equal(theme.color.primary, "#0f766e");
  assert.equal(theme.color.notARealToken, undefined);
});

test("the vector accepts an object or an array, and clamps", () => {
  assert.equal(defineTheme({ vector: { density: 0.25 } }).vector.density, 0.25);
  assert.equal(defineTheme({ vector: [1, 0, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5] }).vector.type, 1);
  const clamped = defineTheme({ vector: { type: 42, geometry: -9 } });
  assert.equal(clamped.vector.type, 1);
  assert.equal(clamped.vector.geometry, 0);
});

test("a bad id falls back instead of emitting a broken selector", () => {
  assert.equal(defineTheme({ id: "Has Spaces" }).id, "custom");
  assert.equal(defineTheme({ id: "9lives" }).id, "custom");
  assert.equal(defineTheme({ id: "acme-2" }).id, "acme-2");
});

test("inheriting from an unknown theme falls back to the default", () => {
  assert.equal(defineTheme({ inherit: "nope" }).inherit, "graphite");
  assert.equal(defineTheme({ inherit: "nordic" }).inherit, "nordic");
});

test("rendered CSS selects on the same data-theme contract and carries the derived palette", () => {
  const input = { id: "acme", color: { primary: "oklch(0.5 0.2 265)" } };
  const css = renderThemeCss(input);
  assert.match(css, /\[data-theme="acme"\]/);
  assert.match(css, /\[data-theme="acme"\]\[data-mode="dark"\]/);
  const palette = derivePalette(defineTheme(input), "light");
  assert.ok(css.includes(`--ml-primary: ${palette.primary};`));
  assert.match(css, /--ml-font-sans:/);
  assert.match(css, /--ml-radius-md:/);
  assert.match(css, /--ml-control-md:/);
  assert.match(css, /--ml-surface-blur:/);
});

test("scale and extend win over everything the engine derived", () => {
  const css = renderThemeCss({
    id: "acme",
    scale: { "space-4": "1.0625rem", "--ml-type-base": "0.9375rem" },
    extend: { "--acme-gradient": "linear-gradient(red, blue)", "ml-radius-pill": "4px" },
  });
  assert.match(css, /--ml-space-4: 1\.0625rem/);
  assert.match(css, /--ml-type-base: 0\.9375rem/);
  assert.match(css, /--acme-gradient: linear-gradient\(red, blue\)/);
  assert.match(css, /--ml-radius-pill: 4px/);
  assert.ok(css.lastIndexOf("--ml-radius-pill: 4px") > css.indexOf("--ml-radius-pill: 9999px"));
});

test("the shipped example theme is valid and renders", () => {
  const file = path.join(process.cwd(), "mlola.theme.example.json");
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  const theme = defineTheme(parsed);
  assert.equal(theme.id, "acme");
  assert.equal(theme.inherit, "nordic");
  const css = renderThemeCss(parsed);
  assert.match(css, /\[data-theme="acme"\]/);
  assert.match(css, /Fraunces/);
});
