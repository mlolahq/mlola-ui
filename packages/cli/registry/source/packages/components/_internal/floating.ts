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
 * Keep a fixed-position layer next to its anchor while open: on open, on
 * scroll anywhere, on resize, and whenever either element changes size.
 * Writes styles directly, so following a scroll never re-renders React.
 * `place` swaps the placement (a tooltip's, with its arrow's `shift`); pass
 * one defined outside the component, so it is the same on every render.
 * `at` is for a virtual anchor that moves without either element resizing:
 * a new value places the layer again.
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
      const at = place(
        { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        { width: layer.offsetWidth, height: layer.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight },
        { side, align, offset },
      );
      layer.style.setProperty("left", `${at.x}px`);
      layer.style.setProperty("top", `${at.y}px`);
      if (at.shift !== undefined) layer.style.setProperty("--ml-floating-shift", `${at.shift}px`);
      layer.setAttribute("data-side", at.side);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(layer);
    if (context) observer?.observe(context);
    return () => {
      stopTheme();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [anchor, floating, open, side, align, offset, place, moved]);
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
