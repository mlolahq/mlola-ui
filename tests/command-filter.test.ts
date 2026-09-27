import assert from "node:assert/strict";
import test from "node:test";
import { matchCommand } from "../packages/components/_internal/match.ts";

test("prefix beats word start beats substring beats letters in order", () => {
  const prefix = matchCommand("Theme settings", "the")!;
  const word = matchCommand("Open theme studio", "the")!;
  const inside = matchCommand("Aesthetic tweaks", "the")!;
  const order = matchCommand("Toggle dark mode", "tdm")!;
  assert.ok(prefix.score > word.score && word.score > inside.score && inside.score > order.score);
  assert.deepEqual(word.positions, [5, 6, 7]);
});

test("keywords match without positions, and misses return null", () => {
  assert.equal(matchCommand("Toggle dark mode", "night", ["night", "theme"])?.positions.length, 0);
  assert.equal(matchCommand("Toggle dark mode", "xyz"), null);
  assert.deepEqual(matchCommand("Anything", "  "), { score: 0, positions: [] });
});

test("several words match when each starts a word in the label or its keywords", () => {
  assert.ok(matchCommand("Limit headers", "rate limit head", ["Rate limits Limit headers"]), "words spread over the page and section titles");
  assert.equal(matchCommand("Limit headers", "rate limit tail", ["Rate limits Limit headers"]), null, "every word has to be there");
  const whole = matchCommand("Rate limits", "rate limits")!;
  const spread = matchCommand("Limit headers", "rate limits", ["Rate limits Limit headers"])!;
  assert.ok(whole.score > spread.score, "the label itself still ranks first");
});
