/**
 * The calendar behind an activity heatmap: whole weeks as columns ending on
 * `end`, a level per day, and where each month's label goes. Levels come from
 * quantiles of the active days, so one extreme day cannot wash every other
 * day out to the palest shade.
 */
export interface DayCount {
  /** YYYY-MM-DD */
  date: string;
  count: number;
}

export interface HeatCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  /** Outside the requested range (padding in the first or last week). */
  outside: boolean;
}

export interface HeatCalendar {
  weeks: HeatCell[][];
  /** Month labels with the week column they start in. */
  months: Array<{ label: string; week: number }>;
  total: number;
  activeDays: number;
  max: number;
}

const DAY = 86_400_000;
const iso = (time: number) => new Date(time).toISOString().slice(0, 10);
const utc = (date: string) => Date.parse(`${date}T00:00:00Z`);

/** Thresholds splitting non-zero counts into four equal-sized groups. */
export function quantileThresholds(counts: number[]): [number, number, number] {
  const active = counts.filter((count) => count > 0).sort((a, b) => a - b);
  if (!active.length) return [1, 1, 1];
  const at = (fraction: number) => active[Math.min(active.length - 1, Math.floor(fraction * active.length))];
  return [at(0.25), at(0.5), at(0.75)];
}

export function levelFor(count: number, [q1, q2, q3]: [number, number, number]): HeatCell["level"] {
  if (count <= 0) return 0;
  if (count <= q1) return 1;
  if (count <= q2) return 2;
  if (count <= q3) return 3;
  return 4;
}

export function buildCalendar(
  data: DayCount[],
  { end, weeks = 26, weekStart = 1, locale = "en" }: { end: string; weeks?: number; weekStart?: 0 | 1; locale?: string },
): HeatCalendar {
  const counts = new Map(data.map((day) => [day.date, day.count]));
  const endTime = utc(end);
  const endWeekday = (new Date(endTime).getUTCDay() - weekStart + 7) % 7;
  const lastColumnEnd = endTime + (6 - endWeekday) * DAY;
  const firstDay = lastColumnEnd - (weeks * 7 - 1) * DAY;
  const rangeStart = endTime - (weeks * 7 - 1 - (6 - endWeekday)) * DAY;
  const inRange = data.filter((day) => utc(day.date) >= rangeStart && utc(day.date) <= endTime).map((day) => day.count);
  const thresholds = quantileThresholds(inRange);
  const format = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });

  const columns: HeatCell[][] = [];
  const months: HeatCalendar["months"] = [];
  let lastMonth = -1;
  for (let week = 0; week < weeks; week += 1) {
    const column: HeatCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      const time = firstDay + (week * 7 + day) * DAY;
      const date = iso(time);
      const count = counts.get(date) ?? 0;
      const outside = time > endTime || time < rangeStart;
      column.push({ date, count: outside ? 0 : count, level: outside ? 0 : levelFor(count, thresholds), outside });
    }
    const month = new Date(firstDay + week * 7 * DAY).getUTCMonth();
    if (month !== lastMonth) {
      // Skip a label squeezed into the very first column by a partial month.
      if (week > 0 || new Date(firstDay).getUTCDate() <= 7) months.push({ label: format.format(new Date(firstDay + week * 7 * DAY)), week });
      lastMonth = month;
    }
    columns.push(column);
  }
  const active = columns.flat().filter((cell) => !cell.outside && cell.count > 0);
  return {
    weeks: columns,
    months,
    total: active.reduce((sum, cell) => sum + cell.count, 0),
    activeDays: active.length,
    max: active.reduce((max, cell) => Math.max(max, cell.count), 0),
  };
}
