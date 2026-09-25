"use client";

import * as React from "react";
import { cx } from "../_internal/react";

/** A single key, as printed on a keyboard. */
export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <kbd className={cx("ml-kbd", className)} {...props} />;
}

function useIsApple() {
  return React.useSyncExternalStore(
    () => () => undefined,
    () => /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent),
    () => true,
  );
}

const SYMBOLS: Record<string, { apple: string; other: string; spoken: string; spokenOther?: string }> = {
  mod: { apple: "⌘", other: "Ctrl", spoken: "Command", spokenOther: "Control" },
  ctrl: { apple: "⌃", other: "Ctrl", spoken: "Control" },
  alt: { apple: "⌥", other: "Alt", spoken: "Option", spokenOther: "Alt" },
  shift: { apple: "⇧", other: "Shift", spoken: "Shift" },
  enter: { apple: "↵", other: "Enter", spoken: "Enter" },
  esc: { apple: "Esc", other: "Esc", spoken: "Escape" },
  up: { apple: "↑", other: "↑", spoken: "Up arrow" },
  down: { apple: "↓", other: "↓", spoken: "Down arrow" },
  backspace: { apple: "⌫", other: "Backspace", spoken: "Backspace" },
};

export interface ShortcutProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** Keys joined with "+", e.g. "mod+k" or "shift+enter". "mod" is ⌘ on Apple devices and Ctrl elsewhere. */
  keys: string;
}

/**
 * A keyboard shortcut for the visitor's platform: "mod+k" reads ⌘K on a Mac
 * and Ctrl K elsewhere, and is spoken as words, not symbols.
 */
export function Shortcut({ keys, className, ...props }: ShortcutProps) {
  const apple = useIsApple();
  const parts = keys.toLowerCase().split("+").map((key) => key.trim()).filter(Boolean);
  const shown = parts.map((key) => SYMBOLS[key]?.[apple ? "apple" : "other"] ?? key.toUpperCase());
  const spoken = parts.map((key) => (apple ? SYMBOLS[key]?.spoken : SYMBOLS[key]?.spokenOther ?? SYMBOLS[key]?.spoken) ?? key.toUpperCase()).join(" ");
  return (
    <kbd className={cx("ml-shortcut", className)} aria-label={spoken} {...props}>
      {shown.map((key, index) => (
        <kbd key={index} className="ml-kbd" aria-hidden="true">
          {key}
        </kbd>
      ))}
    </kbd>
  );
}
