"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cx } from "../_internal/react";
import { useFloating, usePortalNode, type Align, type Side } from "../_internal/floating";

export interface HoverCardProps {
  /** The link or name that shows the card; it keeps its own behaviour. */
  children: React.ReactElement<Record<string, unknown>>;
  /** The preview: a profile, a page summary, a repository. */
  content: React.ReactNode;
  side?: Side;
  align?: Align;
  /** Milliseconds the pointer must rest before the card opens. */
  openDelay?: number;
  /** Milliseconds of grace after the pointer leaves, so it can reach the card. */
  closeDelay?: number;
  className?: string;
}

/**
 * A preview that appears when the pointer rests on a link or a name, or when
 * it takes keyboard focus: who someone is, what a page holds. The pointer can
 * move into the card and use what is inside; Escape closes it. It adds to the
 * trigger and never replaces what the trigger does.
 */
export function HoverCard({ children, content, side = "bottom", align = "start", openDelay = 450, closeDelay = 180, className }: HoverCardProps) {
  const [open, setOpen] = React.useState(false);
  const anchor = React.useRef<HTMLElement>(null);
  const layer = React.useRef<HTMLDivElement>(null);
  const timer = React.useRef<number | undefined>(undefined);
  const portal = usePortalNode();
  const id = React.useId();
  useFloating(anchor, layer, open && Boolean(portal), { side, align, offset: 8 });

  const schedule = (next: boolean) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), next ? openDelay : closeDelay);
  };
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const child = children.props as Record<string, unknown> & { ref?: React.Ref<HTMLElement> };
  const call = (name: string, event: unknown) => (child[name] as ((value: unknown) => void) | undefined)?.(event);
  const trigger = React.cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      anchor.current = node;
      const own = child.ref;
      if (typeof own === "function") own(node);
      else if (own && typeof own === "object") (own as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    "aria-describedby": open ? id : child["aria-describedby"],
    onPointerEnter: (event: React.PointerEvent) => {
      call("onPointerEnter", event);
      if (event.pointerType === "mouse") schedule(true);
    },
    onPointerLeave: (event: React.PointerEvent) => {
      call("onPointerLeave", event);
      schedule(false);
    },
    onFocus: (event: React.FocusEvent) => {
      call("onFocus", event);
      schedule(true);
    },
    onBlur: (event: React.FocusEvent) => {
      call("onBlur", event);
      if (!layer.current?.contains(event.relatedTarget as Node)) schedule(false);
    },
  });

  return (
    <>
      {trigger}
      {open && portal
        ? createPortal(
            <div
              ref={layer}
              id={id}
              role="tooltip"
              className={cx("ml-hover-card", className)}
              onPointerEnter={() => window.clearTimeout(timer.current)}
              onPointerLeave={() => schedule(false)}
              onBlur={(event) => {
                if (!layer.current?.contains(event.relatedTarget as Node) && event.relatedTarget !== anchor.current) schedule(false);
              }}
            >
              {content}
            </div>,
            portal,
          )
        : null}
    </>
  );
}
