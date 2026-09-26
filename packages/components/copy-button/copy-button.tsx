"use client";

import * as React from "react";
import { IconCheck, IconCopy } from "@mlola-ui/icons";
import { Button, type ButtonProps } from "../button/button";
import { useCopy } from "../_internal/clipboard";
import { cx } from "../_internal/react";

export interface CopyButtonProps extends Omit<ButtonProps, "value" | "onClick" | "loading"> {
  /** The text to copy, or a function that returns it at the moment of copying. */
  value: string | (() => string);
  /** The action, spoken on an icon-only button and shown as its tooltip: "Copy link". */
  label?: string;
  /** Announced, and shown on a text button, once the copy succeeds. */
  copiedLabel?: string;
  /** Announced when the browser refuses (no permission, an insecure page). */
  errorLabel?: string;
  /** After each attempt: true when the text reached the clipboard. */
  onCopied?: (copied: boolean) => void;
}

/**
 * Copies a value and confirms it: the icon turns to a check for a moment and
 * a screen reader hears "Copied". Without children it is an icon button;
 * with children it keeps its text and shows the confirmation in place.
 */
const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  ({ value, label = "Copy", copiedLabel = "Copied", errorLabel = "Could not copy; select the text and copy it by hand", onCopied, variant = "secondary", size, className, children, ...props }, ref) => {
    const { state, copy } = useCopy();
    const iconOnly = children === undefined || children === null;
    const icon = state === "success" ? <IconCheck aria-hidden="true" size="1em" animate /> : <IconCopy aria-hidden="true" size="1em" />;
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size ?? (iconOnly ? "icon" : "md")}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
        className={cx("ml-copy-button", className)}
        data-status={state === "idle" ? undefined : state}
        onClick={async () => {
          const copied = await copy(typeof value === "function" ? value() : value);
          onCopied?.(copied);
        }}
        {...props}
      >
        {icon}
        {iconOnly ? null : state === "success" ? copiedLabel : children}
        {/* The outcome is spoken where a changing label would not be. */}
        <span className="ml-visually-hidden" role="status">
          {state === "success" ? copiedLabel : state === "error" ? errorLabel : ""}
        </span>
      </Button>
    );
  }
);
CopyButton.displayName = "CopyButton";

export { CopyButton };
