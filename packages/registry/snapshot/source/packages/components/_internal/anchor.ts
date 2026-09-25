/**
 * Where a floating layer goes next to its anchor, as a pure function of
 * rectangles: prefer the requested side, flip when it does not fit, and shift
 * along the edge to stay inside the viewport. No DOM, so it is testable.
 */
export type Side = "top" | "bottom" | "left" | "right";
export type Align = "start" | "center" | "end";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Placement {
  x: number;
  y: number;
  side: Side;
}

const OPPOSITE: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

export function placeFloating(
  anchor: Rect,
  floating: { width: number; height: number },
  viewport: { width: number; height: number },
  { side = "bottom", align = "center", offset = 8, padding = 8 }: { side?: Side; align?: Align; offset?: number; padding?: number } = {},
): Placement {
  const room: Record<Side, number> = {
    top: anchor.y - padding,
    bottom: viewport.height - (anchor.y + anchor.height) - padding,
    left: anchor.x - padding,
    right: viewport.width - (anchor.x + anchor.width) - padding,
  };
  const needs = (candidate: Side) => (candidate === "top" || candidate === "bottom" ? floating.height : floating.width) + offset;
  let chosen = side;
  if (room[side] < needs(side) && room[OPPOSITE[side]] > room[side]) chosen = OPPOSITE[side];

  const vertical = chosen === "top" || chosen === "bottom";
  let x: number;
  let y: number;
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
