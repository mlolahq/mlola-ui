"use client";

import * as React from "react";
import { IconCalendar, IconX } from "@mlola-ui/icons";
import { Calendar, addDays, isDateBlocked, rangeProblem, today as todayOf, type DateMatchers, type DateRange, type ISODate } from "../calendar/calendar";
import { Field, fieldDescription } from "../input/input";
import { Popover } from "../popover/popover";
import { cx } from "../_internal/react";
import { startOfMonth, toTime } from "../calendar/dates";

export type { DateMatcher, DateMatchers, DateRange, ISODate } from "../calendar/calendar";

export interface DatePreset {
  label: string;
  value: ISODate | DateRange;
}

interface BaseProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  placeholder?: string;
  min?: ISODate;
  max?: ISODate;
  /** Dates that cannot be picked: dates, `{ from, to }`, `{ before }`, `{ after }`, `{ dayOfWeek }` or a function. */
  disabledDates?: DateMatchers;
  /** When given, only these dates can be picked. */
  enabledDates?: DateMatchers;
  isDisabled?: (date: ISODate) => boolean;
  /** Quick picks beside the calendar, such as "Last 7 days". */
  presets?: DatePreset[];
  weekStart?: 0 | 1;
  locale?: string;
  /** Show a button that empties the field. */
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  /** Today's date, for server rendering. */
  today?: ISODate;
  className?: string;
}

interface SingleProps {
  mode?: "single";
  value?: ISODate | null;
  defaultValue?: ISODate | null;
  onValueChange?: (value: ISODate | null) => void;
}

interface RangeProps {
  mode: "range";
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (value: DateRange | null) => void;
  /** Shortest range in days, counted inclusively. */
  minDays?: number;
  /** Longest range in days, counted inclusively. */
  maxDays?: number;
  /** Let a range pass over disabled dates. */
  allowDisabledInRange?: boolean;
}

export type DatePickerProps = BaseProps & (SingleProps | RangeProps);

/** Ranges people reach for, relative to today. */
export function rangePresets(today = todayOf()): DatePreset[] {
  return [
    { label: "Today", value: { from: today, to: today } },
    { label: "Last 7 days", value: { from: addDays(today, -6), to: today } },
    { label: "Last 30 days", value: { from: addDays(today, -29), to: today } },
    { label: "This month", value: { from: startOfMonth(today), to: today } },
  ];
}

/**
 * A date field that opens a calendar: one date, or a range with presets
 * beside two months. The field shows the choice in the reader's own format;
 * the value stays an ISO date, so it round-trips through forms and APIs.
 */
export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(props: DatePickerProps, ref) {
  const { label, hint, error, placeholder, min, max, disabledDates, enabledDates, isDisabled, presets, weekStart, locale = "en", clearable = true, disabled, required, id, today, className } = props;
  const mode = props.mode ?? "single";
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  const [open, setOpen] = React.useState(false);
  const [inner, setInner] = React.useState<ISODate | DateRange | null>((props.defaultValue as ISODate | DateRange | null) ?? null);
  const value = props.value !== undefined ? (props.value as ISODate | DateRange | null) : inner;
  const commit = (next: ISODate | DateRange | null) => {
    if (props.value === undefined) setInner(next);
    (props.onValueChange as ((value: ISODate | DateRange | null) => void) | undefined)?.(next);
  };

  const format = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  const show = (date: ISODate) => format.format(new Date(toTime(date)));
  const text =
    value === null
      ? null
      : typeof value === "string"
        ? show(value)
        : value.to && value.to !== value.from
          ? `${show(value.from)} – ${show(value.to)}`
          : show(value.from);
  const shownPresets = presets ?? (mode === "range" ? rangePresets(today) : []);
  const blocked = (date: ISODate) => isDateBlocked(date, { min, max, disabled: disabledDates, enabled: enabledDates }) || Boolean(isDisabled?.(date));
  const rangeRules = props.mode === "range" ? { minDays: props.minDays, maxDays: props.maxDays, allowBlockedInside: props.allowDisabledInRange } : {};
  // A preset the rules refuse stays in the list, but cannot be chosen.
  const presetRefused = (preset: DatePreset) =>
    typeof preset.value === "string" ? blocked(preset.value) : rangeProblem(preset.value.from, preset.value.to ?? preset.value.from, blocked, rangeRules) !== null;
  const rules = { min, max, disabledDates, enabledDates, isDisabled, weekStart, locale, today };

  const trigger = (
    <button
      ref={ref}
      id={fieldId}
      type="button"
      className="ml-input ml-date-picker-trigger"
      data-empty={text ? undefined : ""}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={fieldDescription(fieldId, { hint, error })}
    >
      <IconCalendar aria-hidden="true" size="1em" className="ml-date-picker-icon" />
      <span className="ml-date-picker-value">{text ?? placeholder ?? (mode === "range" ? "Pick a range" : "Pick a date")}</span>
    </button>
  );

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} required={required} disabled={disabled} className={cx("ml-date-picker", className)}>
      <div className="ml-date-picker-control">
        <Popover trigger={trigger} label={typeof label === "string" ? label : mode === "range" ? "Choose dates" : "Choose a date"} open={open} onOpenChange={setOpen} side="bottom" align="start" className="ml-date-picker-popover">
          <div className="ml-date-picker-panel" data-presets={shownPresets.length ? "" : undefined}>
            {shownPresets.length ? (
              <ul className="ml-date-picker-presets" aria-label="Presets">
                {shownPresets.map((preset) => (
                  <li key={preset.label}>
                    <button
                      type="button"
                      className="ml-date-picker-preset"
                      disabled={presetRefused(preset)}
                      onClick={() => {
                        commit(preset.value);
                        setOpen(false);
                      }}
                    >
                      {preset.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {mode === "range" ? (
              <Calendar
                mode="range"
                months={2}
                value={value as DateRange | null}
                onValueChange={(next) => {
                  commit(next);
                  if (next?.to) setOpen(false);
                }}
                minDays={props.mode === "range" ? props.minDays : undefined}
                maxDays={props.mode === "range" ? props.maxDays : undefined}
                allowDisabledInRange={props.mode === "range" ? props.allowDisabledInRange : undefined}
                {...rules}
              />
            ) : (
              <Calendar
                value={value as ISODate | null}
                onValueChange={(next) => {
                  commit(next);
                  if (next) setOpen(false);
                }}
                {...rules}
              />
            )}
          </div>
        </Popover>
        {clearable && text && !disabled ? (
          <button type="button" className="ml-date-picker-clear" data-hit="expand" aria-label="Clear date" onClick={() => commit(null)}>
            <IconX aria-hidden="true" size="0.9em" />
          </button>
        ) : null}
      </div>
    </Field>
  );
});
DatePicker.displayName = "DatePicker";
