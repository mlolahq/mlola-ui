"use client";

import * as React from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * Whether a media query matches now. False wherever there is no
 * `matchMedia` (on the server, and in jsdom and other test environments),
 * so no component crashes where media queries do not exist.
 */
export function matchesMedia(query: string) {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(query).matches;
}

/** A media query as React state, following changes. False on the server and without `matchMedia`. */
export function useMediaQuery(query: string) {
  return React.useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => matchesMedia(query),
    () => false,
  );
}

/** Whether the visitor asked for less motion, read once (inside an effect or a handler). */
export const prefersReducedMotion = () => matchesMedia(REDUCED_MOTION);

/** Whether the visitor asked for less motion, following changes. */
export const usePrefersReducedMotion = () => useMediaQuery(REDUCED_MOTION);
