"use client";

import * as React from "react";
import { cx, useControllableState } from "../_internal/react";

type SwitchSize = "sm" | "md" | "lg";
interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: SwitchSize;
  label?: string;
}
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, defaultChecked = false, onCheckedChange, disabled = false, size = "md", label, className, id, onClick, "aria-label": ariaLabel, ...props }, ref) => {
    const [on, setOn] = useControllableState({ value: checked, defaultValue: defaultChecked, onChange: onCheckedChange });
    const generated = React.useId();
    const labelId = label ? `${id ?? generated}-label` : undefined;
    return (
      <span className="ml-switch-field" data-disabled={disabled ? "" : undefined}>
        <button
          ref={ref}
          id={id}
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby={labelId}
          aria-label={label ? undefined : ariaLabel ?? "Toggle setting"}
          disabled={disabled}
          data-state={on ? "checked" : "unchecked"}
          data-size={size}
          className={cx("ml-toggle", className)}
          data-hit="expand"
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) setOn(!on);
          }}
          {...props}
        >
          <span aria-hidden="true" className="ml-toggle-thumb" />
        </button>
        {label ? <span id={labelId} className="ml-switch-label">{label}</span> : null}
      </span>
    );
  }
);
Switch.displayName = "Switch";

type ToggleSize = "sm" | "md" | "lg";
interface ToggleProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  size?: ToggleSize;
}
const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ pressed, defaultPressed = false, onPressedChange, disabled = false, size = "md", className, children, onClick, ...props }, ref) => {
    const [on, setOn] = useControllableState({ value: pressed, defaultValue: defaultPressed, onChange: onPressedChange });
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={on}
        disabled={disabled}
        data-state={on ? "on" : "off"}
        data-size={size}
        className={cx("ml-toggle-button", className)}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setOn(!on);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Toggle.displayName = "Toggle";
export { Switch, Toggle };
export type { SwitchProps, ToggleProps };
