import assert from "node:assert/strict";
import test from "node:test";
import { contrast, parseColor, toGamut } from "../packages/engine/src/color.mjs";
import { auditPalette, derivePalette } from "../packages/engine/src/palette.mjs";
import { CHANNELS, normalizeSpec, PALETTE_TOKENS, validateSpec } from "../packages/engine/src/spec.mjs";

/**
 * The palette guarantee, tested the way it is claimed: for any seed. A small
 * deterministic generator keeps the run reproducible while still covering
 * thousands of themes nobody would curate by hand — the kind a model or a
 * person with a strong brand color will produce.
 */
function generator(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSpec(random) {
  const oklch = (maxChroma) => `oklch(${random().toFixed(3)} ${(random() * maxChroma).toFixed(3)} ${(random() * 360).toFixed(1)})`;
  return normalizeSpec({
    vector: Object.fromEntries(CHANNELS.map((channel) => [channel, random()])),
    color: {
      primary: oklch(0.37),
      primaryDark: random() < 0.3 ? oklch(0.3) : null,
      neutral: { hue: random() * 360, chroma: random() * 0.06 },
      ink: random() < 0.5 ? { hue: random() * 360, chroma: random() * 0.06 } : undefined,
    },
  });
}

test("every derived palette meets its contrast guarantee, for any seed", () => {
  const random = generator(20260923);
  for (let index = 0; index < 1500; index += 1) {
    const spec = randomSpec(random);
    for (const mode of ["light", "dark"]) {
      const failures = auditPalette(derivePalette(spec, mode));
      assert.deepEqual(failures, [], `${mode} ${JSON.stringify(spec.color)} ${JSON.stringify(spec.vector)}`);
    }
  }
});

test("brand colors hex and oklch alike, including ones outside sRGB", () => {
  for (const primary of ["#ffd400", "#00ffff", "#0b1b3f", "#ff0000", "#ffffff", "#000000", "oklch(0.7 0.37 150)"]) {
    const spec = normalizeSpec({ color: { primary } });
    for (const mode of ["light", "dark"]) {
      assert.deepEqual(auditPalette(derivePalette(spec, mode)), [], `${primary} ${mode}`);
    }
  }
});

test("a palette defines exactly the documented tokens, as in-gamut OKLCH", () => {
  const palette = derivePalette(normalizeSpec({}), "light");
  assert.deepEqual(Object.keys(palette).sort(), [...PALETTE_TOKENS].sort());
  for (const value of Object.values(palette)) {
    const color = parseColor(value);
    assert.ok(color, value);
    assert.ok(Math.abs(toGamut(color).C - color.C) < 0.002, `${value} must already be in gamut`);
  }
});

test("a vivid fill keeps its color; its text role goes dark enough to read", () => {
  const spec = normalizeSpec({ color: { primary: "#ffd400" } });
  const light = derivePalette(spec, "light");
  assert.ok(parseColor(light.primary).L > 0.8, "a yellow brand stays a yellow button");
  assert.ok(contrast(light["primary-text"], light.background) >= 4.5, "its links still read on white");
});

test("a near-black brand inverts at night instead of vanishing", () => {
  const dark = derivePalette(normalizeSpec({ color: { primary: "oklch(0.2 0.01 286)" } }), "dark");
  assert.ok(parseColor(dark.primary).L > 0.85);
});

test("color parsing reads hex and oklch, and rejects anything else", () => {
  const red = parseColor("#ff0000");
  assert.ok(Math.abs(red.L - 0.628) < 0.002 && Math.abs(red.H - 29.2) < 0.5);
  assert.equal(parseColor("red"), null);
  assert.equal(parseColor("rgb(0 0 0)"), null);
  assert.equal(Math.round(contrast("#ffffff", "#000000")), 21);
});

test("normalizeSpec never throws and validateSpec is strict", () => {
  for (const input of [null, 42, "x", [], { vector: "no" }, { color: { primary: "banana" } }]) {
    assert.doesNotThrow(() => normalizeSpec(input));
  }
  assert.deepEqual(validateSpec(normalizeSpec({ id: "acme", label: "Acme" })), []);
  assert.ok(validateSpec({ id: "Bad Id" }).length > 3);
  // The pre-1.0 theme file shape still reads.
  const legacy = normalizeSpec({ theme: { density: 0.9 }, colors: { light: { signal: "#123456" } } });
  assert.equal(legacy.vector.density, 0.9);
  assert.equal(legacy.color.primary, "#123456");
});

test("an untrusted spec cannot write outside its own declarations", async () => {
  const { renderSpecCss } = await import("../packages/engine/src/theme-css.mjs");
  const hostile = normalizeSpec({
    id: "hostile",
    label: "x */ body { display: none } /*",
    fonts: { sans: "Inter; } body { display: none", display: '"Fraunces", serif', mono: "url(https://example.com)" },
  });
  assert.deepEqual(validateSpec(hostile), []);
  assert.equal(hostile.fonts.display, '"Fraunces", serif');
  const css = renderSpecCss(hostile);
  assert.ok(!css.includes("*/ body"), "the label closed the banner comment");
  assert.ok(!css.includes("Inter; }"), "a font stack closed its declaration");
  assert.ok(!css.includes("url("), "a url() reached the stylesheet");
  assert.deepEqual(
    validateSpec({ ...hostile, fonts: { sans: "a; }", display: "b", mono: "c" } }).length,
    1,
  );
});
