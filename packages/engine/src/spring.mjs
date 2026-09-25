/**
 * CSS `linear()` easing sampled from a damped oscillator.
 *
 * The engine publishes a spring profile per theme (natural frequency and
 * damping ratio). Sampling that profile into a `linear()` function is what lets
 * a static transition carry real kinetic character without any JavaScript
 * animation runtime: the browser plays the curve the physics defines.
 *
 * The model is the unit step response of
 *
 *   x'' + 2 ζω x' + ω² x = ω² u(t)
 *
 * which is
 *
 *   y(t) = 1 − e^(−ζωt) · ( cos(ω_d t) + (ζω / ω_d) · sin(ω_d t) ),
 *   ω_d = ω · √(1 − ζ²)
 *
 * sampled over the 2% settling window `t_s ≈ 4 / (ζω)` and pinned to land on
 * exactly 0 and 1. Underdamped profiles (ζ < 1) therefore overshoot, which is
 * what "springy" means, and the overshoot is bounded by `exp(−ζπ / √(1−ζ²))`.
 */

const SETTLING_BAND = 4;

/** A finite, deterministic list of easing stops for the profile. */
export function springPoints({ omega, damping }, samples = 24) {
  const zeta = Math.min(0.98, Math.max(0.05, damping));
  const frequency = Math.max(0.1, omega);
  const damped = frequency * Math.sqrt(1 - zeta * zeta);
  const duration = SETTLING_BAND / (zeta * frequency);
  const points = [0];
  for (let index = 1; index <= samples; index += 1) {
    const time = (index / samples) * duration;
    const envelope = Math.exp(-zeta * frequency * time);
    const value =
      1 - envelope * (Math.cos(damped * time) + ((zeta * frequency) / damped) * Math.sin(damped * time));
    points.push(Number(value.toFixed(4)));
  }
  points[points.length - 1] = 1;
  return points;
}

/** The same samples as a CSS `linear()` easing function. */
export function springEasing(profile, samples = 24) {
  return `linear(${springPoints(profile, samples).join(", ")})`;
}
