"use client";

import * as React from "react";
import { cx } from "../_internal/react";

export type InputVariant = "default" | "filled" | "subtle";
type InputSize = "sm" | "md" | "lg";
export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  hint?: string;
  error?: string;
  variant?: InputVariant;
  size?: InputSize;
  containerClassName?: string;
  /** Decoration inside the field, before the text, such as a search glyph. */
  leading?: React.ReactNode;
  /** A control rendered inside the field, at the end of the input. */
  trailing?: React.ReactNode;
};

export interface FieldProps {
  /** The control's id; the label, hint and error are tied to it. */
  id: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Ids for a control's description: merge, never replace, so a caller's own description never hides the error. */
export function fieldDescription(id: string, { hint, error, describedBy }: { hint?: unknown; error?: unknown; describedBy?: string }) {
  return [describedBy, hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
}

/**
 * The anatomy every form control shares: a label, the control, a hint and an
 * error announced when it appears. Input, Textarea, OTP Input and Dropzone
 * all use it, so labels and errors behave identically everywhere.
 */
export function Field({ id, label, hint, error, required, disabled, className, children }: FieldProps) {
  return (
    <div className={cx("ml-input-field", className)} data-disabled={disabled ? "" : undefined} data-invalid={error ? "" : undefined}>
      {label ? (
        <label htmlFor={id} className="ml-input-label">
          {label}
          {required ? <span aria-hidden="true" className="ml-required-mark">*</span> : null}
        </label>
      ) : null}
      {children}
      {hint ? <p id={`${id}-hint`} className="ml-input-hint">{hint}</p> : null}
      {error ? <p id={`${id}-error`} role="alert" className="ml-input-error">{error}</p> : null}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, variant = "default", size = "md", containerClassName, leading, trailing, className, id, disabled, required, "aria-describedby": describedBy, ...props }, ref) => {
    const generated = React.useId();
    const inputId = id ?? `input-${generated}`;
    const control = React.useRef<HTMLDivElement>(null);
    const hasLeading = Boolean(leading);
    const hasTrailing = Boolean(trailing);
    // Pad the text past whatever sits beside it: an icon, a prefix like "https://", a badge.
    React.useLayoutEffect(() => {
      const element = control.current;
      if (!element || (!hasLeading && !hasTrailing)) return;
      const affixes = Array.from(element.querySelectorAll<HTMLElement>(":scope > .ml-input-leading, :scope > .ml-input-trailing"));
      const measure = () => {
        for (const affix of affixes) element.style.setProperty(affix.classList.contains("ml-input-leading") ? "--ml-input-leading" : "--ml-input-trailing", `${affix.offsetWidth}px`);
      };
      measure();
      const observer = new ResizeObserver(measure);
      affixes.forEach((affix) => observer.observe(affix));
      return () => observer.disconnect();
    }, [hasLeading, hasTrailing]);
    return (
      <Field id={inputId} label={label} hint={hint} error={error} required={required} disabled={disabled} className={containerClassName}>
        <div ref={control} className="ml-input-control" data-leading={leading ? "" : undefined} data-trailing={trailing ? "" : undefined}>
          {leading ? <span aria-hidden="true" className="ml-input-leading">{leading}</span> : null}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={fieldDescription(inputId, { hint, error, describedBy })}
            data-variant={variant}
            data-size={size}
            className={cx("ml-input", className)}
            {...props}
          />
          {trailing ? <span className="ml-input-trailing">{trailing}</span> : null}
        </div>
      </Field>
    );
  }
);
Input.displayName = "Input";
