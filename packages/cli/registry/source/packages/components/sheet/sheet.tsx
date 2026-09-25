"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useDialogLayer } from "../_internal/dialog";
import { cx } from "../_internal/react";
import { IconX } from "@mlola-ui/icons";

export type SheetSide = "left" | "right" | "top" | "bottom";
export type SheetSize = "sm" | "md" | "lg";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: SheetSide;
  size?: SheetSize;
  title: string;
  description?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  className?: string;
}

function Sheet({
  open,
  onClose,
  side = "right",
  size = "md",
  title,
  description,
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
  className,
}: SheetProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const portal = useDialogLayer({ open, onClose, closeOnEscape, panelRef });
  const descriptionId = React.useId();
  if (!portal || !open) return null;
  return createPortal(
    <div className="ml-sheet-layer" data-state="open">
      <div
        aria-hidden="true"
        className="ml-sheet-overlay"
        onMouseDown={() => closeOnBackdrop && onClose()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        data-side={side}
        data-size={size}
        data-state="open"
        className={cx("ml-sheet-panel", className)}
      >
        {description ? <p id={descriptionId} className="ml-visually-hidden">{description}</p> : null}
        {children}
      </div>
    </div>,
    portal
  );
}

interface SheetHeaderProps {
  title: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

function SheetHeader({ title, description, onClose, className }: SheetHeaderProps) {
  return (
    <div className={cx("ml-sheet-header", className)}>
      <div className="ml-sheet-heading">
        <h2 className="ml-sheet-title">{title}</h2>
        {description ? <p className="ml-sheet-description">{description}</p> : null}
      </div>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Close panel" className="ml-sheet-close">
          <IconX aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

interface SheetBodyProps {
  children: React.ReactNode;
  className?: string;
}

function SheetBody({ children, className }: SheetBodyProps) {
  return <div className={cx("ml-sheet-body", className)}>{children}</div>;
}

interface SheetFooterProps {
  children: React.ReactNode;
  className?: string;
}

function SheetFooter({ children, className }: SheetFooterProps) {
  return <div className={cx("ml-sheet-footer", className)}>{children}</div>;
}
export { Sheet, SheetHeader, SheetBody, SheetFooter };
export type { SheetProps, SheetHeaderProps, SheetBodyProps, SheetFooterProps };
