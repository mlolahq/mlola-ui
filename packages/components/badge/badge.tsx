"use client";

import * as React from "react";
import { cx } from "../_internal/react";
import { IconX } from "@mlola-ui/icons";

/** The meaning of the color, from the theme's roles. */
export type BadgeTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger";
/** The form: a tint, a solid fill, or an outline. */
export type BadgeVariant = "soft" | "solid" | "outline";
type BadgeSize = "sm" | "md" | "lg";
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  onRemove?: () => void;
}
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ tone = "neutral", variant = "soft", size = "md", dot = false, onRemove, className, children, ...props }, ref) => (
    <span ref={ref} data-tone={tone} data-variant={variant} data-size={size} className={cx("ml-badge", className)} {...props}>
      {dot ? <span aria-hidden="true" className="ml-badge-dot" /> : null}
      <span className="ml-badge-label">{children}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove${typeof children === "string" ? ` ${children}` : " badge"}`}
          className="ml-badge-remove" data-hit="expand"
        >
          <IconX aria-hidden="true" size="0.75em" />
        </button>
      ) : null}
    </span>
  )
);
Badge.displayName = "Badge";
export { Badge };
export type { BadgeSize };
