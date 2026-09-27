"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useDialogLayer } from "../_internal/dialog";
import { cx } from "../_internal/react";
import { IconX } from "@mlola-ui/icons";

export type SheetSide = "left" | "right" | "top" | "bottom";
export type SheetSize = "sm" | "md" | "lg";

interface SheetProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "role" | "children" | "title"> {
  open: boolean;
  onClose: () => void;
  side?: SheetSide;
  size?: SheetSize;
  /** Names the panel when it has no `SheetHeader`; a header's title names it otherwise. */
  title?: string;
  /** Read after the name when the panel opens; not shown. */
  description?: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
}

/** The id a `SheetHeader` gives its title, so the panel is named by what it shows. */
const TitleId = React.createContext<string | undefined>(undefined);

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
  ...props
}: SheetProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const portal = useDialogLayer({ open, onClose, closeOnEscape, panelRef });
  const titleId = React.useId();
  const descriptionId = React.useId();
  if (!portal || !open) return null;
  const named = title ?? props["aria-label"] ?? props["aria-labelledby"];
  return createPortal(
    <div data-ml-portal="" className="ml-sheet-layer" data-state="open">
      <div
        aria-hidden="true"
        className="ml-sheet-overlay"
        onMouseDown={() => closeOnBackdrop && onClose()}
      />
      <div
        aria-labelledby={named ? undefined : titleId}
        aria-describedby={description ? descriptionId : undefined}
        {...props}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? props["aria-label"]}
        tabIndex={-1}
        data-side={side}
        data-size={size}
        data-state="open"
        className={cx("ml-sheet-panel", className)}
      >
        {description ? <p id={descriptionId} className="ml-visually-hidden">{description}</p> : null}
        <TitleId.Provider value={titleId}>{children}</TitleId.Provider>
      </div>
    </div>,
    portal
  );
}

interface SheetHeaderProps {
  /** The panel's visible title, which also names it for assistive technology. */
  title: React.ReactNode;
  description?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

function SheetHeader({ title, description, onClose, className }: SheetHeaderProps) {
  const titleId = React.useContext(TitleId);
  return (
    <div className={cx("ml-sheet-header", className)}>
      <div className="ml-sheet-heading">
        <h2 id={titleId} className="ml-sheet-title">{title}</h2>
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
