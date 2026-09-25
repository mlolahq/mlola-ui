"use client";

import * as React from "react";
import { cx, useControllableState } from "../_internal/react";

interface RadioContextValue {
  selected: string;
  name: string;
  disabled: boolean;
  select: (value: string) => void;
}
const RadioContext = React.createContext<RadioContextValue | null>(null);
const useRadio = () => {
  const context = React.useContext(RadioContext);
  if (!context) throw new Error("RadioGroupItem must be used inside RadioGroup");
  return context;
};

interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  label?: React.ReactNode;
  description?: string;
  error?: string;
}
const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value, defaultValue = "", onValueChange, name, orientation = "vertical", disabled = false, label, description, error, id, className, children, "aria-describedby": describedBy, ...props }, ref) => {
    const generated = React.useId();
    const groupName = name ?? generated;
    const [selected, select] = useControllableState({ value, defaultValue, onChange: onValueChange });
    const labelId = `${groupName}-label`;
    const descriptionId = `${groupName}-description`;
    const errorId = `${groupName}-error`;
    return (
      <RadioContext.Provider value={{ selected, name: groupName, disabled, select }}>
        <div
          ref={ref}
          id={id}
          role="radiogroup"
          aria-labelledby={label ? labelId : undefined}
          aria-label={label ? undefined : "Options"}
          aria-orientation={orientation}
          aria-describedby={[describedBy, description && descriptionId, error && errorId].filter(Boolean).join(" ") || undefined}
          aria-invalid={error ? true : undefined}
          data-orientation={orientation}
          data-disabled={disabled ? "" : undefined}
          data-invalid={error ? "" : undefined}
          className={cx("ml-radio-group", className)}
          {...props}
        >
          {label ? <div id={labelId} className="ml-radio-group-label">{label}</div> : null}
          {description ? <p id={descriptionId} className="ml-radio-group-description">{description}</p> : null}
          <div className="ml-radio-group-items">{children}</div>
          {error ? <p id={errorId} role="alert" className="ml-radio-group-error">{error}</p> : null}
        </div>
      </RadioContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "name" | "onChange"> {
  value: string;
  label: React.ReactNode;
  description?: string;
}
const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ value, label, description, disabled = false, id, className, "aria-describedby": describedBy, ...props }, ref) => {
    const group = useRadio();
    const generated = React.useId();
    const inputId = id ?? `${group.name}-${generated}`;
    const descriptionId = `${inputId}-description`;
    const checked = group.selected === value;
    const isDisabled = disabled || group.disabled;
    return (
      <label htmlFor={inputId} className={cx("ml-radio-item", className)} data-state={checked ? "checked" : "unchecked"} data-disabled={isDisabled ? "" : undefined}>
        <span className="ml-radio-control">
          <input
            ref={ref}
            id={inputId}
            type="radio"
            name={group.name}
            value={value}
            checked={checked}
            disabled={isDisabled}
            aria-describedby={[describedBy, description && descriptionId].filter(Boolean).join(" ") || undefined}
            className="ml-radio-input"
            onChange={() => group.select(value)}
            {...props}
          />
          <span aria-hidden="true" className="ml-radio-indicator" />
        </span>
        <span className="ml-radio-copy">
          <span className="ml-radio-label">{label}</span>
          {description ? <span id={descriptionId} className="ml-radio-description">{description}</span> : null}
        </span>
      </label>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";
export { RadioGroup, RadioGroupItem };
