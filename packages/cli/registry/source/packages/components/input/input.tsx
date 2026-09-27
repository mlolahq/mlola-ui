"use client";

import * as React from "react";
import { cx } from "../_internal/react";

export type InputVariant = "default" | "filled" | "subtle";
type InputSize = "sm" | "md" | "lg";
export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  variant?: InputVariant;
  size?: InputSize;
  containerClassName?: string;
  /** Decoration inside the field, before the text, such as a search glyph. */
  leading?: React.ReactNode;
  /** A control rendered inside the field, at the end of the input. */
  trailing?: React.ReactNode;
};

/**
 * What every form control built from more than a native input accepts, so
 * it works like a native control: an outside `<label htmlFor>` names it,
 * a form submits its value, and a caller can name and describe it.
 */
export interface FormControlProps {
  /** The control's id, for an outside `<label htmlFor>`; the label, hint and error are tied to it. */
  id?: string;
  /** Submits the value with the form, as a native control would. */
  name?: string;
  /** The id of a form elsewhere on the page to submit the value with. */
  form?: string;
  required?: boolean;
  disabled?: boolean;
  /** Names the control when there is no `label`. */
  "aria-label"?: string;
  /** Names the control by other elements, such as a heading above a group. */
  "aria-labelledby"?: string;
  /** More description, read with the hint and the error. */
  "aria-describedby"?: string;
}

export interface FieldProps {
  /** The control's id; the label, hint and error are tied to it. */
  id: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** With `name`, the value the form submits: one entry per value, like a native control. */
  name?: string;
  form?: string;
  value?: string | readonly string[] | null;
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
export function Field({ id, label, hint, error, required, disabled, name, form, value, className, children }: FieldProps) {
  return (
    <div className={cx("ml-input-field", className)} data-disabled={disabled ? "" : undefined} data-invalid={error ? "" : undefined}>
      {label ? (
        <label id={`${id}-label`} htmlFor={id} className="ml-input-label">
          {label}
          {required ? <span aria-hidden="true" className="ml-required-mark">*</span> : null}
        </label>
      ) : null}
      {children}
      <FieldValue name={name} form={form} value={value} disabled={disabled} />
      {hint ? <p id={`${id}-hint`} className="ml-input-hint">{hint}</p> : null}
      {error ? <p id={`${id}-error`} role="alert" className="ml-input-error">{error}</p> : null}
    </div>
  );
}

/**
 * What a control that is not a native input submits with its form: a hidden
 * input per value, disabled with the control so a disabled field is not sent.
 */
export function FieldValue({ name, form, value, disabled }: { name?: string; form?: string; value?: string | readonly string[] | null; disabled?: boolean }) {
  if (!name) return null;
  const values = typeof value === "string" ? [value] : (value ?? [""]);
  return values.map((entry, index) => <input key={index} type="hidden" name={name} form={form} value={entry} disabled={disabled} />);
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
      if (typeof ResizeObserver === "undefined") return;
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
