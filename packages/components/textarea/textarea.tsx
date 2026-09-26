"use client";

import * as React from "react";
import { composeRefs, cx } from "../_internal/react";
import { Field, fieldDescription } from "../input/input";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Grow with the text up to this many rows, then scroll. */
  maxRows?: number;
  /** Show a live character count against `maxLength`. */
  showCount?: boolean;
  containerClassName?: string;
}

/**
 * Multi-line text that grows as it is written. With a `maxLength`, a counter
 * appears near the limit and turns to the danger color past it.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, maxRows = 12, showCount = false, containerClassName, className, id, disabled, required, rows = 3, maxLength, onChange, value, defaultValue, style, "aria-describedby": describedBy, ...props }, ref) => {
    const generated = React.useId();
    const fieldId = id ?? `textarea-${generated}`;
    const node = React.useRef<HTMLTextAreaElement>(null);
    const [length, setLength] = React.useState(() => String(value ?? defaultValue ?? "").length);
    const current = value !== undefined ? String(value).length : length;

    const resize = React.useCallback(() => {
      const element = node.current;
      if (!element || CSS.supports?.("field-sizing", "content")) return;
      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    }, []);
    React.useLayoutEffect(resize, [resize, value]);

    const near = maxLength !== undefined && (showCount || current > maxLength * 0.8);
    return (
      <Field id={fieldId} label={label} hint={hint} error={error} required={required} disabled={disabled} className={containerClassName}>
        <textarea
          ref={composeRefs(ref, node)}
          id={fieldId}
          rows={rows}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescription(fieldId, { hint, error, describedBy })}
          className={cx("ml-textarea", className)}
          style={{ ...style, ["--ml-textarea-max-rows" as string]: maxRows }}
          onChange={(event) => {
            setLength(event.target.value.length);
            resize();
            onChange?.(event);
          }}
          {...props}
        />
        {near ? (
          <p className="ml-textarea-count" data-full={current >= (maxLength ?? Infinity) || undefined} aria-live="polite">
            {current} / {maxLength}
          </p>
        ) : null}
      </Field>
    );
  },
);
Textarea.displayName = "Textarea";
