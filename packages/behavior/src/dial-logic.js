/**
 * The dial's geometry, with no DOM and no framework: where a value sits on
 * its 270 degree sweep, the value a press points to, how a turn moves it,
 * and the paths it is drawn with. React's Dial and the framework-free dial
 * both read it, so the two turn and draw alike.
 */

/**
 * A dial turns through 270 degrees, from 135 left of the top round to 135
 * right of it, and leaves the gap at the bottom. Angles here are degrees
 * clockwise from the top; a position is the 0..1 share of that turn.
 */
export const DIAL_SWEEP = 270;
const DIAL_START = -DIAL_SWEEP / 2;

/** The dial's circle in its 100 by 100 drawing: where the arc runs. */
export const dialTrack = Object.freeze({ center: 50, radius: 42 });

/**
 * The dial's face, as shares of its width: the knob fills the circle inside
 * the arc, and the readout keeps to the middle of the knob, clear of the
 * notch on its rim (the stylesheet draws the notch in the outer 12%).
 */
export const dialFace = Object.freeze({ knob: 0.68, readout: 0.72 });

/**
 * How much to scale the readout so it stays clear of the notch: 1 while it
 * fits in the middle of the knob, less for a long value or a wide typeface.
 */
export function dialFit(textWidth, dialWidth) {
  const room = dialWidth * dialFace.knob * dialFace.readout;
  if (!(textWidth > 0) || !(room > 0) || textWidth <= room) return 1;
  return Math.round((room / textWidth) * 1000) / 1000;
}

const unit = (value) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

/** Where a 0..1 position sits on a dial, in degrees clockwise from the top. */
export function dialAngle(position) {
  return DIAL_START + unit(position) * DIAL_SWEEP;
}

const angleOf = (dx, dy) => (Math.atan2(dx, -dy) * 180) / Math.PI;

/**
 * The position a press at `dx`, `dy` from the center points to, or null when
 * it points to none: inside `inner` (the knob, which turns rather than jumps),
 * or in the gap at the bottom, where neither end is meant.
 */
export function dialPositionAt(dx, dy, inner = 0) {
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || Math.hypot(dx, dy) <= inner) return null;
  const position = (angleOf(dx, dy) - DIAL_START) / DIAL_SWEEP;
  return position >= 0 && position <= 1 ? position : null;
}

/**
 * The position after the pointer turns from one point to another round the
 * center. It moves by the angle turned, so a turn past an end stops there
 * instead of leaping across the gap to the other end; the caller keeps the
 * unrounded position between moves and snaps only the value it shows.
 */
export function dialTurn(position, from, to) {
  const before = angleOf(from.dx, from.dy);
  const after = angleOf(to.dx, to.dy);
  if (!Number.isFinite(before) || !Number.isFinite(after) || Math.hypot(to.dx, to.dy) === 0) return unit(position);
  let delta = after - before;
  if (delta > 180) delta -= 360;
  if (delta <= -180) delta += 360;
  return unit(unit(position) + delta / DIAL_SWEEP);
}

/**
 * The dial's scale: a tick every ten degrees outside the arc, longer at the
 * ends and the middle. Drawn once; it marks the instrument, not a value.
 */
export function dialTicks({ center = dialTrack.center, from = 47, to = 48.5, long = 50 } = {}) {
  const count = DIAL_SWEEP / 10;
  return Array.from({ length: count + 1 }, (_, index) => {
    const radians = (dialAngle(index / count) * Math.PI) / 180;
    const at = (radius) => `${(center + radius * Math.sin(radians)).toFixed(2)} ${(center - radius * Math.cos(radians)).toFixed(2)}`;
    return `M ${at(from)} L ${at(index % (count / 3) === 0 ? long : to)}`;
  }).join(" ");
}

/** The SVG path of the dial's arc from one position to another, or "" when it has no length. */
export function dialArc(from, to, { center = dialTrack.center, radius = dialTrack.radius } = {}) {
  const start = unit(Math.min(from, to));
  const end = unit(Math.max(from, to));
  if (end - start < 1e-4) return "";
  const point = (position) => {
    const radians = (dialAngle(position) * Math.PI) / 180;
    return `${(center + radius * Math.sin(radians)).toFixed(3)} ${(center - radius * Math.cos(radians)).toFixed(3)}`;
  };
  const large = (end - start) * DIAL_SWEEP > 180 ? 1 : 0;
  return `M ${point(start)} A ${radius} ${radius} 0 ${large} 1 ${point(end)}`;
}
