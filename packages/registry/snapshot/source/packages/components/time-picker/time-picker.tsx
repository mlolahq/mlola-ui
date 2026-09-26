"use client";

import * as React from "react";
import { IconClock } from "@mlola-ui/icons";
import { Field, fieldDescription } from "../input/input";
import { Popover } from "../popover/popover";
import { composeRefs, cx } from "../_internal/react";
import { fromMinutes, isTimeAllowed, nearestAllowed, nextAllowed, toMinutes, type TimeMatchers, type TimeRules } from "./times";

export type { TimeMatcher, TimeMatchers } from "./times";
export { isTimeAllowed, matchesTime } from "./times";

export interface TimePickerProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** "HH:MM", 24-hour. */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  /** 12 or 24; by default the locale decides. */
  hourCycle?: 12 | 24;
  /** Minutes the arrow keys move by. */
  step?: number;
  /** Minutes between times in the quick list. */
  listStep?: number;
  min?: string;
  max?: string;
  /**
   * Times that cannot be picked: "HH:MM", a range "12:00-13:00", `{ from, to }`
   * or a function. Ranges include their start and exclude their end, so
   * 13:00 is free again after a 12:00-13:00 break.
   */
  disabledTimes?: TimeMatchers;
  /** When given, only these times can be picked, such as bookable slots; same forms as `disabledTimes`. */
  enabledTimes?: TimeMatchers;
  locale?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
}

const pad = (value: number) => String(value).padStart(2, "0");
const wrap = (value: number, size: number) => ((value % size) + size) % size;

type Segment = "hour" | "minute" | "period";

/**
 * A time field made of spinbuttons: type the digits or use the arrows, and
 * the field moves on by itself. A quick list offers common times. The value
 * is always "HH:MM" in 24-hour time, whatever the reader sees.
 */
export const TimePicker = React.forwardRef<HTMLSpanElement, TimePickerProps>(function TimePicker({
  label,
  hint,
  error,
  value,
  defaultValue = null,
  onValueChange,
  hourCycle,
  step = 1,
  listStep = 30,
  min,
  max,
  disabledTimes,
  enabledTimes,
  locale = "en",
  disabled,
  required,
  id,
  className,
}: TimePickerProps, ref) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  const [inner, setInner] = React.useState<string | null>(defaultValue);
  const current = value !== undefined ? value : inner;
  const total = toMinutes(current);
  const cycle = hourCycle ?? (new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle?.startsWith("h1") ? 12 : 24);
  const [open, setOpen] = React.useState(false);
  const list = React.useRef<HTMLUListElement>(null);
  const buffer = React.useRef("");
  const segments = React.useRef(new Map<Segment, HTMLSpanElement>());
  const order: Segment[] = cycle === 12 ? ["hour", "minute", "period"] : ["hour", "minute"];

  const rules: TimeRules = { min, max, disabled: disabledTimes, enabled: enabledTimes };
  const unavailable = total !== null && !isTimeAllowed(total, rules);

  /** Arrow keys land on the next allowed time in their direction, never on a refused one. */
  const move = (target: number, direction: 1 | -1, by: number) => {
    const next = nextAllowed(wrap(target, 1440), direction, by, rules);
    if (next !== null) commit(next);
  };

  const commit = (minutes: number | null) => {
    // Typed and stepped times stay inside [min, max], like the quick list.
    const bounded = minutes === null ? null : Math.min(toMinutes(max) ?? 1439, Math.max(toMinutes(min) ?? 0, wrap(minutes, 1440)));
    const next = bounded === null ? null : fromMinutes(bounded);
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  const base = total ?? 9 * 60;
  const hours = Math.floor(base / 60);
  const minutes = base % 60;
  const isPm = hours >= 12;

  const focusNext = (segment: Segment, direction = 1) => {
    const index = order.indexOf(segment) + direction;
    if (order[index]) segments.current.get(order[index])?.focus();
  };

  const setHour = (hour: number) => commit(hour * 60 + minutes);
  const setMinute = (minute: number) => commit(hours * 60 + minute);

  const onKeyDown = (event: React.KeyboardEvent, segment: Segment) => {
    const key = event.key;
    if (key === "ArrowLeft" || key === "ArrowRight") {
      event.preventDefault();
      buffer.current = "";
      focusNext(segment, key === "ArrowRight" ? 1 : -1);
      return;
    }
    if (key === "ArrowUp" || key === "ArrowDown") {
      event.preventDefault();
      const direction = key === "ArrowUp" ? 1 : -1;
      if (segment === "hour") move(wrap(hours + direction, 24) * 60 + minutes, direction, 60);
      else if (segment === "minute") move(hours * 60 + wrap(Math.round(minutes / step) * step + direction * step, 60), direction, step);
      else {
        const flipped = nearestAllowed(wrap(base + (isPm ? -720 : 720), 1440), rules);
        if (flipped !== null) commit(flipped);
      }
      return;
    }
    if (segment === "period" && /^[ap]$/i.test(key)) {
      event.preventDefault();
      const wantPm = key.toLowerCase() === "p";
      if (wantPm !== isPm) commit(base + (wantPm ? 720 : -720));
      // Typed times may land on a refused one; the field snaps when focus leaves it.
      return;
    }
    if (key === "Backspace" || key === "Delete") {
      event.preventDefault();
      buffer.current = "";
      commit(null);
      return;
    }
    if (!/^\d$/.test(key) || segment === "period") return;
    event.preventDefault();
    buffer.current = (buffer.current + key).slice(-2);
    const typed = Number(buffer.current);
    if (segment === "hour") {
      const limit = cycle === 12 ? 12 : 23;
      const hour24 = cycle === 12 ? (typed % 12) + (isPm ? 12 : 0) : typed;
      if (typed <= limit) setHour(hour24);
      // One digit is enough when no second digit could follow it.
      if (buffer.current.length === 2 || typed * 10 > limit) {
        buffer.current = "";
        focusNext(segment);
      }
    } else {
      if (typed < 60) setMinute(typed);
      if (buffer.current.length === 2 || typed * 10 >= 60) {
        buffer.current = "";
        focusNext(segment);
      }
    }
  };

  const displayHour = total === null ? "--" : cycle === 12 ? String(((hours + 11) % 12) + 1) : pad(hours);
  const displayMinute = total === null ? "--" : pad(minutes);
  const format = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hourCycle: cycle === 12 ? "h12" : "h23", timeZone: "UTC" });
  const spoken = (value: number) => format.format(new Date(Date.UTC(2000, 0, 1, Math.floor(value / 60), value % 60)));

  const low = toMinutes(min) ?? 0;
  const high = toMinutes(max) ?? 1439;
  // With enabledTimes the list offers exactly the allowed slots, exact times
  // included; otherwise it walks the grid and shows refused times dimmed.
  const grid: number[] = [];
  for (let at = low; at <= high; at += listStep) grid.push(at);
  const exact = (Array.isArray(enabledTimes) ? enabledTimes : enabledTimes === undefined ? [] : [enabledTimes])
    .filter((matcher): matcher is string => typeof matcher === "string" && !matcher.includes("-"))
    .map((time) => toMinutes(time))
    .filter((minutes): minutes is number => minutes !== null);
  const options = enabledTimes === undefined ? grid : [...new Set([...grid, ...exact])].sort((a, b) => a - b).filter((at) => isTimeAllowed(at, rules));
  const shownAt = total !== null ? options.reduce((best, at) => (Math.abs(at - total) < Math.abs(best - total) ? at : best), options[0] ?? low) : (options.find((at) => isTimeAllowed(at, rules)) ?? low);

  // Open the list centered on the current time, once the popover has laid out.
  // Only the list scrolls, never the page.
  React.useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const scroller = list.current;
      const anchor = scroller?.querySelector<HTMLElement>("[data-anchor]");
      if (!scroller || !anchor) return;
      const box = scroller.getBoundingClientRect();
      const rect = anchor.getBoundingClientRect();
      scroller.scrollTop += rect.top - box.top - (scroller.clientHeight - rect.height) / 2;
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const segmentProps = (segment: Segment, now: number | null, lowest: number, highest: number, text: string) => ({
    ref: (element: HTMLSpanElement | null) => {
      if (element) segments.current.set(segment, element);
      else segments.current.delete(segment);
      // The forwarded ref is the first segment: the one a form focuses.
      if (segment === "hour") composeRefs(ref)(element);
    },
    role: "spinbutton",
    tabIndex: disabled ? -1 : 0,
    "aria-label": segment === "hour" ? "Hours" : segment === "minute" ? "Minutes" : "AM or PM",
    "aria-valuemin": lowest,
    "aria-valuemax": highest,
    "aria-valuenow": now ?? undefined,
    "aria-valuetext": total === null ? "Empty" : text,
    "aria-disabled": disabled || undefined,
    className: "ml-time-picker-segment",
    "data-empty": total === null || undefined,
    onKeyDown: (event: React.KeyboardEvent) => !disabled && onKeyDown(event, segment),
    onFocus: () => (buffer.current = ""),
  });

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} required={required} disabled={disabled} className={cx("ml-time-picker", className)}>
      <div
        className="ml-input ml-time-picker-control"
        role="group"
        id={fieldId}
        aria-label={typeof label === "string" ? label : "Time"}
        aria-describedby={fieldDescription(fieldId, { hint, error })}
        aria-invalid={error || unavailable ? true : undefined}
        data-disabled={disabled || undefined}
        data-unavailable={unavailable || undefined}
        onBlur={(event) => {
          // Snap a refused time to the nearest allowed one when the reader moves on.
          if (event.currentTarget.contains(event.relatedTarget as Node) || !unavailable || total === null) return;
          commit(nearestAllowed(total, rules));
        }}
      >
        <span {...segmentProps("hour", total === null ? null : hours, 0, 23, displayHour)}>{displayHour}</span>
        <span className="ml-time-picker-colon" aria-hidden="true">
          :
        </span>
        <span {...segmentProps("minute", total === null ? null : minutes, 0, 59, displayMinute)}>{displayMinute}</span>
        {cycle === 12 ? (
          <span {...segmentProps("period", total === null ? null : isPm ? 1 : 0, 0, 1, isPm ? "PM" : "AM")} data-period="">
            {total === null ? "--" : isPm ? "PM" : "AM"}
          </span>
        ) : null}
        <Popover
          label="Choose a time"
          open={open}
          onOpenChange={setOpen}
          side="bottom"
          align="end"
          trigger={
            <button type="button" className="ml-time-picker-open" aria-label="Choose from a list" disabled={disabled}>
              <IconClock aria-hidden="true" size="1em" />
            </button>
          }
        >
          <ul ref={list} className="ml-time-picker-list" role="listbox" aria-label="Times">
            {options.map((option) => (
              <li key={option} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={option === total}
                  aria-disabled={!isTimeAllowed(option, rules) || undefined}
                  disabled={!isTimeAllowed(option, rules)}
                  className="ml-time-picker-option"
                  data-anchor={option === shownAt || undefined}
                  onClick={() => {
                    commit(option);
                    setOpen(false);
                  }}
                >
                  {spoken(option)}
                </button>
              </li>
            ))}
          </ul>
        </Popover>
      </div>
    </Field>
  );
});
TimePicker.displayName = "TimePicker";
