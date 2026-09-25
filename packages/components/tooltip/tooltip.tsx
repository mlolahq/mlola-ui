"use client";

import * as React from "react";
import { cx } from "../_internal/react";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";
interface TooltipProps {
  content: React.ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  children: React.ReactElement<Record<string, unknown>>;
  className?: string;
}

function Tooltip({ content, placement = "top", delay = 200, children, className }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = React.useId();
  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const show = () => {
    clear();
    timer.current = setTimeout(() => setOpen(true), Math.max(0, delay));
  };
  const hide = () => {
    clear();
    setOpen(false);
  };
  React.useEffect(() => clear, []);
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);
  type Handlers = {
    onMouseEnter?: React.MouseEventHandler;
    onMouseLeave?: React.MouseEventHandler;
    onFocus?: React.FocusEventHandler;
    onBlur?: React.FocusEventHandler;
    "aria-describedby"?: string;
  };
  const childProps = children.props as Handlers;
  const trigger = React.cloneElement(children, {
    onMouseEnter: (event: React.MouseEvent) => { childProps.onMouseEnter?.(event); show(); },
    onMouseLeave: (event: React.MouseEvent) => { childProps.onMouseLeave?.(event); hide(); },
    onFocus: (event: React.FocusEvent) => { childProps.onFocus?.(event); show(); },
    onBlur: (event: React.FocusEvent) => { childProps.onBlur?.(event); hide(); },
    "aria-describedby": open
      ? [childProps["aria-describedby"], id].filter(Boolean).join(" ")
      : childProps["aria-describedby"],
  } as Record<string, unknown>);
  return (
    <span className="ml-tooltip-root" onMouseEnter={clear} onMouseLeave={hide}>
      {trigger}
      {open ? (
        <span id={id} role="tooltip" data-side={placement} data-state="open" className={cx("ml-tooltip", className)}>
          {content}
          <span aria-hidden="true" className="ml-tooltip-arrow" />
        </span>
      ) : null}
    </span>
  );
}
export { Tooltip };
export type { TooltipProps };
