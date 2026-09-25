"use client";

import * as React from "react";
import { Magnetic } from "@mlola-ui/motion";
import { cx } from "../_internal/react";

export type ButtonVariant = "primary" | "secondary" | "subtle" | "danger" | "outline" | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  magnetic?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, magnetic = false, disabled, children, type = "button", ...props }, ref) => {
    const isDisabled = disabled || loading;
    const button = (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        data-variant={variant}
        data-size={size}
        data-loading={loading ? "" : undefined}
        className={cx("ml-button", className)}
        {...props}
      >
        {loading ? <span aria-hidden="true" className="ml-button-spinner" /> : null}
        <span className="ml-button-label">{children}</span>
      </button>
    );
    return magnetic && !isDisabled ? <Magnetic pull={0.2}>{button}</Magnetic> : button;
  }
);
Button.displayName = "Button";

export { Button };
