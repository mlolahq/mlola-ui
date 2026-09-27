"use client";

import * as React from "react";
import { clampToStep, isSidewaysDrag, percentOf, sliderValueForKey, valueFromRatio } from "@mlola-ui/behavior/logic";
import { cx, useControllableState } from "../_internal/react";
import { FieldValue, type FormControlProps } from "../input/input";

type SliderSize = "sm" | "md";
interface SliderProps extends Omit<FormControlProps, "required"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: React.ReactNode;
  showValue?: boolean;
  size?: SliderSize;
  className?: string;
}
const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, defaultValue = 50, onValueChange, min = 0, max = 100, step = 1, disabled = false, label, showValue = false, size = "md", className, id, name, form, "aria-label": ariaLabel, "aria-labelledby": labelledBy, "aria-describedby": describedBy }, ref) => {
    const low = Number.isFinite(min) ? min : 0;
    const high = Number.isFinite(max) && max > low ? max : low + 100;
    const increment = Number.isFinite(step) && step > 0 ? step : 1;
    // Shared with the framework-free runtime, so both round identically.
    const bounds = React.useMemo(() => ({ min: low, max: high, step: increment }), [low, high, increment]);
    const normalize = React.useCallback((raw: number) => clampToStep(raw, bounds), [bounds]);
    const [currentRaw, setCurrent] = useControllableState({ value, defaultValue: normalize(defaultValue), onChange: onValueChange });
    const current = normalize(currentRaw);
    const trackRef = React.useRef<HTMLDivElement>(null);
    // A mouse or pen sets the value where it presses. A finger may be scrolling
    // the page, so it sets the value only once it moves sideways, or on a tap.
    const gesture = React.useRef<{ id: number; touch: boolean; x: number; y: number; active: boolean } | null>(null);
    const generated = React.useId();
    const sliderId = id ?? generated;
    const labelId = label ? `${sliderId}-label` : undefined;
    const valueId = showValue ? `${sliderId}-value` : undefined;
    const percent = percentOf(current, bounds);
    const fromPointer = (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect?.width) return current;
      return valueFromRatio((clientX - rect.left) / rect.width, bounds);
    };
    return (
      <div className={cx("ml-slider-field", className)} data-disabled={disabled ? "" : undefined} data-size={size}>
        {label || showValue ? (
          <div className="ml-slider-header">
            {label ? <span id={labelId} className="ml-slider-label">{label}</span> : <span />}
            {showValue ? <output id={valueId} htmlFor={sliderId} className="ml-slider-output">{current}</output> : null}
          </div>
        ) : null}
        <div
          ref={ref}
          id={sliderId}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={low}
          aria-valuemax={high}
          aria-valuenow={current}
          aria-valuetext={`${current} of ${high}`}
          aria-labelledby={labelledBy ?? labelId}
          aria-label={labelledBy || label ? undefined : (ariaLabel ?? "Value")}
          aria-describedby={[describedBy, valueId].filter(Boolean).join(" ") || undefined}
          aria-disabled={disabled || undefined}
          className="ml-slider"
          onKeyDown={(event) => {
            if (disabled) return;
            const next = sliderValueForKey(event.key, current, bounds);
            if (next === undefined) return;
            event.preventDefault();
            setCurrent(next);
          }}
          // The whole row takes the pointer, not only the thin track inside it.
          onPointerDown={(event) => {
            if (disabled || event.button !== 0) return;
            const touch = event.pointerType === "touch";
            gesture.current = { id: event.pointerId, touch, x: event.clientX, y: event.clientY, active: !touch };
            if (!touch) {
              event.currentTarget.setPointerCapture(event.pointerId);
              setCurrent(normalize(fromPointer(event.clientX)));
            }
          }}
          onPointerMove={(event) => {
            const current = gesture.current;
            if (disabled || !current || current.id !== event.pointerId) return;
            if (!current.active) {
              // Sideways is a drag; up or down is the page scrolling, which the browser takes.
              if (!isSidewaysDrag(event.clientX - current.x, event.clientY - current.y)) return;
              current.active = true;
              event.currentTarget.setPointerCapture(event.pointerId);
            }
            setCurrent(normalize(fromPointer(event.clientX)));
          }}
          onPointerUp={(event) => {
            const current = gesture.current;
            gesture.current = null;
            // A tap: the finger set nothing while it could still have been scrolling.
            if (!disabled && current?.touch && !current.active) setCurrent(normalize(fromPointer(event.clientX)));
          }}
          onPointerCancel={() => {
            gesture.current = null;
          }}
        >
          <div ref={trackRef} className="ml-slider-track">
            <span aria-hidden="true" className="ml-slider-range" style={{ width: `${percent}%` }} />
            <span aria-hidden="true" className="ml-slider-thumb" style={{ left: `${percent}%` }} />
          </div>
        </div>
        <FieldValue name={name} form={form} value={String(current)} disabled={disabled} />
      </div>
    );
  }
);
Slider.displayName = "Slider";
export { Slider };
export type { SliderProps, SliderSize };
