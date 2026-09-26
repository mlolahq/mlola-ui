"use client";

import * as React from "react";
import { composeRefs, useControllableState } from "../_internal/react";
import { Field, fieldDescription } from "../input/input";

export interface OtpInputProps {
  length?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called once every digit is filled. */
  onComplete?: (value: string) => void;
  label?: string;
  hint?: string;
  error?: string;
  /** "numeric" (default) or "alphanumeric". */
  mode?: "numeric" | "alphanumeric";
  disabled?: boolean;
  /** Split the boxes into groups, e.g. 3 for "123 456". */
  groupSize?: number;
  id?: string;
  className?: string;
}

/**
 * A one-time code as separate boxes that behave like one field. Typing moves
 * forward, Backspace moves back, arrows move freely, and pasting or the
 * phone's SMS autofill fills every box at once.
 */
export const OtpInput = React.forwardRef<HTMLInputElement, OtpInputProps>(function OtpInput({
  length = 6,
  value,
  defaultValue = "",
  onValueChange,
  onComplete,
  label,
  hint,
  error,
  mode = "numeric",
  disabled,
  groupSize,
  id,
  className,
}: OtpInputProps, ref) {
  const [code, setCode] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const boxes = React.useRef<Array<HTMLInputElement | null>>([]);
  const generated = React.useId();
  const fieldId = id ?? `otp-${generated}`;
  const allowed = mode === "numeric" ? /\d/ : /[a-z0-9]/i;

  const commit = (next: string, focusIndex?: number) => {
    const clean = next.slice(0, length);
    setCode(clean);
    if (focusIndex !== undefined) boxes.current[Math.min(focusIndex, length - 1)]?.focus();
    if (clean.length === length && !clean.includes(" ")) onComplete?.(clean);
  };

  const fill = (index: number, text: string) => {
    const chars = [...text].filter((char) => allowed.test(char));
    if (!chars.length) return;
    const current = code.padEnd(length, " ").split("");
    chars.forEach((char, offset) => {
      if (index + offset < length) current[index + offset] = mode === "numeric" ? char : char.toUpperCase();
    });
    commit(current.join("").trimEnd(), index + chars.length);
  };

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} disabled={disabled} className={className}>
      <div className="ml-otp" role="group" aria-label={label ?? `${length}-character code`} data-invalid={error ? "" : undefined}>
        {Array.from({ length }, (_, index) => (
          <React.Fragment key={index}>
            {groupSize && index > 0 && index % groupSize === 0 ? <span aria-hidden="true" className="ml-otp-separator" /> : null}
            <input
              ref={(node) => {
                boxes.current[index] = node;
                if (index === 0) composeRefs(ref)(node);
              }}
              id={index === 0 ? fieldId : undefined}
              className="ml-otp-box"
              inputMode={mode === "numeric" ? "numeric" : "text"}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${index + 1} of ${length}`}
              aria-invalid={error ? true : undefined}
              aria-describedby={index === 0 ? fieldDescription(fieldId, { hint, error }) : undefined}
              maxLength={index === 0 ? length : 1}
              disabled={disabled}
              value={(code[index] ?? "").trim()}
              onFocus={(event) => event.target.select()}
              onChange={(event) => fill(index, event.target.value)}
              onPaste={(event) => {
                event.preventDefault();
                fill(index, event.clipboardData.getData("text"));
              }}
              onKeyDown={(event) => {
                if (event.key === "Backspace") {
                  event.preventDefault();
                  const current = code.padEnd(length, " ").split("");
                  const target = current[index]?.trim() ? index : Math.max(0, index - 1);
                  current[target] = " ";
                  commit(current.join("").trimEnd(), target);
                } else if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  boxes.current[Math.max(0, index - 1)]?.focus();
                } else if (event.key === "ArrowRight") {
                  event.preventDefault();
                  boxes.current[Math.min(length - 1, index + 1)]?.focus();
                }
              }}
            />
          </React.Fragment>
        ))}
      </div>
    </Field>
  );
});
OtpInput.displayName = "OtpInput";
