"use client";

import * as React from "react";
import { cx } from "../_internal/react";
import { buildCalendar, type DayCount, type HeatCell } from "./calendar";

export type { DayCount, HeatCell };

export interface ActivityHeatmapProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  /** Counts per day, YYYY-MM-DD. Missing days are zero. */
  data: DayCount[];
  /** Last day shown. Defaults to the latest day in `data`, so server and client agree. */
  end?: string;
  weeks?: number;
  /** 1 starts weeks on Monday, 0 on Sunday. */
  weekStart?: 0 | 1;
  /** What is counted, in the plural: "tokens", "commits". */
  unit?: string;
  /** Formats a count for the tooltip and labels. */
  formatCount?: (count: number) => string;
  tone?: "primary" | "info" | "success" | "warning";
  onSelect?: (cell: HeatCell) => void;
  /** Left of the legend. Defaults to the total over the range. */
  caption?: React.ReactNode;
  showLegend?: boolean;
  locale?: string;
  label?: string;
}

const today = (data: DayCount[]) => data.reduce((latest, day) => (day.date > latest ? day.date : latest), data[0]?.date ?? "1970-01-01");

/**
 * Activity by day, the way GitHub draws contributions: a week per column, a
 * shade per level. Levels are quantiles of the active days, so one huge day
 * never washes the rest out. It is a real grid: arrows move between days,
 * each day is announced with its count, and hovering or focusing shows it.
 */
export function ActivityHeatmap({
  data,
  end,
  weeks = 26,
  weekStart = 1,
  unit = "activities",
  formatCount,
  tone = "primary",
  onSelect,
  caption,
  showLegend = true,
  locale = "en",
  label = "Activity",
  className,
  style,
  ...props
}: ActivityHeatmapProps) {
  const last = end ?? today(data);
  const calendar = React.useMemo(() => buildCalendar(data, { end: last, weeks, weekStart, locale }), [data, last, weeks, weekStart, locale]);
  const format = React.useMemo(() => formatCount ?? ((count: number) => new Intl.NumberFormat(locale).format(count)), [formatCount, locale]);
  const dayName = React.useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }), [locale]);
  const fullDate = React.useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }), [locale]);
  const shortDate = React.useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }), [locale]);

  const lastWeek = calendar.weeks.length - 1;
  const lastDay = Math.max(0, (calendar.weeks[lastWeek] ?? []).map((cell) => !cell.outside).lastIndexOf(true));
  const [focus, setFocus] = React.useState<[number, number]>([lastWeek, lastDay]);
  const [shown, setShown] = React.useState<[number, number] | null>(null);
  const root = React.useRef<HTMLDivElement>(null);
  const tip = React.useRef<HTMLDivElement>(null);
  const cells = React.useRef(new Map<string, HTMLElement>());
  const key = (week: number, day: number) => `${week}:${day}`;

  // Place the tooltip over its cell, kept inside the component's edges.
  React.useLayoutEffect(() => {
    if (!shown || !root.current || !tip.current) return;
    const cell = cells.current.get(key(...shown));
    if (!cell) return;
    const box = root.current.getBoundingClientRect();
    const rect = cell.getBoundingClientRect();
    const half = tip.current.offsetWidth / 2;
    const center = rect.left - box.left + rect.width / 2;
    tip.current.style.left = `${Math.min(Math.max(center, half), box.width - half)}px`;
    tip.current.style.top = `${rect.top - box.top}px`;
  }, [shown]);

  const move = (week: number, day: number) => {
    const target = calendar.weeks[week]?.[day];
    if (!target || target.outside) return;
    setFocus([week, day]);
    setShown([week, day]);
    cells.current.get(key(week, day))?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent, week: number, day: number) => {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [week - 1, day],
      ArrowRight: [week + 1, day],
      ArrowUp: [week, day - 1],
      ArrowDown: [week, day + 1],
      Home: [0, day],
      End: [lastWeek, day],
    };
    if (moves[event.key]) {
      event.preventDefault();
      let [nextWeek, nextDay] = moves[event.key];
      // Home and End land on the nearest day inside the range.
      if (event.key === "Home") while (calendar.weeks[nextWeek]?.[nextDay]?.outside && nextWeek < lastWeek) nextWeek += 1;
      if (event.key === "End") while (calendar.weeks[nextWeek]?.[nextDay]?.outside && nextWeek > 0) nextWeek -= 1;
      move(nextWeek, nextDay);
    } else if ((event.key === "Enter" || event.key === " ") && onSelect) {
      event.preventDefault();
      onSelect(calendar.weeks[week][day]);
    }
  };

  const count = (value: number) => `${format(value)} ${unit}`;
  const active = shown ? calendar.weeks[shown[0]]?.[shown[1]] : null;

  return (
    <div
      {...props}
      ref={root}
      className={cx("ml-heatmap", className)}
      data-tone={tone}
      style={{ ["--ml-heatmap-weeks" as string]: calendar.weeks.length, ...style }}
      onPointerLeave={() => setShown(null)}
    >
      <div role="grid" aria-label={label} aria-readonly="true" className="ml-heatmap-grid">
        <div className="ml-heatmap-months" aria-hidden="true">
          {calendar.months.map((month) => (
            <span key={`${month.label}-${month.week}`} className="ml-heatmap-month" style={{ gridColumn: month.week + 2 }}>
              {month.label}
            </span>
          ))}
        </div>
        {Array.from({ length: 7 }, (_, day) => {
          const name = dayName.format(new Date(`${calendar.weeks[0][day].date}T00:00:00Z`));
          const labeled = [1, 3, 5].includes(new Date(`${calendar.weeks[0][day].date}T00:00:00Z`).getUTCDay());
          return (
            <div key={day} role="row" className="ml-heatmap-row">
              <span role="rowheader" className="ml-heatmap-weekday" style={{ gridRow: day + 2 }}>
                <span aria-hidden={!labeled || undefined} data-hidden={!labeled || undefined}>
                  {name}
                </span>
              </span>
              {calendar.weeks.map((column, week) => {
                const cell = column[day];
                const focused = focus[0] === week && focus[1] === day;
                return (
                  <span
                    key={cell.date}
                    ref={(element) => {
                      if (element) cells.current.set(key(week, day), element);
                      else cells.current.delete(key(week, day));
                    }}
                    role="gridcell"
                    className="ml-heatmap-cell"
                    data-level={cell.level}
                    data-outside={cell.outside || undefined}
                    data-active={shown?.[0] === week && shown?.[1] === day ? "" : undefined}
                    aria-label={cell.outside ? undefined : `${count(cell.count)} on ${fullDate.format(new Date(`${cell.date}T00:00:00Z`))}`}
                    aria-hidden={cell.outside || undefined}
                    tabIndex={cell.outside ? undefined : focused ? 0 : -1}
                    style={{ gridColumn: week + 2, gridRow: day + 2 }}
                    onPointerEnter={() => !cell.outside && setShown([week, day])}
                    onFocus={() => {
                      setFocus([week, day]);
                      setShown([week, day]);
                    }}
                    onBlur={() => setShown(null)}
                    onClick={() => !cell.outside && onSelect?.(cell)}
                    onKeyDown={(event) => onKeyDown(event, week, day)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      <div ref={tip} className="ml-heatmap-tooltip" role="presentation" hidden={!active}>
        {active ? (
          <>
            <strong>{active.count ? count(active.count) : `No ${unit}`}</strong>
            <span>{shortDate.format(new Date(`${active.date}T00:00:00Z`))}</span>
          </>
        ) : null}
      </div>

      {showLegend || caption !== null ? (
        <div className="ml-heatmap-footer">
          <span className="ml-heatmap-caption">{caption === undefined ? `${count(calendar.total)} over ${calendar.activeDays} active days` : caption}</span>
          {showLegend ? (
            <span className="ml-heatmap-legend" aria-hidden="true">
              Less
              {[0, 1, 2, 3, 4].map((level) => (
                <span key={level} className="ml-heatmap-cell" data-level={level} />
              ))}
              More
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
