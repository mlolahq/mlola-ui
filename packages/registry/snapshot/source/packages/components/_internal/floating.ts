"use client";

import * as React from "react";
import { placeFloating, type Align, type Placement, type Side } from "./anchor";
import { useIsClient } from "./react";

export type { Align, Side };
type Rect = { x: number; y: number; width: number; height: number };
type Size = { width: number; height: number };

/**
 * A place that is not an element (a caret, a text selection): its box, read
 * on every placement, and the element it lives in, for the theme and for
 * watching its size.
 */
export interface VirtualAnchor {
  getBoundingClientRect(): DOMRect;
  contextElement: Element;
}

/**
 * Keep a fixed-position layer next to its anchor while open. It is placed
 * as it opens, then watched every frame: when the anchor moves, either one
 * changes size, or the visible area changes, it is placed again. Events do
 * not cover every move: a phone scrolls a field into view above its
 * keyboard, and a sidebar slides, without a scroll or resize event, which
 * left a list behind where its field had been. A frame with nothing changed
 * reads and writes nothing more, and following never re-renders React.
 * `place` swaps the placement (a tooltip's, with its arrow's `shift`); pass
 * one defined outside the component, so it is the same on every render.
 * `at` places the layer again at once when a virtual anchor moves (the
 * frame after would find it too).
 */
export function useFloating(
  anchor: React.RefObject<Element | VirtualAnchor | null>,
  floating: React.RefObject<HTMLElement | null>,
  open: boolean,
  options: { side?: Side; align?: Align; offset?: number; at?: string },
  place: (anchor: Rect, floating: Size, viewport: Size, options: { side?: Side; align?: Align; offset?: number }) => Placement & { shift?: number } = placeFloating,
) {
  const { side, align, offset, at: moved } = options;
  React.useLayoutEffect(() => {
    const layer = floating.current;
    if (!open || !layer) return;
    let frame = 0;
    const context = anchor.current && "contextElement" in anchor.current ? anchor.current.contextElement : anchor.current;
    const stopTheme = followTheme(context, layer);
    const update = () => {
      const target = anchor.current;
      if (!target || !layer.isConnected) return;
      const rect = target.getBoundingClientRect();
      // Placed within what can be seen: on a phone with the keyboard up, the part of the window above it.
      const view = visibleArea();
      const at = place(
        { x: rect.left - view.x, y: rect.top - view.y, width: rect.width, height: rect.height },
        { width: layer.offsetWidth, height: layer.offsetHeight },
        { width: view.width, height: view.height },
        { side, align, offset },
      );
      layer.style.setProperty("left", `${at.x + view.x}px`);
      layer.style.setProperty("top", `${at.y + view.y}px`);
      layer.style.setProperty("--ml-floating-room", `${roomBeside(rect, view, at.side, offset ?? 8)}px`);
      // What it opened from has scrolled out of sight: a layer held at the edge would point at nothing.
      // One that holds focus stays, so focus is never lost to a scroll.
      const gone = rect.bottom < view.y || rect.top > view.y + view.height || rect.right < view.x || rect.left > view.x + view.width;
      layer.style.setProperty("visibility", gone && !layer.contains(document.activeElement) ? "hidden" : "");
      if (at.shift !== undefined) layer.style.setProperty("--ml-floating-shift", `${at.shift}px`);
      layer.setAttribute("data-side", at.side);
    };
    // What decides the placement: the anchor's box, the layer's size, the visible area, and whether it holds focus.
    let last = "";
    const watch = () => {
      const target = anchor.current;
      if (target && layer.isConnected) {
        const rect = target.getBoundingClientRect();
        const view = visibleArea();
        const now = [rect.left, rect.top, rect.width, rect.height, layer.offsetWidth, layer.offsetHeight, view.x, view.y, view.width, view.height, layer.contains(document.activeElement)].join();
        if (now !== last) {
          last = now;
          update();
        }
      }
      frame = requestAnimationFrame(watch);
    };
    update();
    // Where there are no frames (some test environments), the first placement stands.
    if (typeof requestAnimationFrame === "function") frame = requestAnimationFrame(watch);
    return () => {
      stopTheme();
      if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
    };
  }, [anchor, floating, open, side, align, offset, place, moved]);
}

/**
 * The part of the window that can be seen, in the window's own coordinates
 * (those of getBoundingClientRect and of a fixed layer). On a phone with the
 * keyboard up it is the part above the keyboard, which the window's own
 * size does not know about.
 */
export function visibleArea() {
  const view = window.visualViewport;
  return view
    ? { x: view.offsetLeft, y: view.offsetTop, width: view.width, height: view.height }
    : { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
}

/**
 * How tall a layer can be on the side it opened, within what can be seen:
 * `--ml-floating-room`, which a list that scrolls takes as its most, so it
 * fits beside what it opened from instead of being pushed over it (as when
 * a phone's keyboard comes up under an open list).
 */
function roomBeside(anchor: DOMRect, view: { y: number; height: number }, side: Side, offset: number) {
  const edge = 8;
  const room =
    side === "top" ? anchor.top - view.y - offset - edge : side === "bottom" ? view.y + view.height - anchor.bottom - offset - edge : view.height - 2 * edge;
  return Math.max(0, Math.floor(room));
}

/**
 * A placement for `useFloating` that keeps the layer at the foot of what
 * can be seen, centered: above the keyboard on a phone, where a bar for the
 * text being edited stays clear of the text and of the phone's own menu.
 */
export function dockToBottom(_anchor: Rect, floating: Size, view: Size): Placement {
  return { x: Math.max(8, Math.round((view.width - floating.width) / 2)), y: Math.round(view.height - floating.height - 8), side: "bottom" };
}

/**
 * A layer on <body> takes the theme and mode of the place it belongs to,
 * which may be a themed canvas or card rather than the page, and keeps them
 * when that place's theme or mode changes while the layer is shown.
 */
function followTheme(source: Element | null | undefined, layer: HTMLElement) {
  const themed = source?.closest<HTMLElement>("[data-theme]");
  const moded = source?.closest<HTMLElement>("[data-mode]");
  const copy = () => {
    if (themed?.dataset.theme) layer.setAttribute("data-theme", themed.dataset.theme);
    if (moded?.dataset.mode) layer.setAttribute("data-mode", moded.dataset.mode);
  };
  copy();
  if (typeof MutationObserver === "undefined") return () => {};
  const observer = new MutationObserver(copy);
  for (const element of new Set([themed, moded])) if (element) observer.observe(element, { attributes: true, attributeFilter: ["data-theme", "data-mode"] });
  return () => observer.disconnect();
}

/** The theme and mode of `source`'s place, on a layer rendered on <body>, while `active`. */
export function useLayerTheme(source: React.RefObject<Element | null>, layer: React.RefObject<HTMLElement | null>, active: boolean) {
  React.useLayoutEffect(() => {
    if (!active || !layer.current) return;
    return followTheme(source.current, layer.current);
  }, [source, layer, active]);
}

/**
 * Where a layer renders to escape overflow and stacking: <body>, from the
 * first client render (null on the server and while hydrating). The layer's
 * root carries `data-ml-portal`, so a dialog lets focus into it.
 */
export function usePortalNode(): HTMLElement | null {
  return useIsClient() ? document.body : null;
}
