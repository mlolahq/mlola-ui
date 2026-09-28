/**
 * Types for the shared decision functions.
 *
 * The implementation stays plain JavaScript on purpose: it must run from a
 * script tag with no build step, in ten years, without a compiler. This
 * declaration file gives TypeScript callers the same guarantees without
 * making the runtime depend on a toolchain.
 */

export interface Bounds {
  min?: number;
  max?: number;
  step?: number;
}

export interface RovingOptions {
  horizontal?: boolean;
  wrap?: boolean;
  enabled?: (index: number) => boolean;
}

export interface DisclosureOptions {
  multiple?: boolean;
  collapsible?: boolean;
}

export function clampToStep(raw: number, bounds?: Bounds): number;
export function valueFromRatio(ratio: number, bounds?: Bounds): number;
export function percentOf(value: number, bounds?: Pick<Bounds, "min" | "max">): number;
export function isSidewaysDrag(dx: number, dy: number, threshold?: number): boolean;
export function sliderValueForKey(
  key: string,
  current: number,
  bounds?: Bounds,
): number | undefined;
export function rovingIndex(
  count: number,
  index: number,
  key: string,
  options?: RovingOptions,
): number;
export function focusTrapIndex(count: number, activeIndex: number, shiftKey: boolean): number;
export function resolveDisclosure(
  open: number[],
  index: number,
  options?: DisclosureOptions,
): number[];

export interface PasswordStrengthOptions {
  /** Below this length the result is always "weak". */
  min?: number;
  /** At or above this length (with enough variety) the result is "strong". */
  strong?: number;
}

export type PasswordStrength = "empty" | "weak" | "medium" | "strong";
export function passwordStrength(
  value: string,
  options?: PasswordStrengthOptions,
): PasswordStrength;

/** Deliberately simple, non-authoritative shape check shared by every form. */
export function isEmail(value: string): boolean;

export interface RevealOptions {
  /** Steady reading rate. */
  charsPerSecond?: number;
  /** The longest a backlog may take to clear, in milliseconds. */
  catchUpMs?: number;
}
/** How much of a streamed text to show after `elapsedMs`. Fractional. */
export function revealLength(shown: number, target: number, elapsedMs: number, options?: RevealOptions): number;

export function isPinnedToEnd(scrollTop: number, scrollHeight: number, clientHeight: number, threshold?: number): boolean;

export interface ComposerKey {
  key: string;
  shiftKey?: boolean;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  isComposing?: boolean;
  keyCode?: number;
}
export type ComposerSubmitOn = "enter" | "mod-enter";
export function composerKeyAction(event: ComposerKey, options?: { submitOn?: ComposerSubmitOn }): "submit" | "newline" | null;

export function smoothLevel(previous: number, next: number, options?: { attack?: number; release?: number }): number;
export function spectrumToLevels(bins: ArrayLike<number>, count: number, options?: { floor?: number; gain?: number }): number[];

export function formatDuration(ms: number): string;
export function formatTokens(count: number): string;

export type ConfidenceBand = "low" | "medium" | "high";
export function confidenceBand(value: number, options?: { low?: number; high?: number }): ConfidenceBand;

export interface ContextSegment {
  id: string;
  label: string;
  tokens: number;
}
export interface ContextUsage<Segment extends ContextSegment = ContextSegment> {
  used: number;
  limit: number;
  remaining: number;
  ratio: number;
  level: "ok" | "warning" | "critical";
  segments: Array<Segment & { ratio: number }>;
}
export function contextUsage<Segment extends ContextSegment>(
  segments: Segment[],
  limit: number,
  options?: { warning?: number; critical?: number },
): ContextUsage<Segment>;

export type Side = "top" | "bottom" | "left" | "right";
export type Align = "start" | "center" | "end";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Placement {
  x: number;
  y: number;
  side: Side;
}

export function placeFloating(
  anchor: Rect,
  floating: { width: number; height: number },
  viewport: { width: number; height: number },
  options?: { side?: Side; align?: Align; offset?: number; padding?: number },
): Placement;

/**
 * A CSS-anchored menu's side (bottom, or top without room) and its sideways slide to stay on screen.
 * @deprecated Since 1.1.13 the dropdown menu is a floating layer placed with `placeFloating`, which escapes any
 * container that clips; `fitMenu` kept a menu on screen but not out of a clipping card. Kept for 1.x.
 */
export function fitMenu(
  anchor: Rect,
  menu: { width: number; height: number },
  viewport: { width: number; height: number },
  align?: "start" | "end",
  options?: { offset?: number; padding?: number },
): { side: Side; shift: number };

/** A CSS-anchored tooltip's side and its slide along that edge to stay on screen. */
export function fitTooltip(
  anchor: Rect,
  tip: { width: number; height: number },
  viewport: { width: number; height: number },
  side?: Side,
  options?: { offset?: number; padding?: number },
): { side: Side; shift: number };
