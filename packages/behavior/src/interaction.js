/**
 * The interaction decisions: where a value snaps, which index a key moves
 * to, where focus goes next, where a floating layer sits. The framework-free
 * runtime imports only these, so a plain page downloads nothing else;
 * everything is also exported from ./logic.js, the public entry.
 */

/** Round to the precision the step implies, so 0.1 steps do not drift. */
function toStepPrecision(value, step) {
  const decimals = (String(step).split(".")[1] ?? "").length;
  return Number(value.toFixed(Math.min(decimals, 10)));
}

/** Clamp into range and snap onto the step grid measured from `min`. */
export function clampToStep(raw, { min = 0, max = 100, step = 1 } = {}) {
  const low = Number.isFinite(min) ? min : 0;
  const high = Number.isFinite(max) && max > low ? max : low + 100;
  const increment = Number.isFinite(step) && step > 0 ? step : 1;
  const value = Number.isFinite(raw) ? raw : low;
  const clamped = Math.min(high, Math.max(low, value));
  const snapped = low + Math.round((clamped - low) / increment) * increment;
  return toStepPrecision(Math.min(high, Math.max(low, snapped)), increment);
}

/** Turn a 0..1 position along a track into a value in range. */
export function valueFromRatio(ratio, { min = 0, max = 100, step = 1 } = {}) {
  const low = Number.isFinite(min) ? min : 0;
  const high = Number.isFinite(max) && max > low ? max : low + 100;
  const safe = Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0;
  return clampToStep(low + safe * (high - low), { min: low, max: high, step });
}

/** Percentage along the track, for positioning a range fill and a thumb. */
export function percentOf(value, { min = 0, max = 100 } = {}) {
  const low = Number.isFinite(min) ? min : 0;
  const high = Number.isFinite(max) && max > low ? max : low + 100;
  if (high === low) return 0;
  return ((Math.min(high, Math.max(low, value)) - low) / (high - low)) * 100;
}

/**
 * The value a key produces, or undefined when the key means nothing here.
 * Returning undefined rather than the current value lets a caller know whether
 * to call preventDefault.
 */
export function sliderValueForKey(key, current, { min = 0, max = 100, step = 1 } = {}) {
  const low = Number.isFinite(min) ? min : 0;
  const high = Number.isFinite(max) && max > low ? max : low + 100;
  const increment = Number.isFinite(step) && step > 0 ? step : 1;
  const page = Math.max(increment, (high - low) / 10);
  const moves = {
    ArrowLeft: -increment,
    ArrowDown: -increment,
    ArrowRight: increment,
    ArrowUp: increment,
    PageDown: -page,
    PageUp: page,
  };
  if (key === "Home") return clampToStep(low, { min: low, max: high, step: increment });
  if (key === "End") return clampToStep(high, { min: low, max: high, step: increment });
  const delta = moves[key];
  if (delta === undefined) return undefined;
  return clampToStep(current + delta, { min: low, max: high, step: increment });
}

/**
 * Where a roving-focus key lands. `enabled` reports whether an index may take
 * focus, so disabled entries are stepped over rather than landed on.
 * Returns -1 when the key does not move focus.
 */
export function rovingIndex(
  count,
  index,
  key,
  { horizontal = true, wrap = true, enabled = () => true } = {},
) {
  if (count <= 0) return -1;
  const firstEnabled = (from, direction) => {
    let candidate = from;
    for (let steps = 0; steps < count; steps += 1) {
      if (enabled(candidate)) return candidate;
      candidate += direction;
      if (candidate < 0) candidate = count - 1;
      if (candidate >= count) candidate = 0;
    }
    return -1;
  };

  if (key === "Home") return firstEnabled(0, 1);
  if (key === "End") return firstEnabled(count - 1, -1);

  const forward = horizontal ? "ArrowRight" : "ArrowDown";
  const backward = horizontal ? "ArrowLeft" : "ArrowUp";
  const step = key === forward ? 1 : key === backward ? -1 : 0;
  if (!step) return -1;

  let candidate = index;
  for (let steps = 0; steps < count; steps += 1) {
    candidate += step;
    if (candidate < 0) {
      if (!wrap) return -1;
      candidate = count - 1;
    }
    if (candidate >= count) {
      if (!wrap) return -1;
      candidate = 0;
    }
    if (enabled(candidate)) return candidate;
  }
  return -1;
}

/**
 * The index Tab should move to inside a trap, or -1 to let the browser handle
 * it. Only the edges need intercepting; everything between them is natural.
 */
export function focusTrapIndex(count, activeIndex, shiftKey) {
  if (count <= 0) return -1;
  if (shiftKey && activeIndex <= 0) return count - 1;
  if (!shiftKey && activeIndex === count - 1) return 0;
  return -1;
}

/** Which items stay open after toggling `index`. */
export function resolveDisclosure(open, index, { multiple = false, collapsible = true } = {}) {
  const isOpen = open.includes(index);
  if (isOpen && !collapsible && !multiple) return open;
  if (multiple) {
    return isOpen ? open.filter((entry) => entry !== index) : [...open, index].sort((a, b) => a - b);
  }
  if (isOpen) return collapsible ? [] : open;
  return [index];
}

const OPPOSITE_SIDE = { top: "bottom", bottom: "top", left: "right", right: "left" };

/**
 * Where a floating layer goes next to its anchor, as a pure function of
 * rectangles: prefer the requested side, flip when it does not fit, and shift
 * along the edge to stay inside the viewport. The React components and the
 * framework-free runtime place every popover, menu and listbox with it.
 */
export function placeFloating(anchor, floating, viewport, { side = "bottom", align = "center", offset = 8, padding = 8 } = {}) {
  const room = {
    top: anchor.y - padding,
    bottom: viewport.height - (anchor.y + anchor.height) - padding,
    left: anchor.x - padding,
    right: viewport.width - (anchor.x + anchor.width) - padding,
  };
  const needs = (candidate) => (candidate === "top" || candidate === "bottom" ? floating.height : floating.width) + offset;
  let chosen = side;
  if (room[side] < needs(side) && room[OPPOSITE_SIDE[side]] > room[side]) chosen = OPPOSITE_SIDE[side];

  const vertical = chosen === "top" || chosen === "bottom";
  let x;
  let y;
  if (vertical) {
    y = chosen === "bottom" ? anchor.y + anchor.height + offset : anchor.y - floating.height - offset;
    x = align === "start" ? anchor.x : align === "end" ? anchor.x + anchor.width - floating.width : anchor.x + anchor.width / 2 - floating.width / 2;
  } else {
    x = chosen === "right" ? anchor.x + anchor.width + offset : anchor.x - floating.width - offset;
    y = align === "start" ? anchor.y : align === "end" ? anchor.y + anchor.height - floating.height : anchor.y + anchor.height / 2 - floating.height / 2;
  }
  // Shift along the edge to stay on screen.
  x = Math.min(Math.max(x, padding), Math.max(padding, viewport.width - floating.width - padding));
  y = Math.min(Math.max(y, padding), Math.max(padding, viewport.height - floating.height - padding));
  return { x: Math.round(x), y: Math.round(y), side: chosen };
}
