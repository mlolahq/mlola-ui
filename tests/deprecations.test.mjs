import assert from "node:assert/strict";
import test from "node:test";
import {
  CURRENT_VERSION,
  DEPRECATIONS,
  compareVersions,
} from "../packages/engine/src/deprecations.mjs";
import { renderTokensCss } from "../packages/engine/src/render.mjs";

test("every compatibility alias has a future removal version", () => {
  const css = renderTokensCss();
  for (const deprecation of DEPRECATIONS) {
    assert.ok(
      compareVersions(CURRENT_VERSION, deprecation.removeIn) < 0,
      `${deprecation.id} is past its removal version ${deprecation.removeIn} and must be deleted`,
    );
    assert.ok(
      css.includes(deprecation.match),
      `${deprecation.id} is in the ledger but no longer emitted; drop the entry`,
    );
  }
});

test("version comparison is numeric, not lexical", () => {
  assert.equal(compareVersions("0.3.0", "0.4.0"), -1);
  assert.equal(compareVersions("0.10.0", "0.9.0"), 1);
  assert.equal(compareVersions("1.0.0", "1.0.0"), 0);
});
