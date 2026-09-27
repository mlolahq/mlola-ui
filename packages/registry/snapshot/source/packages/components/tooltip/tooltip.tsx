"use client";

import * as React from "react";
import { fitTooltip, type Side } from "../_internal/anchor";
import { cx, useLatest } from "../_internal/react";

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
  // Where it actually opens: the asked side, flipped or slid to stay on screen.
  const [fit, setFit] = React.useState<{ side: Side; shift: number }>({ side: placement, shift: 0 });
  const root = React.useRef<HTMLSpanElement>(null);
  const tip = React.useRef<HTMLSpanElement>(null);
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
  const hideRef = useLatest(hide);
  React.useEffect(() => clear, []);
  React.useLayoutEffect(() => {
    const anchor = root.current?.firstElementChild ?? root.current;
    if (!open || !anchor || !tip.current) {
      setFit({ side: placement, shift: 0 });
      return;
    }
    const a = anchor.getBoundingClientRect();
    // Layout size, not the painted box: the pop-in animation starts scaled down.
    const t = { width: tip.current.offsetWidth, height: tip.current.offsetHeight };
    setFit(fitTooltip({ x: a.left, y: a.top, width: a.width, height: a.height }, t, { width: document.documentElement.clientWidth, height: window.innerHeight }, placement));
  }, [open, placement]);
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hideRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, hideRef]);
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
    <span ref={root} className="ml-tooltip-root" onMouseEnter={clear} onMouseLeave={hide}>
      {trigger}
      {open ? (
        <span
          ref={tip}
          id={id}
          role="tooltip"
          data-side={fit.side}
          data-state="open"
          className={cx("ml-tooltip", className)}
          style={{ "--ml-tooltip-shift": `${fit.shift}px` } as React.CSSProperties}
        >
          {content}
          <span aria-hidden="true" className="ml-tooltip-arrow" />
        </span>
      ) : null}
    </span>
  );
}
export { Tooltip };
export type { TooltipProps };
