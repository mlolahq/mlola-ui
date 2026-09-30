"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useDialogLayer } from "../_internal/dialog";
import { cx } from "../_internal/react";
import { IconX } from "@mlola-ui/icons";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "role" | "children"> {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  /** "alertdialog" for a confirmation that interrupts: it is announced at once, and the backdrop does not dismiss it. */
  role?: "dialog" | "alertdialog";
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  /** Names the dialog when it has no `ModalHeader`; a header's title names it otherwise. */
  label?: string;
  /** Read after the name when the dialog opens; not shown. */
  description?: React.ReactNode;
  children: React.ReactNode;
}

/** The id a `ModalHeader` gives its title, so the dialog is named by what it shows. */
const TitleId = React.createContext<string | undefined>(undefined);

export function Modal({
  open,
  onClose,
  size = "md",
  role = "dialog",
  closeOnBackdrop = role !== "alertdialog",
  closeOnEscape = true,
  label,
  description,
  className,
  children,
  ...props
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const portal = useDialogLayer({ open, onClose, closeOnEscape, panelRef });
  const titleId = React.useId();
  const descriptionId = React.useId();
  if (!portal || !open) return null;
  const named = label ?? props["aria-label"] ?? props["aria-labelledby"];
  return createPortal(
    <div
      data-ml-portal=""
      className="ml-modal-overlay"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-labelledby={named ? undefined : titleId}
        aria-describedby={description ? descriptionId : undefined}
        {...props}
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-label={label ?? props["aria-label"]}
        tabIndex={-1}
        data-size={size}
        data-state="open"
        className={cx("ml-modal", className)}
      >
        {description ? <p id={descriptionId} className="ml-visually-hidden">{description}</p> : null}
        <TitleId.Provider value={titleId}>{children}</TitleId.Provider>
      </div>
    </div>,
    portal
  );
}

export interface ModalHeaderProps {
  /** The dialog's visible title, which also names it for assistive technology. */
  title: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function ModalHeader({ title, onClose, className }: ModalHeaderProps) {
  const titleId = React.useContext(TitleId);
  return (
    <div className={cx("ml-modal-header", className)}>
      <h2 id={titleId} className="ml-modal-title">{title}</h2>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Close dialog" className="ml-modal-close">
          <IconX aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export interface ModalBodyProps {
  className?: string;
  children: React.ReactNode;
}

export function ModalBody({ className, children }: ModalBodyProps) {
  return <div className={cx("ml-modal-body", className)}>{children}</div>;
}

export interface ModalFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function ModalFooter({ className, children }: ModalFooterProps) {
  return <div className={cx("ml-modal-footer", className)}>{children}</div>;
}
