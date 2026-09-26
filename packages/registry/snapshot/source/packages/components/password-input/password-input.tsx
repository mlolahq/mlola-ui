"use client";

import * as React from "react";
import { passwordStrength } from "@mlola-ui/behavior/logic";
import { IconEye, IconEyeOff } from "@mlola-ui/icons";
import { Input, type InputProps } from "../input/input";

export type PasswordStrength = ReturnType<typeof passwordStrength>;

export interface PasswordInputProps extends Omit<InputProps, "type" | "trailing"> {
  /**
   * Show how strong a new password is while it is typed. For a sign-in
   * field, leave it off: the person is recalling a password, not choosing one.
   */
  strength?: boolean;
  /** The length below which a password is weak. */
  minLength?: number;
  /** The length at which a password is strong. */
  strongLength?: number;
  /** What the meter says for each level: guidance first, then a verdict with the next step. */
  strengthHints?: Partial<Record<PasswordStrength, React.ReactNode>>;
  /** The toggle's accessible name. Its pressed state says whether the password shows. */
  toggleLabel?: string;
}

const HINTS = (min: number): Record<PasswordStrength, React.ReactNode> => ({
  empty: `Use ${min} or more characters.`,
  weak: (
    <>
      <strong>Too short.</strong> Use {min} or more characters.
    </>
  ),
  medium: (
    <>
      <strong>Good.</strong> Longer, or mixed symbols, is stronger.
    </>
  ),
  strong: <strong>Strong password.</strong>,
});

/**
 * A password field with a show and hide toggle, and, for a new password, a
 * meter that says how strong it is and what would make it stronger. The
 * strength is the same shared decision the framework-free runtime uses.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      strength: showStrength = false,
      minLength = 8,
      strongLength = 12,
      strengthHints,
      toggleLabel = "Show password",
      value,
      defaultValue,
      onChange,
      autoComplete,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = React.useState(false);
    const [typed, setTyped] = React.useState(String(defaultValue ?? ""));
    const current = value === undefined ? typed : String(value);
    const level = passwordStrength(current, { min: minLength, strong: strongLength });
    const meterId = React.useId();
    const hints = { ...HINTS(minLength), ...strengthHints };

    return (
      <div className="ml-password-input">
        <Input
          ref={ref}
          {...props}
          type={visible ? "text" : "password"}
          value={value}
          defaultValue={defaultValue}
          autoComplete={autoComplete ?? (showStrength ? "new-password" : "current-password")}
          // A password is not a word: no autocorrect, no capital letter at the start.
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={[describedBy, showStrength ? meterId : null].filter(Boolean).join(" ") || undefined}
          onChange={(event) => {
            if (value === undefined) setTyped(event.target.value);
            onChange?.(event);
          }}
          trailing={
            <button
              type="button"
              className="ml-password-input-toggle"
              aria-label={toggleLabel}
              aria-pressed={visible}
              data-hit="expand"
              disabled={props.disabled}
              onClick={() => setVisible((shown) => !shown)}
            >
              {visible ? <IconEyeOff aria-hidden="true" size="1em" /> : <IconEye aria-hidden="true" size="1em" />}
            </button>
          }
        />
        {showStrength ? (
          <div id={meterId} className="ml-password-input-strength" data-strength={level} aria-live="polite">
            <span className="ml-password-input-meter" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <p>{hints[level]}</p>
          </div>
        ) : null}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
