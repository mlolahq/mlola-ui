"use client";

import * as React from "react";
import { cx } from "../_internal/react";

/** The meaning of the fill, from the theme's colour roles. */
export type ProgressTone = "primary" | "info" | "success" | "warning" | "danger";
type ProgressSize = "sm" | "md" | "lg";
export interface ProgressProps {
  value?: number;
  max?: number;
  tone?: ProgressTone;
  size?: ProgressSize;
  showLabel?: boolean;
  /** Text shown beside the value when showLabel is on. */
  label?: string;
  indeterminate?: boolean;
  /** Work is happening right now: a light sweeps along the bar. Leave it off for static amounts such as quotas. */
  active?: boolean;
  className?: string;
}
const metrics = (value: number, max: number) => {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = Number.isFinite(value) ? Math.min(safeMax, Math.max(0, value)) : 0;
  return { safeMax, safeValue, percent: Math.round((safeValue / safeMax) * 100) };
};

/** The shown percentage eases towards the real one, so the number moves with the bar. */
function useCountUp(target: number) {
  const [shown, setShown] = React.useState(0);
  const current = React.useRef(0);
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = target;
      setShown(target);
      return;
    }
    const from = current.current;
    const started = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - started) / 600);
      const eased = 1 - Math.pow(1 - t, 3);
      current.current = from + (target - from) * eased;
      setShown(Math.round(current.current));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return shown;
}

/**
 * A bar that fills as work completes. It grows in when it appears, eases
 * between values with the percentage counting alongside, sweeps a light
 * along the fill while `active`, and pulses once when it reaches the end.
 */
export function Progress({ value = 0, max = 100, tone = "primary", size = "md", showLabel = false, label = "Progress", indeterminate = false, active = false, className }: ProgressProps) {
  const { safeMax, safeValue, percent } = metrics(value, max);
  const shown = useCountUp(percent);
  const complete = !indeterminate && percent >= 100;
  return (
    <div className={cx("ml-progress-root", className)} data-tone={tone} data-size={size} data-state={indeterminate ? "indeterminate" : complete ? "complete" : "determinate"} data-active={(active && !complete && !indeterminate) || undefined}>
      {showLabel ? (
        <div className="ml-progress-label">
          <span>{label}</span>
          <span aria-hidden="true" className="ml-progress-value">
            {indeterminate ? "Loading…" : `${shown}%`}
          </span>
        </div>
      ) : null}
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={indeterminate ? undefined : safeValue} aria-valuetext={indeterminate ? "Loading" : `${percent}%`} className="ml-progress-track">
        <div aria-hidden="true" className="ml-progress-fill" style={indeterminate ? undefined : { width: `${percent}%` }} />
      </div>
    </div>
  );
}

export interface CircularProgressProps extends ProgressProps {}
const CIRCUMFERENCE = 2 * Math.PI * 44;
export function CircularProgress({ value = 0, max = 100, tone = "primary", size = "md", showLabel = false, label = "Progress", indeterminate = false, className }: CircularProgressProps) {
  const { safeMax, safeValue, percent } = metrics(value, max);
  const shown = useCountUp(percent);
  const filled = indeterminate ? CIRCUMFERENCE * 0.28 : (CIRCUMFERENCE * percent) / 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={indeterminate ? undefined : safeValue}
      aria-valuetext={indeterminate ? "Loading" : `${percent}%`}
      data-tone={tone}
      data-size={size}
      data-state={indeterminate ? "indeterminate" : percent >= 100 ? "complete" : "determinate"}
      className={cx("ml-circular-progress", className)}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true" className="ml-circular-progress-svg">
        <circle cx="50" cy="50" r="44" fill="none" strokeWidth="9" className="ml-circular-progress-track" />
        <circle cx="50" cy="50" r="44" fill="none" strokeWidth="9" strokeLinecap="round" style={{ strokeDasharray: `${filled} ${CIRCUMFERENCE}` }} transform="rotate(-90 50 50)" className="ml-circular-progress-fill" />
      </svg>
      {showLabel && !indeterminate ? (
        <span aria-hidden="true" className="ml-circular-progress-label">
          {shown}%
        </span>
      ) : null}
    </div>
  );
}
