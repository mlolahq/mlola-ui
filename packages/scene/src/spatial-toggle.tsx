"use client";

import * as React from "react";
import { useReducedMotion } from "./use-reduced-motion";

export interface SpatialToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const SpatialToggle = React.forwardRef<HTMLButtonElement, SpatialToggleProps>(
  (
    {
      checked = false,
      onChange,
      label,
      className = "",
      disabled = false,
      id,
      name,
    },
    ref
  ) => {
    const reducedMotion = useReducedMotion();
    return (
      <span className={joinClasses("ml-scene-spatial-toggle", className)}>
        <button
          ref={ref}
          id={id}
          name={name}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={typeof label === "string" ? label : undefined}
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
          className="ml-scene-spatial-switch"
          style={{
            background: checked
              ? "var(--ml-primary)"
              : "var(--ml-background-subtle)",
            transition: reducedMotion ? "none" : "background 240ms ease",
          }}
        >
          <span
            aria-hidden="true"
            className="ml-scene-spatial-thumb"
            style={{
              transform: checked ? "translate3d(20px, 0, 0)" : "translate3d(0, 0, 0)",
              transition: reducedMotion
                ? "none"
                : "transform 300ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          />
        </button>
        {label ? (
          <span aria-hidden="true" className="ml-scene-spatial-label">
            {label}
          </span>
        ) : null}
      </span>
    );
  }
);
SpatialToggle.displayName = "SpatialToggle";

/** @deprecated Use SpatialToggle. Kept as a source-compatible scene export. */
export const Toggle3D = SpatialToggle;
export type Toggle3DProps = SpatialToggleProps;
