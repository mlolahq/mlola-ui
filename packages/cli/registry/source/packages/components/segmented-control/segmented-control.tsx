"use client";

import * as React from "react";
import { rovingIndex } from "@mlola-ui/behavior/logic";
import { cx, useControllableState } from "../_internal/react";

export interface SegmentedOption {
  value: string;
  label: React.ReactNode;
}

export interface SegmentedControlProps extends React.HTMLAttributes<HTMLDivElement> {
  options: SegmentedOption[];
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function SegmentedControl({
  options,
  label,
  value,
  defaultValue,
  onValueChange,
  className,
  ...props
}: SegmentedControlProps) {
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue: defaultValue ?? options[0]?.value ?? "",
    onChange: onValueChange,
  });
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === current),
  );
  const items = React.useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = rovingIndex(options.length, index, event.key, { horizontal: true, wrap: true });
    if (target < 0) return;
    event.preventDefault();
    setCurrent(options[target].value);
    items.current[target]?.focus();
  };

  return (
    <div
      {...props}
      className={cx("ml-segmented-control", className)}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      {options.map((option, position) => {
        const active = option.value === current;
        return (
          <button
            key={option.value}
            ref={(node) => {
              items.current[position] = node;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            className="ml-segmented-control-item"
            data-state={active ? "active" : "inactive"}
            tabIndex={active ? 0 : -1}
            onClick={() => setCurrent(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
