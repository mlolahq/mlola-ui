"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useFloating, usePortalNode, type Align, type Side } from "../_internal/floating";
import { composeRefs, cx, useControllableState } from "../_internal/react";

export interface PopoverProps {
  /** The element that opens the popover; it receives the ARIA wiring. */
  trigger: React.ReactElement<Record<string, unknown>>;
  children: React.ReactNode;
  /** The layer's accessible name. */
  label: string;
  side?: Side;
  align?: Align;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A non-modal layer anchored to its trigger: filters, share options, a
 * definition. It opens on click, takes focus, and gives it back to the
 * trigger when Escape, an outside click or moving focus away closes it.
 */
export function Popover({ trigger, children, label, side = "bottom", align = "start", open, defaultOpen = false, onOpenChange, className }: PopoverProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange });
  const anchor = React.useRef<HTMLElement>(null);
  const layer = React.useRef<HTMLDivElement>(null);
  const portal = usePortalNode();
  const id = React.useId();
  useFloating(anchor, layer, isOpen && Boolean(portal), { side, align });

  const close = React.useCallback(
    (restoreFocus: boolean) => {
      setOpen(false);
      if (restoreFocus) requestAnimationFrame(() => anchor.current?.focus());
    },
    [setOpen],
  );

  React.useEffect(() => {
    if (!isOpen || !portal) return;
    const frame = requestAnimationFrame(() => {
      const node = layer.current;
      (node?.querySelector<HTMLElement>(FOCUSABLE) ?? node)?.focus();
    });
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!layer.current?.contains(target) && !anchor.current?.contains(target)) close(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close(true);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, portal, close]);

  const triggerProps = trigger.props as { onClick?: React.MouseEventHandler; ref?: React.Ref<HTMLElement> };
  const anchored = React.cloneElement(trigger, {
    ref: composeRefs(anchor, triggerProps.ref as React.Ref<HTMLElement> | undefined),
    "aria-haspopup": "dialog",
    "aria-expanded": isOpen,
    "aria-controls": isOpen ? id : undefined,
    onClick: (event: React.MouseEvent) => {
      triggerProps.onClick?.(event);
      if (!event.defaultPrevented) setOpen(!isOpen);
    },
  });

  return (
    <>
      {anchored}
      {isOpen && portal
        ? createPortal(
            <div
              ref={layer}
              id={id}
              role="dialog"
              aria-label={label}
              tabIndex={-1}
              data-state="open"
              className={cx("ml-popover", className)}
              onBlur={(event) => {
                const next = event.relatedTarget as Node | null;
                if (next && !layer.current?.contains(next) && !anchor.current?.contains(next)) close(false);
              }}
            >
              {children}
            </div>,
            portal,
          )
        : null}
    </>
  );
}
