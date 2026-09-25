import assert from "node:assert/strict";
import test from "node:test";
import {
  derive,
  dimensions,
  profiles,
} from "../packages/engine/src/config.mjs";
import { springEasing, springPoints } from "../packages/engine/src/spring.mjs";
import {
  distanceShape,
  profileDistance,
} from "../packages/engine/src/theme-distance.mjs";

test("canonical theme profiles cover every expression channel", () => {
  assert.equal(dimensions.length, 8);
  assert.deepEqual(Object.keys(profiles), [
    "graphite",
    "atelier",
    "machined",
    "aerogel",
    "nordic",
  ]);

  for (const [name, profile] of Object.entries(profiles)) {
    assert.equal(profile.vector.length, dimensions.length, name);
    for (const value of profile.vector) {
      assert.ok(
        value >= 0 && value <= 1,
        `${name} has a coordinate outside the documented [0, 1] interval`,
      );
    }
    assert.ok(profile.spec, `${name} must be defined as a spec`);
    assert.equal(profile.spec.id, name);
  }
});

test("derived foundations remain finite and physically meaningful", () => {
  for (const [name, profile] of Object.entries(profiles)) {
    const result = derive(profile);
    for (const [token, value] of Object.entries(result)) {
      assert.ok(Number.isFinite(value), `${name}.${token} must be finite`);
    }
    assert.ok(result.spacing > 0);
    assert.ok(result.radius >= 0);
    assert.ok(result.durationFast > 0);
    assert.ok(result.durationFast < result.durationNormal);
    assert.ok(result.durationNormal < result.durationSlow);
    assert.ok(result.iconStroke > 0);
  }
});

test("spring easings are deterministic, valid, and theme-specific", () => {
  const peak = {};
  for (const [name, profile] of Object.entries(profiles)) {
    const derived = derive(profile);
    const points = springPoints({
      omega: derived.springOmega,
      damping: derived.springDamping,
    });

    assert.equal(points[0], 0, `${name} easing must start at 0`);
    assert.equal(points.at(-1), 1, `${name} easing must end at 1`);
    assert.ok(points.length >= 16, `${name} needs enough samples to read as a curve`);
    for (const value of points) assert.ok(Number.isFinite(value), `${name} easing must be finite`);

    // A spring is not a straight line; a flat curve would mean the physics is gone.
    const deviation = Math.max(
      ...points.map((value, index) => Math.abs(value - index / (points.length - 1))),
    );
    assert.ok(deviation > 0.005, `${name} easing is indistinguishable from linear`);
    peak[name] = Math.max(...points);

    const css = springEasing({ omega: derived.springOmega, damping: derived.springDamping });
    assert.match(css, /^linear\(0, .*1\)$/);
    assert.equal(
      css,
      springEasing({ omega: derived.springOmega, damping: derived.springDamping }),
      `${name} easing must be deterministic`,
    );
  }

  // More motion in the vector means less damping, so more overshoot. The order
  // is a property of the model, not a coincidence of four hand-tuned curves.
  assert.ok(peak.aerogel > peak.atelier, "aerogel must overshoot more than atelier");
  assert.ok(peak.atelier > peak.nordic, "atelier must overshoot more than nordic");
  assert.ok(peak.nordic > peak.machined, "nordic must overshoot more than machined");
});

test("canonical themes meet the documented distance criteria", () => {
  const entries = Object.entries(profiles);
  for (let left = 0; left < entries.length; left += 1) {
    for (let right = left + 1; right < entries.length; right += 1) {
      const [leftName, leftProfile] = entries[left];
      const [rightName, rightProfile] = entries[right];
      const result = profileDistance(leftProfile, rightProfile);
      const { channelsAbove, largestShare } = distanceShape(result);
      const label = `${leftName}/${rightName}`;
      assert.ok(
        result.distance >= 0.35,
        `${label} distance ${result.distance.toFixed(3)} is below 0.35`,
      );
      assert.ok(
        channelsAbove >= 6,
        `${label} differs on only ${channelsAbove} of 8 expression channels`,
      );
      assert.ok(
        largestShare <= 0.4,
        `${label} leans on one channel for ${(largestShare * 100).toFixed(0)}% of its distance`,
      );
    }
  }
});

test("canonical profiles have a meaningful pairwise vector distance", () => {
  const entries = Object.entries(profiles);
  for (let left = 0; left < entries.length; left += 1) {
    for (let right = left + 1; right < entries.length; right += 1) {
      const [leftName, leftProfile] = entries[left];
      const [rightName, rightProfile] = entries[right];
      const distance = Math.sqrt(
        leftProfile.vector.reduce(
          (sum, coordinate, index) =>
            sum + (coordinate - rightProfile.vector[index]) ** 2,
          0,
        ),
      );
      assert.ok(
        distance >= 0.35,
        `${leftName} and ${rightName} are too similar (${distance.toFixed(3)})`,
      );
    }
  }
});
