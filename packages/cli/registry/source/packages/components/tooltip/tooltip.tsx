"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { placeTooltip } from "../_internal/anchor";
import { useFloating, usePortalNode } from "../_internal/floating";
import { cx, useLatest } from "../_internal/react";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";
interface TooltipProps {
  content: React.ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  children: React.ReactElement<Record<string, unknown>>;
  className?: string;
}

/**
 * A short description of its trigger, shown on hover and focus. It opens on
 * <body>, placed beside the trigger (flipped or slid to stay on screen), so
 * no panel, card or scroll area around the trigger can cover or cut it.
 */
function Tooltip({ content, placement = "top", delay = 200, children, className }: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const root = React.useRef<HTMLSpanElement>(null);
  const anchor = React.useRef<Element | null>(null);
  const tip = React.useRef<HTMLSpanElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const portal = usePortalNode();
  const id = React.useId();
  // The trigger is the wrapper's first child; measured from it, not the wrapper.
  React.useLayoutEffect(() => {
    anchor.current = root.current?.firstElementChild ?? root.current;
  });
  useFloating(anchor, tip, open && Boolean(portal), { side: placement, offset: 8 }, placeTooltip);
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
  React.useEffect(() => {
    if (!open) return;
    // Heard before a dialog around it (capture), and marked as used, so one Escape closes one layer.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      hideRef.current();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
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
      {open && portal
        ? createPortal(
            <span ref={tip} id={id} role="tooltip" data-ml-portal="" data-side={placement} data-state="open" className={cx("ml-tooltip", className)}>
              {content}
              <span aria-hidden="true" className="ml-tooltip-arrow" />
            </span>,
            portal,
          )
        : null}
    </span>
  );
}
export { Tooltip };
export type { TooltipProps };
