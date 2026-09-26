"use client";

import * as React from "react";
import { cx } from "../_internal/react";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  size?: SpinnerSize;
  /**
   * What is loading, spoken to screen readers ("Loading results"). Leave it
   * out when visible text beside the spinner already says so, as in a busy
   * button; the spinner is then decorative.
   */
  label?: string;
}

/**
 * Work in progress whose end is unknown. It takes the color of the text
 * around it, so it reads on any surface and inside any control.
 */
const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(({ size = "md", label, className, ...props }, ref) => (
  <span
    ref={ref}
    role={label ? "status" : undefined}
    aria-hidden={label ? undefined : true}
    data-size={size}
    className={cx("ml-spinner", className)}
    {...props}
  >
    {label ? <span className="ml-visually-hidden">{label}</span> : null}
  </span>
));
Spinner.displayName = "Spinner";

export { Spinner };
