/**
 * Calendar dates as ISO strings (YYYY-MM-DD) in UTC arithmetic: no time of
 * day, no time zone drift, so "the 1st" is the 1st wherever the reader is.
 */
export type ISODate = string;

const DAY = 86_400_000;
const pad = (value: number) => String(value).padStart(2, "0");

export const toTime = (date: ISODate) => Date.parse(`${date}T00:00:00Z`);
export const fromTime = (time: number): ISODate => new Date(time).toISOString().slice(0, 10);

/** Today in the reader's own calendar, not UTC's. */
export function today(now = new Date()): ISODate {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const addDays = (date: ISODate, days: number) => fromTime(toTime(date) + days * DAY);

/** Months later or earlier, keeping the day where the month allows (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(date: ISODate, months: number): ISODate {
  const [year, month, day] = date.split("-").map(Number);
  const index = year * 12 + (month - 1) + months;
  const nextYear = Math.floor(index / 12);
  const nextMonth = index - nextYear * 12;
  const last = new Date(Date.UTC(nextYear, nextMonth + 1, 0)).getUTCDate();
  return `${nextYear}-${pad(nextMonth + 1)}-${pad(Math.min(day, last))}`;
}

export const startOfMonth = (date: ISODate): ISODate => `${date.slice(0, 7)}-01`;
export const sameMonth = (a: ISODate, b: ISODate) => a.slice(0, 7) === b.slice(0, 7);
export const weekday = (date: ISODate) => new Date(toTime(date)).getUTCDay();

export function startOfWeek(date: ISODate, weekStart: 0 | 1 = 1): ISODate {
  return addDays(date, -((weekday(date) - weekStart + 7) % 7));
}

export const endOfWeek = (date: ISODate, weekStart: 0 | 1 = 1) => addDays(startOfWeek(date, weekStart), 6);

export const compare = (a: ISODate, b: ISODate) => (a < b ? -1 : a > b ? 1 : 0);

/** Inclusive, in either order. */
export function isBetween(date: ISODate, a: ISODate, b: ISODate) {
  const [low, high] = a <= b ? [a, b] : [b, a];
  return date >= low && date <= high;
}

export const daysBetween = (a: ISODate, b: ISODate) => Math.round((toTime(b) - toTime(a)) / DAY);

/**
 * Six weeks for the month of `date`, so the grid never changes height as the
 * reader pages through months.
 */
export function monthGrid(date: ISODate, weekStart: 0 | 1 = 1): Array<Array<{ date: ISODate; inMonth: boolean }>> {
  const first = startOfMonth(date);
  const start = startOfWeek(first, weekStart);
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const cell = addDays(start, week * 7 + day);
      return { date: cell, inMonth: sameMonth(cell, first) };
    }),
  );
}

/** Clamp a date into [min, max] where given. */
export function clampDate(date: ISODate, min?: ISODate, max?: ISODate): ISODate {
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}

export function isValidISODate(value: string): value is ISODate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return fromTime(toTime(value)) === value;
}

/**
 * Which dates a rule covers: one date, an inclusive range, everything before
 * or after a date, days of the week (0 is Sunday), or a function.
 */
export type DateMatcher =
  | ISODate
  | { from: ISODate; to: ISODate }
  | { before: ISODate }
  | { after: ISODate }
  | { dayOfWeek: number[] }
  | ((date: ISODate) => boolean);
export type DateMatchers = DateMatcher | DateMatcher[];

export function matchesDate(date: ISODate, matchers?: DateMatchers): boolean {
  if (matchers === undefined) return false;
  const list = Array.isArray(matchers) ? matchers : [matchers];
  return list.some((matcher) => {
    if (typeof matcher === "function") return matcher(date);
    if (typeof matcher === "string") return matcher === date;
    if ("from" in matcher) return isBetween(date, matcher.from, matcher.to);
    if ("before" in matcher) return date < matcher.before;
    if ("after" in matcher) return date > matcher.after;
    return matcher.dayOfWeek.includes(weekday(date));
  });
}

export interface DateRules {
  min?: ISODate;
  max?: ISODate;
  /** Dates that cannot be picked. */
  disabled?: DateMatchers;
  /** When given, only these dates can be picked (min, max and disabled still apply). */
  enabled?: DateMatchers;
}

export function isDateBlocked(date: ISODate, rules: DateRules) {
  return Boolean(
    (rules.min && date < rules.min) ||
      (rules.max && date > rules.max) ||
      matchesDate(date, rules.disabled) ||
      (rules.enabled !== undefined && !matchesDate(date, rules.enabled)),
  );
}

export interface RangeRules {
  /** Shortest range, in days counted inclusively (the 1st to the 3rd is 3 days). */
  minDays?: number;
  /** Longest range, in days counted inclusively. */
  maxDays?: number;
  /** Let a range pass over blocked dates; its two ends must still be free. */
  allowBlockedInside?: boolean;
}

export type RangeProblem = "blocked" | "too-short" | "too-long";

/** Why a range cannot be chosen, or null when it can. */
export function rangeProblem(from: ISODate, to: ISODate, blocked: (date: ISODate) => boolean, rules: RangeRules = {}): RangeProblem | null {
  const [low, high] = from <= to ? [from, to] : [to, from];
  if (blocked(low) || blocked(high)) return "blocked";
  const days = daysBetween(low, high) + 1;
  if (rules.minDays && days < rules.minDays) return "too-short";
  if (rules.maxDays && days > rules.maxDays) return "too-long";
  if (!rules.allowBlockedInside) for (let date = addDays(low, 1); date < high; date = addDays(date, 1)) if (blocked(date)) return "blocked";
  return null;
}

/**
 * How far a range starting at `from` can reach each way: up to the first
 * blocked date (unless ranges may pass over them) and never past maxDays.
 * Scans at most `limit` days in each direction.
 */
export function rangeReach(from: ISODate, blocked: (date: ISODate) => boolean, rules: RangeRules = {}, limit = 731) {
  const span = rules.maxDays ? rules.maxDays - 1 : limit;
  let low = from;
  let high = from;
  for (let step = 1; step <= span; step++) {
    const date = addDays(from, -step);
    if (!rules.allowBlockedInside && blocked(date)) break;
    low = date;
  }
  for (let step = 1; step <= span; step++) {
    const date = addDays(from, step);
    if (!rules.allowBlockedInside && blocked(date)) break;
    high = date;
  }
  return { low, high };
}
