import assert from "node:assert/strict";
import test from "node:test";
import { contrast } from "../packages/engine/src/color.mjs";
import { profiles } from "../packages/engine/src/config.mjs";
import { auditPalette, derivePalette } from "../packages/engine/src/palette.mjs";

/**
 * WCAG 2.2 for the canonical themes, measured on what they actually emit.
 * The palettes are derived, so this is the same guarantee palette.test.mjs
 * proves for arbitrary seeds, pinned here for the themes people see first.
 */

test("every canonical palette meets its contrast guarantee in both modes", () => {
  for (const [name, profile] of Object.entries(profiles)) {
    for (const mode of ["light", "dark"]) {
      assert.deepEqual(auditPalette(derivePalette(profile.spec, mode)), [], `${name}.${mode}`);
    }
  }
});

test("body text is comfortably above AA, not just past it", () => {
  for (const [name, profile] of Object.entries(profiles)) {
    for (const mode of ["light", "dark"]) {
      const palette = derivePalette(profile.spec, mode);
      assert.ok(contrast(palette.text, palette.background) >= 12, `${name}.${mode} body text`);
      assert.ok(contrast(palette["text-faint"], palette.background) >= 3, `${name}.${mode} faint text`);
    }
  }
});

test("contrast math reproduces the WCAG anchors", () => {
  assert.equal(Math.round(contrast("oklch(1 0 0)", "oklch(0 0 0)")), 21);
  assert.equal(Math.round(contrast("oklch(0 0 0)", "oklch(1 0 0)")), 21);
  assert.equal(contrast("oklch(0.6 0.1 200)", "oklch(0.6 0.1 200)"), 1);
});
