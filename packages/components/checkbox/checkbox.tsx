"use client";

import * as React from "react";
import { composeRefs, cx, useControllableState } from "../_internal/react";
import { IconCheck, IconMinus } from "@mlola-ui/icons";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, defaultChecked = false, onCheckedChange, indeterminate = false, disabled = false, required = false, label, description, error, id, className, "aria-describedby": describedBy, ...props }, ref) => {
    const [current, setCurrent] = useControllableState({ value: checked, defaultValue: defaultChecked, onChange: onCheckedChange });
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const descriptionId = `${inputId}-description`;
    const errorId = `${inputId}-error`;
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
      if (inputRef.current) inputRef.current.indeterminate = indeterminate;
    }, [indeterminate]);
    const state = indeterminate ? "indeterminate" : current ? "checked" : "unchecked";
    return (
      <div className={cx("ml-checkbox-field", className)} data-state={state} data-disabled={disabled ? "" : undefined} data-invalid={error ? "" : undefined}>
        <span className="ml-checkbox-control">
          <input
            ref={composeRefs(inputRef, ref)}
            id={inputId}
            type="checkbox"
            checked={current}
            disabled={disabled}
            required={required}
            aria-checked={indeterminate ? "mixed" : current}
            aria-invalid={error ? true : undefined}
            aria-describedby={[describedBy, description && descriptionId, error && errorId].filter(Boolean).join(" ") || undefined}
            className="ml-checkbox-input"
            onChange={(event) => setCurrent(event.target.checked)}
            {...props}
          />
          <span aria-hidden="true" className="ml-checkbox-indicator">
            {indeterminate ? <IconMinus aria-hidden="true" size="0.75em" /> : current ? <IconCheck aria-hidden="true" size="0.75em" /> : null}
          </span>
        </span>
        {label || description || error ? (
          <span className="ml-checkbox-copy">
            {label ? (
              <label htmlFor={inputId} className="ml-checkbox-label">
                {/* One span, so a label with links in it reads as one sentence, not flex items. */}
                <span className="ml-checkbox-text">{label}</span>
                {required ? <span aria-hidden="true" className="ml-required-mark">*</span> : null}
              </label>
            ) : null}
            {description ? <span id={descriptionId} className="ml-checkbox-description">{description}</span> : null}
            {error ? <span id={errorId} role="alert" className="ml-checkbox-error">{error}</span> : null}
          </span>
        ) : null}
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
export { Checkbox };
