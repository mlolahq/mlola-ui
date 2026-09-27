"use client";

import * as React from "react";

const query = "(prefers-reduced-motion: reduce)";

// Test environments such as jsdom have a window but no matchMedia.
const supported = () => typeof window !== "undefined" && typeof window.matchMedia === "function";

function subscribe(listener: () => void): () => void {
  if (!supported()) return () => {};
  const media = window.matchMedia(query);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function snapshot(): boolean {
  return supported() && window.matchMedia(query).matches;
}

export function useReducedMotion(): boolean {
  return React.useSyncExternalStore(subscribe, snapshot, () => false);
}
