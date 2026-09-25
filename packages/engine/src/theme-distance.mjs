import { derive } from "./config.mjs";

/**
 * The theme distance the quality contract defines, implemented.
 *
 * Each expression channel is observed through the foundations it actually
 * moves. `delta(k, a, b)` is the mean normalized change across that channel's
 * observables, and the pairwise distance is
 *
 *   D(a, b) = sqrt( Σ weight(k) · delta(k, a, b)² )
 *
 * so a profile that only changes one foundation cannot look "far" from another
 * just because the vector moved. The observables and scales are product gates:
 * they are calibrated against the canonical corpus and change only with
 * evidence, exactly as `docs/quality.md` says.
 */

export const CHANNEL_OBSERVABLES = {
  type: [
    ["displayWeight", 150],
    ["tracking", 0.02],
    ["bodyLeading", 0.16],
  ],
  geometry: [
    ["radius", 16],
    ["border", 0.65],
  ],
  density: [
    ["spacing", 1.5],
  ],
  depth: [
    ["shadowY", 12],
    ["shadowBlur", 30],
    ["shadowAlpha", 0.14],
  ],
  motion: [
    ["durationNormal", 140],
    ["springDamping", 0.5],
  ],
  texture: [
    ["textureOpacity", 0.075],
    ["border", 0.65],
  ],
  rhythm: [
    ["tracking", 0.02],
    ["durationNormal", 140],
    ["spacing", 1.5],
  ],
  icon: [
    ["iconStroke", 0.55],
  ],
};

export const CHANNEL_WEIGHTS = {
  type: 1,
  geometry: 1,
  density: 1,
  depth: 1,
  motion: 1,
  texture: 1,
  rhythm: 1,
  // Optical stroke moves less of the page than type, motion, or depth, so it
  // carries less weight when judging whether two themes are distinct.
  icon: 0.7,
};

const clamp01 = (value) => Math.min(1, Math.max(0, value));

/** Per-channel normalized observable change between two derived foundations. */
export function channelDeltas(left, right, observables = CHANNEL_OBSERVABLES) {
  const deltas = {};
  for (const [channel, entries] of Object.entries(observables)) {
    const values = entries.map(([key, scale]) =>
      clamp01(Math.abs(left[key] - right[key]) / scale),
    );
    deltas[channel] = values.reduce((sum, value) => sum + value, 0) / values.length;
  }
  return deltas;
}

/** `D(a, b)`, optionally with a channel weight map. */
export function themeDistance(left, right, weights = CHANNEL_WEIGHTS) {
  const deltas = channelDeltas(left, right);
  const sum = Object.entries(deltas).reduce(
    (total, [channel, delta]) => total + (weights[channel] ?? 1) * delta ** 2,
    0,
  );
  return { distance: Math.sqrt(sum), deltas };
}

export function profileDistance(leftProfile, rightProfile, options) {
  return themeDistance(derive(leftProfile), derive(rightProfile), options);
}

/**
 * How many channels clear `threshold`, and the largest single channel's share
 * of the squared distance. These are the other two release criteria.
 */
export function distanceShape({ deltas }, threshold = 0.075, weights = CHANNEL_WEIGHTS) {
  const weighted = Object.entries(deltas).map(
    ([channel, value]) => (weights[channel] ?? 1) * value ** 2,
  );
  const total = weighted.reduce((sum, value) => sum + value, 0) || 1;
  const channelsAbove = Object.values(deltas).filter((value) => value >= threshold).length;
  const largestShare = Math.max(...weighted) / total;
  return { channelsAbove, largestShare };
}
