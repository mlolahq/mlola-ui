import assert from "node:assert/strict";
import test from "node:test";
import { placeFloating } from "../packages/components/_internal/anchor.ts";

const viewport = { width: 1000, height: 800 };
const size = { width: 200, height: 100 };

test("a floating layer sits on the requested side, centered", () => {
  const place = placeFloating({ x: 400, y: 100, width: 100, height: 40 }, size, viewport);
  assert.deepEqual(place, { x: 350, y: 148, side: "bottom" });
});

test("it flips when the requested side has no room", () => {
  const place = placeFloating({ x: 400, y: 740, width: 100, height: 40 }, size, viewport);
  assert.equal(place.side, "top");
  assert.equal(place.y, 740 - 100 - 8);
});

test("it shifts along the edge to stay inside the viewport", () => {
  const place = placeFloating({ x: 960, y: 100, width: 30, height: 30 }, size, viewport);
  assert.equal(place.x, 1000 - 200 - 8);
  const left = placeFloating({ x: 0, y: 100, width: 30, height: 30 }, size, viewport, { align: "end" });
  assert.equal(left.x, 8);
});
