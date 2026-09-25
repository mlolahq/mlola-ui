"use client";

import * as React from "react";
import { IconChevronLeft, IconChevronRight } from "@mlola-ui/icons";
import { cx } from "../_internal/react";
import {
  addDays,
  addMonths,
  clampDate,
  daysBetween,
  endOfWeek,
  isBetween,
  isDateBlocked,
  monthGrid,
  rangeReach,
  sameMonth,
  startOfMonth,
  startOfWeek,
  today as todayOf,
  toTime,
  type DateMatchers,
  type ISODate,
} from "./dates";

export type { DateMatcher, DateMatchers, ISODate, RangeProblem, RangeRules } from "./dates";
export { addDays, addMonths, isDateBlocked, isValidISODate, matchesDate, rangeProblem, today } from "./dates";

export interface DateRange {
  from: ISODate;
  to?: ISODate;
}

interface BaseProps {
  /** The month shown first: any date inside it. */
  month?: ISODate;
  defaultMonth?: ISODate;
  onMonthChange?: (month: ISODate) => void;
  /** One month, or two side by side for ranges. */
  months?: 1 | 2;
  min?: ISODate;
  max?: ISODate;
  /**
   * Dates that cannot be picked: single dates, `{ from, to }` ranges,
   * `{ before }`, `{ after }`, `{ dayOfWeek: [0, 6] }` or a function.
   */
  disabledDates?: DateMatchers;
  /** When given, only these dates can be picked; same forms as `disabledDates`. */
  enabledDates?: DateMatchers;
  /** A function form of `disabledDates`, kept for convenience. */
  isDisabled?: (date: ISODate) => boolean;
  /** 1 starts weeks on Monday, 0 on Sunday. */
  weekStart?: 0 | 1;
  locale?: string;
  showOutsideDays?: boolean;
  /** Today's date. Pass it when rendering on the server so both renders agree. */
  today?: ISODate;
  label?: string;
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
  /** Shortest range in days, counted inclusively (the 1st to the 3rd is 3 days). */
  minDays?: number;
  /** Longest range in days, counted inclusively. */
  maxDays?: number;
  /** Let a range pass over disabled dates; by default it stops at the first one. */
  allowDisabledInRange?: boolean;
}

interface MultipleProps {
  mode: "multiple";
  value?: ISODate[];
  defaultValue?: ISODate[];
  onValueChange?: (value: ISODate[]) => void;
}

export type CalendarProps = BaseProps & (SingleProps | RangeProps | MultipleProps);

type Selection = ISODate | null | DateRange | ISODate[];

/** Where the calendar opens: the selection, else today, clamped to the allowed range. */
function anchorOf(selection: Selection, fallback: ISODate) {
  if (typeof selection === "string") return selection;
  if (Array.isArray(selection)) return selection[0] ?? fallback;
  return selection?.from ?? fallback;
}

/**
 * A month grid for picking one date, a range, or several. Arrow keys move by
 * day and week, Home and End to the week's edges, Page Up and Page Down by
 * month (with Shift, by year). Ranges preview as the pointer moves.
 */
export function Calendar(props: CalendarProps) {
  const {
    month,
    defaultMonth,
    onMonthChange,
    months = 1,
    min,
    max,
    disabledDates,
    enabledDates,
    isDisabled,
    weekStart = 1,
    locale = "en",
    showOutsideDays = true,
    today: todayProp,
    label = "Calendar",
    className,
  } = props;
  const mode = props.mode ?? "single";
  const today = todayProp ?? todayOf();

  const [innerValue, setInnerValue] = React.useState<Selection>((props.defaultValue as Selection) ?? (mode === "multiple" ? [] : null));
  const selection: Selection = props.value !== undefined ? (props.value as Selection) : innerValue;
  const commit = (next: Selection) => {
    if (props.value === undefined) setInnerValue(next);
    (props.onValueChange as ((value: Selection) => void) | undefined)?.(next);
  };

  const [innerMonth, setInnerMonth] = React.useState(() => startOfMonth(defaultMonth ?? clampDate(anchorOf(selection, today), min, max)));
  const shownMonth = month ? startOfMonth(month) : innerMonth;
  const setMonth = (next: ISODate) => {
    const first = startOfMonth(next);
    if (!month) setInnerMonth(first);
    onMonthChange?.(first);
  };

  const [focused, setFocused] = React.useState<ISODate>(() => clampDate(anchorOf(selection, today), min, max));
  const [hovered, setHovered] = React.useState<ISODate | null>(null);
  const moved = React.useRef(false);
  const buttons = React.useRef(new Map<ISODate, HTMLButtonElement>());

  // Keep the focused day inside what is shown.
  const visible = Array.from({ length: months }, (_, index) => addMonths(shownMonth, index));
  const inView = (date: ISODate) => visible.some((first) => sameMonth(first, date));
  const focusable = inView(focused) ? focused : shownMonth;

  React.useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    buttons.current.get(focused)?.focus();
  }, [focused, shownMonth]);

  const blocked = (date: ISODate) => isDateBlocked(date, { min, max, disabled: disabledDates, enabled: enabledDates }) || Boolean(isDisabled?.(date));

  // While a range waits for its end, dates it cannot reach (past a disabled day,
  // too short or too long) are marked; picking one starts a new range there.
  const rules = props.mode === "range" ? { minDays: props.minDays, maxDays: props.maxDays, allowBlockedInside: props.allowDisabledInRange } : {};
  const pending = mode === "range" && selection && !Array.isArray(selection) && typeof selection !== "string" && !selection.to ? selection.from : null;
  const reach = pending ? rangeReach(pending, blocked, rules) : null;
  const reachable = (date: ISODate) => {
    if (!pending || !reach) return true;
    if (blocked(date) || date < reach.low || date > reach.high) return false;
    // maxDays is already inside the reach; only the shortest length is left to check.
    return Math.abs(daysBetween(pending, date)) + 1 >= (rules.minDays ?? 1);
  };

  const select = (date: ISODate) => {
    if (blocked(date)) return;
    if (mode === "single") commit(date === selection ? null : date);
    else if (mode === "multiple") {
      const list = Array.isArray(selection) ? selection : [];
      commit(list.includes(date) ? list.filter((item) => item !== date) : [...list, date].sort());
    } else {
      const range = selection as DateRange | null;
      if (!range || range.to || !reachable(date)) commit({ from: date });
      else if (date < range.from) commit({ from: date, to: range.from });
      else commit({ from: range.from, to: date });
    }
  };

  const moveTo = (date: ISODate) => {
    const next = clampDate(date, min, max);
    moved.current = true;
    setFocused(next);
    if (!inView(next)) setMonth(next < shownMonth ? next : addMonths(next, -(months - 1)));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const year = event.shiftKey ? 12 : 1;
    const moves: Record<string, () => ISODate> = {
      ArrowLeft: () => addDays(focusable, -1),
      ArrowRight: () => addDays(focusable, 1),
      ArrowUp: () => addDays(focusable, -7),
      ArrowDown: () => addDays(focusable, 7),
      Home: () => startOfWeek(focusable, weekStart),
      End: () => endOfWeek(focusable, weekStart),
      PageUp: () => addMonths(focusable, -year),
      PageDown: () => addMonths(focusable, year),
    };
    if (moves[event.key]) {
      event.preventDefault();
      moveTo(moves[event.key]());
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(focusable);
    }
  };

  const range = mode === "range" ? (selection as DateRange | null) : null;
  const rangeEnd = range ? range.to ?? (hovered && reachable(hovered) ? hovered : undefined) : undefined;
  const [rangeLow, rangeHigh] = range && rangeEnd ? (range.from <= rangeEnd ? [range.from, rangeEnd] : [rangeEnd, range.from]) : [undefined, undefined];
  const isSelected = (date: ISODate) =>
    mode === "single" ? selection === date : mode === "multiple" ? Array.isArray(selection) && selection.includes(date) : Boolean(range && (range.from === date || range.to === date));

  const monthTitle = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  const weekdayShort = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const weekdayLong = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
  const fullDate = new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  const dayNumber = new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "UTC" });
  const firstWeek = monthGrid(shownMonth, weekStart)[0];
  const canPrev = !min || startOfMonth(min) < shownMonth;
  const canNext = !max || startOfMonth(max) > visible[visible.length - 1];

  return (
    <div role="group" aria-label={label} className={cx("ml-calendar", className)} data-months={months}>
      <div className="ml-calendar-months" onKeyDown={onKeyDown} onPointerLeave={() => setHovered(null)}>
        {visible.map((first, index) => (
          <div key={first} className="ml-calendar-month">
            <div className="ml-calendar-caption">
              {index === 0 ? (
                <button type="button" className="ml-calendar-nav" aria-label="Previous month" disabled={!canPrev} onClick={() => setMonth(addMonths(shownMonth, -1))}>
                  <IconChevronLeft aria-hidden="true" size="1em" />
                </button>
              ) : (
                <span aria-hidden="true" />
              )}
              <p className="ml-calendar-title" aria-live="polite">
                {monthTitle.format(new Date(toTime(first)))}
              </p>
              {index === visible.length - 1 ? (
                <button type="button" className="ml-calendar-nav" aria-label="Next month" disabled={!canNext} onClick={() => setMonth(addMonths(shownMonth, 1))}>
                  <IconChevronRight aria-hidden="true" size="1em" />
                </button>
              ) : (
                <span aria-hidden="true" />
              )}
            </div>
          <div role="grid" aria-label={monthTitle.format(new Date(toTime(first)))} className="ml-calendar-grid">
            <div role="row" className="ml-calendar-row">
              {firstWeek.map(({ date }) => (
                <span key={date} role="columnheader" className="ml-calendar-weekday" aria-label={weekdayLong.format(new Date(toTime(date)))}>
                  {weekdayShort.format(new Date(toTime(date))).slice(0, 2)}
                </span>
              ))}
            </div>
            {monthGrid(first, weekStart).map((week) => (
              <div key={week[0].date} role="row" className="ml-calendar-row">
                {week.map(({ date, inMonth }) => {
                  if (!inMonth && (!showOutsideDays || months > 1)) return <span key={date} role="gridcell" className="ml-calendar-cell" aria-hidden="true" />;
                  const selected = isSelected(date);
                  const inRange = Boolean(range && rangeEnd && isBetween(date, range.from, rangeEnd));
                  return (
                    <span
                      key={date}
                      role="gridcell"
                      aria-selected={selected || inRange || undefined}
                      className="ml-calendar-cell"
                      data-range={inRange ? (date === rangeLow ? "start" : date === rangeHigh ? "end" : "middle") : undefined}
                      data-preview={inRange && !range?.to ? "" : undefined}
                    >
                      <button
                        ref={(element) => {
                          if (element) buttons.current.set(date, element);
                          else buttons.current.delete(date);
                        }}
                        type="button"
                        className="ml-calendar-day"
                        tabIndex={date === focusable && inMonth ? 0 : -1}
                        aria-label={fullDate.format(new Date(toTime(date)))}
                        aria-current={date === today ? "date" : undefined}
                        aria-disabled={blocked(date) || undefined}
                        data-selected={selected || undefined}
                        data-unreachable={(!blocked(date) && !reachable(date)) || undefined}
                        data-outside={!inMonth || undefined}
                        data-today={date === today || undefined}
                        onClick={() => {
                          setFocused(date);
                          select(date);
                        }}
                        onPointerEnter={() => mode === "range" && setHovered(date)}
                        onFocus={() => setFocused(date)}
                      >
                        {dayNumber.format(new Date(toTime(date)))}
                      </button>
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          </div>
        ))}
      </div>
    </div>
  );
}
