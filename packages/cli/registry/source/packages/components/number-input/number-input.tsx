"use client";

import * as React from "react";
import { IconMinus, IconPlus } from "@mlola-ui/icons";
import { Field, fieldDescription } from "../input/input";
import { composeRefs, cx } from "../_internal/react";
import { parseNumber, settle, stepValue } from "./number";

export { parseNumber, settle, stepValue } from "./number";

export interface NumberInputProps {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  /** What Shift+arrows and Page Up/Down move by; ten steps by default. */
  largeStep?: number;
  /** Decimals kept when a typed value is committed. */
  precision?: number;
  /** How the value reads at rest, as Intl formats it: currency, unit, grouping. */
  format?: Intl.NumberFormatOptions;
  locale?: string;
  /** Show − and + beside the value. */
  buttons?: boolean;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
}

/**
 * A number field that reads well and types well: formatted at rest ($1,200.00,
 * 12 kg), plain while editing, in the reader's own separators. Arrows step
 * (Shift for ten), Page keys take large steps, Home and End go to the
 * bounds, and holding − or + keeps counting.
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput({
  value,
  defaultValue = null,
  onValueChange,
  label,
  hint,
  error,
  placeholder,
  min,
  max,
  step = 1,
  largeStep,
  precision,
  format,
  locale = "en",
  buttons = true,
  disabled,
  required,
  id,
  className,
}: NumberInputProps, ref) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  const [inner, setInner] = React.useState<number | null>(defaultValue);
  const current = value !== undefined ? value : inner;
  const [editing, setEditing] = React.useState<string | null>(null);
  const hold = React.useRef<{ timer?: number; interval?: number }>({});
  const input = React.useRef<HTMLInputElement>(null);
  const selectOnRender = React.useRef(false);
  const latest = React.useRef(current);
  latest.current = current;
  const big = largeStep ?? step * 10;

  const display = React.useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: precision ?? 20, ...format }), [locale, precision, format]);
  const plain = React.useMemo(() => new Intl.NumberFormat(locale, { useGrouping: false, maximumFractionDigits: 20 }), [locale]);
  const shown = editing ?? (current === null ? "" : display.format(current));

  // On focus the plain value replaces the formatted one; select it before the next keystroke lands.
  React.useLayoutEffect(() => {
    if (!selectOnRender.current) return;
    selectOnRender.current = false;
    input.current?.select();
  });

  const commit = (next: number | null) => {
    latest.current = next;
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  const nudge = (delta: number, by = step) => {
    const next = stepValue(latest.current, delta, { step: by, min, max });
    commit(next);
    if (editing !== null) setEditing(plain.format(next));
  };

  const finish = () => {
    if (editing === null) return;
    const parsed = parseNumber(editing, locale);
    commit(parsed === null ? null : settle(parsed, { min, max, precision }));
    setEditing(null);
  };

  const stopHold = () => {
    window.clearTimeout(hold.current.timer);
    window.clearInterval(hold.current.interval);
  };
  React.useEffect(() => stopHold, []);

  // Press and hold: one step now, then a steady run after a pause.
  const startHold = (delta: number) => {
    stopHold();
    nudge(delta);
    hold.current.timer = window.setTimeout(() => {
      hold.current.interval = window.setInterval(() => nudge(delta), 60);
    }, 400);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const keys: Record<string, () => void> = {
      ArrowUp: () => nudge(1, event.shiftKey ? big : step),
      ArrowDown: () => nudge(-1, event.shiftKey ? big : step),
      PageUp: () => nudge(1, big),
      PageDown: () => nudge(-1, big),
      Home: () => min !== undefined && commit(min),
      End: () => max !== undefined && commit(max),
      Enter: () => finish(),
    };
    if (keys[event.key]) {
      event.preventDefault();
      keys[event.key]();
    } else if (event.key === "Escape" && editing !== null) {
      event.preventDefault();
      setEditing(null);
    }
  };

  const atMin = current !== null && min !== undefined && current <= min;
  const atMax = current !== null && max !== undefined && current >= max;

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} required={required} disabled={disabled} className={cx("ml-number-input", className)}>
      <div className="ml-number-input-control" data-disabled={disabled || undefined} data-invalid={error ? "" : undefined}>
        <input
          ref={composeRefs(input, ref)}
          id={fieldId}
          className="ml-number-input-field"
          role="spinbutton"
          inputMode="decimal"
          autoComplete="off"
          aria-valuenow={current ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={current === null ? undefined : display.format(current)}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescription(fieldId, { hint, error })}
          value={shown}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          onFocus={() => {
            selectOnRender.current = true;
            setEditing(current === null ? "" : plain.format(current));
          }}
          onChange={(event) => setEditing(event.target.value)}
          onBlur={finish}
          onKeyDown={onKeyDown}
        />
        {buttons ? (
          <span className="ml-number-input-buttons">
            <button type="button" className="ml-number-input-step" tabIndex={-1} aria-label="Decrease" disabled={disabled || atMin} onPointerDown={(event) => { event.preventDefault(); startHold(-1); }} onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}>
              <IconMinus aria-hidden="true" size="0.9em" />
            </button>
            <button type="button" className="ml-number-input-step" tabIndex={-1} aria-label="Increase" disabled={disabled || atMax} onPointerDown={(event) => { event.preventDefault(); startHold(1); }} onPointerUp={stopHold} onPointerLeave={stopHold} onPointerCancel={stopHold}>
              <IconPlus aria-hidden="true" size="0.9em" />
            </button>
          </span>
        ) : null}
      </div>
    </Field>
  );
});
NumberInput.displayName = "NumberInput";
