/**
 * Times of day as minutes since midnight, and the rules that allow or refuse
 * them. Every range is half-open, [from, to): "12:00-13:00" covers 12:00 to
 * 12:59, so a lunch break ends when 13:00 becomes free again, and opening
 * hours "09:00-17:00" offer a last start at 16:59.
 */
export type TimeMatcher = string | { from: string; to: string } | ((time: string) => boolean);
export type TimeMatchers = TimeMatcher | TimeMatcher[];

const pad = (value: number) => String(value).padStart(2, "0");

export const toMinutes = (value: string | null | undefined) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

export const fromMinutes = (total: number) => `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;

function inRange(minutes: number, from: string, to: string) {
  const start = toMinutes(from);
  const end = toMinutes(to);
  if (start === null || end === null) return false;
  // A range that ends before it starts runs past midnight, like "22:00-06:00".
  return start <= end ? minutes >= start && minutes < end : minutes >= start || minutes < end;
}

export function matchesTime(minutes: number, matchers?: TimeMatchers): boolean {
  if (matchers === undefined) return false;
  const list = Array.isArray(matchers) ? matchers : [matchers];
  const time = fromMinutes(minutes);
  return list.some((matcher) => {
    if (typeof matcher === "function") return matcher(time);
    if (typeof matcher === "string") {
      const [from, to] = matcher.split("-").map((part) => part.trim());
      return to ? inRange(minutes, from, to) : toMinutes(from) === minutes;
    }
    return inRange(minutes, matcher.from, matcher.to);
  });
}

export interface TimeRules {
  min?: string;
  max?: string;
  disabled?: TimeMatchers;
  /** When given, only these times can be picked (min, max and disabled still apply). */
  enabled?: TimeMatchers;
}

export function isTimeAllowed(minutes: number, rules: TimeRules) {
  const low = toMinutes(rules.min) ?? 0;
  const high = toMinutes(rules.max) ?? 1439;
  return minutes >= low && minutes <= high && !matchesTime(minutes, rules.disabled) && (rules.enabled === undefined || matchesTime(minutes, rules.enabled));
}

/** The first allowed time from `start` moving by `step` minutes in `direction`, wrapping at midnight. */
export function nextAllowed(start: number, direction: 1 | -1, step: number, rules: TimeRules): number | null {
  const size = Math.max(1, step);
  for (let moved = 0; moved < 1440; moved += size) {
    const minutes = (((start + direction * moved) % 1440) + 1440) % 1440;
    if (isTimeAllowed(minutes, rules)) return minutes;
  }
  // Nothing on the step grid: fall back to minute by minute.
  if (size > 1) return nextAllowed(start, direction, 1, rules);
  return null;
}

/** The allowed time closest to `minutes`; on a tie, the later one. */
export function nearestAllowed(minutes: number, rules: TimeRules): number | null {
  if (isTimeAllowed(minutes, rules)) return minutes;
  for (let distance = 1; distance < 1440; distance++) {
    if (minutes + distance <= 1439 && isTimeAllowed(minutes + distance, rules)) return minutes + distance;
    if (minutes - distance >= 0 && isTimeAllowed(minutes - distance, rules)) return minutes - distance;
  }
  return null;
}
