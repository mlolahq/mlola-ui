import assert from "node:assert/strict";
import test from "node:test";
import {
  DIAL_SWEEP,
  dialAngle,
  dialArc,
  dialFace,
  dialFit,
  dialPositionAt,
  dialTrack,
  dialTurn,
  fitMenu,
  fitTooltip,
  placeTooltip,
  clampToStep,
  composerKeyAction,
  confidenceBand,
  contextUsage,
  formatDuration,
  formatTokens,
  isPinnedToEnd,
  revealLength,
  smoothLevel,
  spectrumToLevels,
  focusTrapIndex,
  isEmail,
  passwordStrength,
  percentOf,
  resolveDisclosure,
  rovingIndex,
  isSidewaysDrag,
  sliderValueForKey,
  valueFromRatio,
} from "../packages/behavior/src/logic.js";

/**
 * These functions are the one place a decision is made. React renders from
 * them and the framework-free runtime mutates from them, so an error here is
 * an error everywhere, and agreement here is agreement everywhere.
 */

test("clampToStep snaps onto the grid measured from min", () => {
  assert.equal(clampToStep(43, { min: 0, max: 100, step: 5 }), 45);
  assert.equal(clampToStep(42, { min: 0, max: 100, step: 5 }), 40);
  assert.equal(clampToStep(-20, { min: 0, max: 100, step: 5 }), 0);
  assert.equal(clampToStep(9999, { min: 0, max: 100, step: 5 }), 100);
  // A grid that does not start at zero still measures from min.
  assert.equal(clampToStep(7, { min: 1, max: 21, step: 4 }), 9);
});

test("clampToStep keeps fractional steps free of float drift", () => {
  assert.equal(clampToStep(0.30000000000000004, { min: 0, max: 1, step: 0.1 }), 0.3);
  assert.equal(clampToStep(0.7, { min: 0, max: 1, step: 0.1 }), 0.7);
});

test("clampToStep survives values a caller should never send", () => {
  assert.equal(clampToStep(Number.NaN, { min: 5, max: 10, step: 1 }), 5);
  assert.equal(clampToStep(7, { min: 0, max: 10, step: 0 }), 7);
  assert.equal(clampToStep(7, { min: 10, max: 0, step: 1 }), 10);
});

test("valueFromRatio and percentOf are inverses on the grid", () => {
  const bounds = { min: 0, max: 200, step: 10 };
  for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
    const value = valueFromRatio(ratio, bounds);
    assert.equal(percentOf(value, bounds), ratio * 100);
  }
  assert.equal(valueFromRatio(-3, bounds), 0);
  assert.equal(valueFromRatio(9, bounds), 200);
});

test("isSidewaysDrag tells a finger dragging a slider from one scrolling past it", () => {
  assert.equal(isSidewaysDrag(3, 0), false, "too small to mean anything yet");
  assert.equal(isSidewaysDrag(8, 2), true, "sideways");
  assert.equal(isSidewaysDrag(-8, 2), true, "sideways to the left");
  assert.equal(isSidewaysDrag(8, 20), false, "mostly up or down: the page is scrolling");
  assert.equal(isSidewaysDrag(0, 40), false);
  assert.equal(isSidewaysDrag(12, 12), true, "a diagonal counts as a drag");
  assert.equal(isSidewaysDrag(8, 0, 10), false, "a larger threshold");
});

test("sliderValueForKey reports unknown keys rather than guessing", () => {
  const bounds = { min: 0, max: 100, step: 5 };
  assert.equal(sliderValueForKey("ArrowRight", 40, bounds), 45);
  assert.equal(sliderValueForKey("ArrowUp", 40, bounds), 45);
  assert.equal(sliderValueForKey("ArrowLeft", 40, bounds), 35);
  assert.equal(sliderValueForKey("Home", 40, bounds), 0);
  assert.equal(sliderValueForKey("End", 40, bounds), 100);
  assert.equal(sliderValueForKey("PageUp", 40, bounds), 50);
  assert.equal(sliderValueForKey("a", 40, bounds), undefined);
  assert.equal(sliderValueForKey("Enter", 40, bounds), undefined);
});

test("sliderValueForKey stays inside the range at the edges", () => {
  const bounds = { min: 0, max: 10, step: 1 };
  assert.equal(sliderValueForKey("ArrowLeft", 0, bounds), 0);
  assert.equal(sliderValueForKey("ArrowRight", 10, bounds), 10);
});

test("rovingIndex wraps, and steps over disabled entries", () => {
  const enabled = (index) => index !== 1;
  assert.equal(rovingIndex(3, 0, "ArrowRight", { enabled }), 2);
  assert.equal(rovingIndex(3, 2, "ArrowRight", { enabled }), 0);
  assert.equal(rovingIndex(3, 0, "ArrowLeft", { enabled }), 2);
  assert.equal(rovingIndex(3, 0, "Home", { enabled }), 0);
  assert.equal(rovingIndex(3, 0, "End", { enabled }), 2);
});

test("rovingIndex respects orientation and refuses to wrap when told", () => {
  assert.equal(rovingIndex(3, 0, "ArrowDown", { horizontal: false }), 1);
  assert.equal(rovingIndex(3, 0, "ArrowRight", { horizontal: false }), -1);
  assert.equal(rovingIndex(3, 2, "ArrowRight", { wrap: false }), -1);
});

test("rovingIndex returns -1 when nothing can take focus", () => {
  assert.equal(rovingIndex(0, 0, "ArrowRight"), -1);
  assert.equal(rovingIndex(3, 0, "ArrowRight", { enabled: () => false }), -1);
  assert.equal(rovingIndex(3, 0, "q"), -1);
});

test("focusTrapIndex only intercepts the edges", () => {
  assert.equal(focusTrapIndex(4, 3, false), 0);
  assert.equal(focusTrapIndex(4, 0, true), 3);
  assert.equal(focusTrapIndex(4, 1, false), -1);
  assert.equal(focusTrapIndex(4, 2, true), -1);
  assert.equal(focusTrapIndex(0, 0, false), -1);
});

test("resolveDisclosure follows single, multiple and collapsible rules", () => {
  assert.deepEqual(resolveDisclosure([0], 1), [1]);
  assert.deepEqual(resolveDisclosure([0], 0), []);
  assert.deepEqual(resolveDisclosure([0], 0, { collapsible: false }), [0]);
  assert.deepEqual(resolveDisclosure([0], 1, { multiple: true }), [0, 1]);
  assert.deepEqual(resolveDisclosure([0, 1], 0, { multiple: true }), [1]);
});

test("passwordStrength is a shared, deterministic hint", () => {
  assert.equal(passwordStrength(""), "empty");
  assert.equal(passwordStrength("abc"), "weak");
  assert.equal(passwordStrength("abcdefghij"), "medium");
  assert.equal(passwordStrength("Abcdefgh1234!"), "strong");
  // The same input always yields the same label, so React and plain markup agree.
  assert.equal(passwordStrength("hunter22"), passwordStrength("hunter22"));
  // A shorter password is never stronger than a longer one with the same variety.
  assert.notEqual(passwordStrength("Ab1!"), "strong");
});

test("isEmail is one shared shape check", () => {
  assert.equal(isEmail("sara@example.com"), true);
  assert.equal(isEmail("  sara@example.com  "), true);
  assert.equal(isEmail("sara@example"), false);
  assert.equal(isEmail("sara example.com"), false);
  assert.equal(isEmail(""), false);
});

test("streamed text reveals at a steady rate and catches up on a backlog", () => {
  // Nothing new: nothing moves.
  assert.equal(revealLength(40, 40, 16), 40);
  // A small backlog moves at reading speed (80 chars/s → 8 chars in 100 ms).
  assert.equal(revealLength(0, 20, 100), 8);
  // A burst of 2000 chars clears within the catch-up window, never overshooting.
  const afterHalf = revealLength(0, 2000, 600, { catchUpMs: 1200 });
  assert.equal(afterHalf, 1000);
  assert.equal(revealLength(0, 2000, 5000), 2000);
  // Hostile input never produces NaN.
  assert.equal(revealLength(Number.NaN, 10, 100), 8);
});

test("a scroller follows new content only while it is near its end", () => {
  assert.equal(isPinnedToEnd(560, 1000, 400), true);
  assert.equal(isPinnedToEnd(200, 1000, 400), false);
});

test("Enter sends, Shift+Enter breaks a line, and IME composition never sends", () => {
  assert.equal(composerKeyAction({ key: "Enter" }), "submit");
  assert.equal(composerKeyAction({ key: "Enter", shiftKey: true }), "newline");
  assert.equal(composerKeyAction({ key: "Enter", isComposing: true }), null);
  assert.equal(composerKeyAction({ key: "Enter", keyCode: 229 }), null);
  assert.equal(composerKeyAction({ key: "a" }), null);
  assert.equal(composerKeyAction({ key: "Enter" }, { submitOn: "mod-enter" }), null);
  assert.equal(composerKeyAction({ key: "Enter", metaKey: true }, { submitOn: "mod-enter" }), "submit");
});

test("audio levels rise fast, fall slowly, and fold into bars", () => {
  assert.ok(smoothLevel(0, 1) > 0.5);
  assert.ok(smoothLevel(1, 0) > 0.8);
  assert.equal(smoothLevel(0, 5), smoothLevel(0, 1));
  const levels = spectrumToLevels(new Uint8Array(1024).fill(255), 24);
  assert.equal(levels.length, 24);
  assert.ok(levels.every((level) => level >= 0 && level <= 1));
  assert.deepEqual(spectrumToLevels([], 3), [0, 0, 0]);
});

test("durations, token counts, confidence and context read like a person wrote them", () => {
  assert.equal(formatDuration(800), "0.8s");
  assert.equal(formatDuration(12_300), "12s");
  assert.equal(formatDuration(64_000), "1m 04s");
  assert.equal(formatTokens(812), "812");
  assert.equal(formatTokens(1234), "1.2k");
  assert.equal(formatTokens(128_000), "128k");
  assert.equal(formatTokens(1_000_000), "1M");
  assert.equal(confidenceBand(0.3), "low");
  assert.equal(confidenceBand(0.6), "medium");
  assert.equal(confidenceBand(0.95), "high");
  const usage = contextUsage([{ id: "a", label: "A", tokens: 60_000 }, { id: "b", label: "B", tokens: 40_000 }], 128_000);
  assert.equal(usage.used, 100_000);
  assert.equal(usage.level, "warning");
  assert.equal(usage.segments[0].ratio, 60_000 / 128_000);
  assert.equal(contextUsage([{ id: "a", label: "A", tokens: 200 }], 100).level, "critical");
});

test("a tooltip slides back on screen and its arrow keeps pointing at the trigger", () => {
  const viewport = { width: 390, height: 844 };
  const tip = { width: 300, height: 40 };
  // A trigger near the right edge: centered, the tip would run 116px past it.
  const nearEdge = fitTooltip({ x: 330, y: 400, width: 40, height: 32 }, tip, viewport, "top");
  assert.equal(nearEdge.side, "top");
  assert.ok(350 - tip.width / 2 + nearEdge.shift + tip.width <= viewport.width - 8, "it ends inside the window");
  assert.ok(nearEdge.shift < 0, "it slides toward the middle");
  // Centered with room to spare, it does not move.
  assert.deepEqual(fitTooltip({ x: 175, y: 400, width: 40, height: 32 }, { width: 120, height: 40 }, viewport, "top"), { side: "top", shift: 0 });
  // No room above: it opens below.
  assert.equal(fitTooltip({ x: 175, y: 4, width: 40, height: 32 }, tip, viewport, "top").side, "bottom");
  // Asked for a side with no room across: it opens above instead.
  assert.equal(fitTooltip({ x: 175, y: 400, width: 40, height: 32 }, tip, viewport, "right").side, "top");
});

test("a tooltip is placed on the page: beside its trigger, with the arrow's slide", () => {
  const viewport = { width: 390, height: 844 };
  const trigger = { x: 175, y: 400, width: 40, height: 32 };
  // Above the trigger, centered, 8px off it.
  assert.deepEqual(placeTooltip(trigger, { width: 120, height: 40 }, viewport, { side: "top" }), { x: 135, y: 352, side: "top", shift: 0 });
  // Near the right edge it slides left, and says how far, for the arrow to slide back.
  const near = placeTooltip({ x: 330, y: 400, width: 40, height: 32 }, { width: 300, height: 40 }, viewport);
  assert.equal(near.x + 300, viewport.width - 8);
  assert.equal(near.shift, near.x - (350 - 150));
  // fitTooltip, kept for 1.x, is the same decision without the position.
  assert.deepEqual(fitTooltip(trigger, { width: 120, height: 40 }, viewport, "top"), { side: "top", shift: 0 });
});

test("a menu slides back on screen and opens above when there is no room below", () => {
  const viewport = { width: 390, height: 844 };
  const menu = { width: 224, height: 260 };
  // Aligned to the end of a trigger near the left edge: CSS puts it 115px off screen.
  const left = fitMenu({ x: 16, y: 300, width: 101, height: 36 }, menu, viewport, "end");
  assert.equal(left.side, "bottom");
  assert.equal(16 + 101 - menu.width + left.shift, 8, "it starts at the window's padding");
  // Aligned to the start of a trigger near the right edge: it slides left.
  const right = fitMenu({ x: 300, y: 300, width: 80, height: 36 }, menu, viewport, "start");
  assert.equal(300 + right.shift + menu.width, viewport.width - 8, "it ends at the window's padding");
  // With room on both sides it stays where CSS put it.
  assert.deepEqual(fitMenu({ x: 100, y: 300, width: 80, height: 36 }, menu, viewport, "start"), { side: "bottom", shift: 0 });
  // Near the bottom of the window it opens above.
  assert.equal(fitMenu({ x: 100, y: 780, width: 80, height: 36 }, menu, viewport, "start").side, "top");
});

test("a dial's positions run 270 degrees round the top, leaving the gap at the bottom", () => {
  assert.equal(DIAL_SWEEP, 270);
  assert.equal(dialAngle(0), -135);
  assert.equal(dialAngle(0.5), 0);
  assert.equal(dialAngle(1), 135);
  assert.equal(dialAngle(2), 135, "clamped");
  assert.equal(dialAngle(Number.NaN), -135);
  // A press at the top, to the right and to the left points where it is.
  assert.equal(dialPositionAt(0, -10), 0.5);
  assert.ok(Math.abs(dialPositionAt(10, 0) - 5 / 6) < 1e-9);
  assert.ok(Math.abs(dialPositionAt(-10, 0) - 1 / 6) < 1e-9);
  // In the gap no end is meant, and on the knob a press turns it rather than jumping.
  assert.equal(dialPositionAt(0, 10), null);
  assert.equal(dialPositionAt(1, -1, 5), null);
  assert.equal(dialPositionAt(Number.NaN, 0), null);
});

test("a dial turns by the angle the pointer turns, and stops at its ends", () => {
  const top = { dx: 0, dy: -10 };
  const right = { dx: 10, dy: 0 };
  const left = { dx: -10, dy: 0 };
  assert.ok(Math.abs(dialTurn(0.5, top, right) - (0.5 + 90 / 270)) < 1e-9, "a quarter turn clockwise");
  assert.ok(Math.abs(dialTurn(0.5, top, left) - (0.5 - 90 / 270)) < 1e-9, "a quarter turn back");
  // Turning on past the top end across the gap holds it there; it does not leap to the bottom.
  assert.equal(dialTurn(0.95, { dx: 10, dy: 5 }, { dx: -10, dy: 5 }), 1);
  assert.equal(dialTurn(0.05, { dx: -10, dy: 5 }, { dx: 10, dy: 5 }), 0);
  // The short way round is the turn meant, even across the top.
  assert.ok(dialTurn(0.5, { dx: -1, dy: -10 }, { dx: 1, dy: -10 }) > 0.5);
  // A pointer on the center turns nothing.
  assert.equal(dialTurn(0.4, top, { dx: 0, dy: 0 }), 0.4);
});

test("a dial's arc is drawn on its circle, the long way when it passes half a turn", () => {
  const { center, radius } = dialTrack;
  assert.equal(dialArc(0.3, 0.3), "");
  const half = dialArc(0, 0.5);
  assert.match(half, /^M [\d.]+ [\d.]+ A 42 42 0 0 1 50\.000 8\.000$/);
  assert.equal(center - radius, 8);
  assert.match(dialArc(0, 1), / A 42 42 0 1 1 /, "270 degrees takes the large arc");
  assert.equal(dialArc(0.8, 0.2), dialArc(0.2, 0.8), "either order");
});

test("a dial's readout shrinks only when it would reach the notch on the knob's rim", () => {
  // A 200px dial has a 136px knob, and the readout keeps to the middle 72% of it.
  const room = 200 * dialFace.knob * dialFace.readout;
  assert.ok(Math.abs(room - 97.92) < 1e-9);
  assert.equal(dialFit(60, 200), 1, "a short value is left as it is");
  assert.equal(dialFit(room, 200), 1);
  assert.equal(dialFit(room * 2, 200), 0.5, "twice the room is shown at half the size");
  assert.ok(dialFit(110, 200) * 110 <= room + 0.1);
  assert.equal(dialFit(0, 200), 1, "nothing measured yet");
  assert.equal(dialFit(80, 0), 1);
});
