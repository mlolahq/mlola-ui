"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useDialogLayer } from "../_internal/dialog";
import { cx } from "../_internal/react";
import { IconX } from "@mlola-ui/icons";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  /** "alertdialog" for a confirmation that interrupts: it is announced at once, and the backdrop does not dismiss it. */
  role?: "dialog" | "alertdialog";
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  label?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  size = "md",
  role = "dialog",
  closeOnBackdrop = role !== "alertdialog",
  closeOnEscape = true,
  label = "Dialog",
  description,
  className,
  children,
}: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const portal = useDialogLayer({ open, onClose, closeOnEscape, panelRef });
  const descriptionId = React.useId();
  if (!portal || !open) return null;
  return createPortal(
    <div
      className="ml-modal-overlay"
      data-state="open"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-label={label}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        data-size={size}
        data-state="open"
        className={cx("ml-modal", className)}
      >
        {description ? <p id={descriptionId} className="ml-visually-hidden">{description}</p> : null}
        {children}
      </div>
    </div>,
    portal
  );
}

export interface ModalHeaderProps {
  title: string;
  onClose?: () => void;
  className?: string;
}

export function ModalHeader({ title, onClose, className }: ModalHeaderProps) {
  return (
    <div className={cx("ml-modal-header", className)}>
      <h2 className="ml-modal-title">{title}</h2>
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
