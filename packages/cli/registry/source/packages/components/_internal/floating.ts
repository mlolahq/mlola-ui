"use client";

import * as React from "react";
import { placeFloating, type Align, type Side } from "./anchor";
import { useIsClient } from "./react";

export type { Align, Side };

/**
 * Keep a fixed-position layer next to its anchor while open: on open, on
 * scroll anywhere, on resize, and whenever either element changes size.
 * Writes styles directly, so following a scroll never re-renders React.
 */
export function useFloating(
  anchor: React.RefObject<Element | null>,
  floating: React.RefObject<HTMLElement | null>,
  open: boolean,
  options: { side?: Side; align?: Align; offset?: number },
) {
  const { side, align, offset } = options;
  React.useLayoutEffect(() => {
    const layer = floating.current;
    if (!open || !layer) return;
    let frame = 0;
    // A layer on <body> takes the theme of the place it opened from, which may be a themed canvas rather than the page.
    const themed = anchor.current?.closest<HTMLElement>("[data-theme]");
    const moded = anchor.current?.closest<HTMLElement>("[data-mode]");
    if (themed?.dataset.theme) layer.setAttribute("data-theme", themed.dataset.theme);
    if (moded?.dataset.mode) layer.setAttribute("data-mode", moded.dataset.mode);
    const update = () => {
      const target = anchor.current;
      if (!target || !layer.isConnected) return;
      const rect = target.getBoundingClientRect();
      const place = placeFloating(
        { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        { width: layer.offsetWidth, height: layer.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight },
        { side, align, offset },
      );
      layer.style.setProperty("left", `${place.x}px`);
      layer.style.setProperty("top", `${place.y}px`);
      layer.setAttribute("data-side", place.side);
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
    if (anchor.current) observer?.observe(anchor.current);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [anchor, floating, open, side, align, offset]);
}

/**
 * Where a layer renders to escape overflow and stacking: <body>, from the
 * first client render (null on the server and while hydrating). The layer's
 * root carries `data-ml-portal`, so a dialog lets focus into it.
 */
export function usePortalNode(): HTMLElement | null {
  return useIsClient() ? document.body : null;
}
