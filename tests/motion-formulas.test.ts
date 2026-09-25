import assert from "node:assert/strict";
import test from "node:test";
import {
  calculatePointerKinetics,
  idlePointerKinetics,
} from "../packages/motion/src/pointer-math.ts";
import { integrateSpring } from "../packages/motion/src/spring.ts";

test("pointer kinetics are finite and smoothed", () => {
  const first = calculatePointerKinetics(idlePointerKinetics, {
    x: 10,
    y: 20,
    timestamp: 100,
    pointerType: "mouse",
  });
  const next = calculatePointerKinetics(
    first,
    { x: 20, y: 5, timestamp: 116, pointerType: "mouse" },
    0.25,
  );

  assert.equal(next.deltaX, 10);
  assert.equal(next.deltaY, -15);
  assert.ok(Number.isFinite(next.velocityX));
  assert.ok(Number.isFinite(next.velocityY));
  assert.ok(next.speed > 0);
});

test("spring converges and clamps suspended frames", () => {
  let state = { value: 0, velocity: 0 };
  for (let index = 0; index < 600; index += 1) {
    const next = integrateSpring(state, 1, index === 0 ? 10_000 : 16);
    state = { value: next.value, velocity: next.velocity };
    assert.ok(Number.isFinite(state.value));
    assert.ok(Number.isFinite(state.velocity));
    if (next.done) break;
  }

  assert.ok(Math.abs(state.value - 1) < 0.02);
  assert.ok(Math.abs(state.velocity) < 0.02);
});
