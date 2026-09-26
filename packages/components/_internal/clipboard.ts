"use client";

import * as React from "react";

/** The shared request words: at rest, then the outcome of the last copy. */
export type CopyState = "idle" | "success" | "error";

/**
 * Copy text to the clipboard and hold the outcome for a moment, so a control
 * can confirm it. A refusal (no permission, an insecure page) is an outcome
 * too: it is reported, never swallowed, so the person can copy by hand.
 */
export function useCopy(hold = 1600) {
  const [state, setState] = React.useState<CopyState>("idle");
  React.useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), hold);
    return () => window.clearTimeout(timer);
  }, [state, hold]);
  const copy = React.useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setState("success");
      return true;
    } catch {
      setState("error");
      return false;
    }
  }, []);
  return { state, copy };
}
