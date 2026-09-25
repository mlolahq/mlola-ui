"use client";

import * as React from "react";
import { clampToStep, percentOf, sliderValueForKey, valueFromRatio } from "@mlola-ui/behavior/logic";
import { cx, useControllableState } from "../_internal/react";

type SliderSize = "sm" | "md";
interface SliderProps {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  showValue?: boolean;
  size?: SliderSize;
  className?: string;
  id?: string;
}
const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, defaultValue = 50, onValueChange, min = 0, max = 100, step = 1, disabled = false, label, showValue = false, size = "md", className, id }, ref) => {
    const low = Number.isFinite(min) ? min : 0;
    const high = Number.isFinite(max) && max > low ? max : low + 100;
    const increment = Number.isFinite(step) && step > 0 ? step : 1;
    // Shared with the framework-free runtime, so both round identically.
    const bounds = React.useMemo(() => ({ min: low, max: high, step: increment }), [low, high, increment]);
    const normalize = React.useCallback((raw: number) => clampToStep(raw, bounds), [bounds]);
    const [currentRaw, setCurrent] = useControllableState({ value, defaultValue: normalize(defaultValue), onChange: onValueChange });
    const current = normalize(currentRaw);
    const trackRef = React.useRef<HTMLDivElement>(null);
    const dragging = React.useRef(false);
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
          aria-labelledby={labelId}
          aria-label={label ? undefined : "Value"}
          aria-describedby={valueId}
          aria-disabled={disabled || undefined}
          className="ml-slider"
          onKeyDown={(event) => {
            if (disabled) return;
            const next = sliderValueForKey(event.key, current, bounds);
            if (next === undefined) return;
            event.preventDefault();
            setCurrent(next);
          }}
        >
          <div
            ref={trackRef}
            className="ml-slider-track"
            onPointerDown={(event) => {
              if (disabled) return;
              dragging.current = true;
              event.currentTarget.setPointerCapture(event.pointerId);
              setCurrent(normalize(fromPointer(event.clientX)));
            }}
            onPointerMove={(event) => {
              if (!disabled && dragging.current) setCurrent(normalize(fromPointer(event.clientX)));
            }}
            onPointerUp={() => { dragging.current = false; }}
            onPointerCancel={() => { dragging.current = false; }}
          >
            <span aria-hidden="true" className="ml-slider-range" style={{ width: `${percent}%` }} />
            <span aria-hidden="true" className="ml-slider-thumb" style={{ left: `${percent}%` }} />
          </div>
        </div>
      </div>
    );
  }
);
Slider.displayName = "Slider";
export { Slider };
export type { SliderProps, SliderSize };
