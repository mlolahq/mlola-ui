/**
 * The decisions, with no DOM and no framework.
 *
 * A framework-free runtime mutates the DOM; React renders it from state. Those
 * two cannot share mutations without fighting over who owns the document. What
 * they can share — and must, or they drift — is the reasoning: which index a
 * key moves to, what a value snaps to, where focus goes next.
 *
 * Everything here is a pure function over numbers and plain data. It runs in a
 * browser, in Node, in a test, and it will keep running long after any
 * particular framework stops being fashionable.
 */

export * from "./interaction.js";

/**
 * A coarse password-strength hint, deliberately not authoritative. It exists so
 * React and framework-free markup show the same label for the same input, not
 * to grade a real password. Length dominates; character variety nudges it.
 */
export function passwordStrength(value, { min = 8, strong = 12 } = {}) {
  const text = typeof value === "string" ? value : "";
  if (!text) return "empty";
  const variety =
    (/[a-z]/.test(text) ? 1 : 0) +
    (/[A-Z]/.test(text) ? 1 : 0) +
    (/\d/.test(text) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(text) ? 1 : 0);
  const score = text.length + variety * 2;
  if (text.length < min) return "weak";
  if (text.length < strong || score < strong + 2) return "medium";
  return "strong";
}

/**
 * A deliberately simple email shape check, shared by every form so the rule is
 * one rule. It is not a validator: the server is the authority on deliverable
 * addresses, and rejecting a valid-but-unusual address is worse than sending.
 */
export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(typeof value === "string" ? value.trim() : "");
}

/* ── AI interfaces ────────────────────────────────────────────────────── */

/**
 * How much of a streamed text to show after `elapsedMs`.
 *
 * Models deliver text in uneven bursts: nothing for 300 ms, then forty words.
 * Rendering bursts as they land reads as stutter. The reveal instead moves at
 * a steady reading rate, and speeds up only as far as needed to clear the
 * backlog within `catchUpMs`, so a fast model is never made to look slow.
 * Returns a fractional length; callers floor it when slicing.
 */
export function revealLength(shown, target, elapsedMs, { charsPerSecond = 80, catchUpMs = 1200 } = {}) {
  const from = Math.max(0, Number.isFinite(shown) ? shown : 0);
  const to = Math.max(0, Number.isFinite(target) ? target : 0);
  if (from >= to) return to;
  const seconds = Math.max(0, elapsedMs) / 1000;
  const backlog = to - from;
  const rate = Math.max(charsPerSecond, backlog / Math.max(0.05, catchUpMs / 1000));
  return Math.min(to, from + rate * seconds);
}

/** Whether a scroller is close enough to its end to keep following new content. */
export function isPinnedToEnd(scrollTop, scrollHeight, clientHeight, threshold = 48) {
  return scrollHeight - clientHeight - scrollTop <= threshold;
}

/**
 * What a key press in a prompt composer means.
 *
 * Enter must never send while an input method is composing: the Enter that
 * commits a Japanese or Chinese word would otherwise send half a sentence.
 * `submitOn: "mod-enter"` is for composers where Enter writes a new line.
 */
export function composerKeyAction(
  { key, shiftKey = false, metaKey = false, ctrlKey = false, altKey = false, isComposing = false, keyCode } = {},
  { submitOn = "enter" } = {},
) {
  if (key !== "Enter" || isComposing || keyCode === 229) return null;
  const modifier = metaKey || ctrlKey;
  if (submitOn === "mod-enter") return modifier ? "submit" : null;
  if (shiftKey || altKey) return "newline";
  return "submit";
}

/**
 * An envelope follower for audio levels: rises fast, falls slowly, the way a
 * VU meter does, so bars look alive instead of flickering on every frame.
 */
export function smoothLevel(previous, next, { attack = 0.55, release = 0.12 } = {}) {
  const from = Number.isFinite(previous) ? previous : 0;
  const to = Math.min(1, Math.max(0, Number.isFinite(next) ? next : 0));
  const factor = to > from ? attack : release;
  return from + (to - from) * factor;
}

/**
 * Fold an FFT spectrum (0..255 per bin, as AnalyserNode gives) into `count`
 * bars. Bands widen with frequency, as hearing does, so speech fills the
 * middle of the wave instead of crowding into the first few bars.
 */
export function spectrumToLevels(bins, count, { floor = 0.02, gain = 1.4 } = {}) {
  const size = bins?.length ?? 0;
  const bars = Math.max(1, Math.floor(count));
  if (!size) return Array.from({ length: bars }, () => 0);
  // Speech lives in the lower half of the spectrum; the top is mostly hiss.
  const usable = Math.max(bars, Math.floor(size * 0.5));
  const levels = [];
  for (let bar = 0; bar < bars; bar += 1) {
    const start = Math.floor(usable * ((2 ** (bar / bars) - 1)));
    const end = Math.max(start + 1, Math.floor(usable * ((2 ** ((bar + 1) / bars) - 1))));
    let sum = 0;
    for (let index = start; index < end && index < size; index += 1) sum += bins[index];
    const average = sum / (end - start) / 255;
    levels.push(Math.min(1, Math.max(0, (average - floor) * gain)));
  }
  return levels;
}

/** A duration for people: "0.8s", "12s", "1m 04s". */
export function formatDuration(ms) {
  const value = Math.max(0, Number.isFinite(ms) ? ms : 0);
  if (value < 1000) return `${(value / 1000).toFixed(1)}s`;
  const seconds = Math.round(value / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`;
}

/** A token count for people: 812, 1.2k, 128k, 1M. */
export function formatTokens(count) {
  const value = Math.max(0, Math.round(Number.isFinite(count) ? count : 0));
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const thousands = value / 1000;
    return `${thousands < 10 ? Number(thousands.toFixed(1)) : Math.round(thousands)}k`;
  }
  const millions = value / 1_000_000;
  return `${millions < 10 ? Number(millions.toFixed(1)) : Math.round(millions)}M`;
}

/** Which band a model confidence (0..1) falls in. */
export function confidenceBand(value, { low = 0.5, high = 0.8 } = {}) {
  const confidence = Number.isFinite(value) ? value : 0;
  if (confidence < low) return "low";
  if (confidence < high) return "medium";
  return "high";
}

/**
 * How full a context window is, by segment. Levels: "ok" below `warning`,
 * "warning" below `critical`, then "critical" — the point where the next
 * long answer may not fit.
 */
export function contextUsage(segments, limit, { warning = 0.7, critical = 0.9 } = {}) {
  const capacity = Math.max(1, Number.isFinite(limit) ? limit : 1);
  const parts = (segments ?? []).map((segment) => ({
    ...segment,
    tokens: Math.max(0, Number.isFinite(segment.tokens) ? segment.tokens : 0),
  }));
  const used = parts.reduce((total, part) => total + part.tokens, 0);
  const ratio = Math.min(1, used / capacity);
  return {
    used,
    limit: capacity,
    remaining: Math.max(0, capacity - used),
    ratio,
    level: ratio >= critical ? "critical" : ratio >= warning ? "warning" : "ok",
    segments: parts.map((part) => ({ ...part, ratio: part.tokens / capacity })),
  };
}
