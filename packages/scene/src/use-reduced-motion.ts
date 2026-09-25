"use client";

import * as React from "react";

const query = "(prefers-reduced-motion: reduce)";

export function useReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (listener) => {
      if (typeof window === "undefined") return () => {};
      const media = window.matchMedia(query);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    },
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
    () => false
  );
}
