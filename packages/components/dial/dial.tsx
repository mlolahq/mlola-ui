"use client";

import * as React from "react";
import { clampToStep, dialAngle, dialArc, dialFace, dialFit, dialPositionAt, dialTicks, dialTurn, percentOf, sliderValueForKey, touchHold, valueFromRatio } from "@mlola-ui/behavior/logic";
import { cx, useControllableState } from "../_internal/react";
import { FieldValue, type FormControlProps } from "../input/input";

type DialSize = "sm" | "md" | "lg";
type DialTone = "primary" | "info" | "success" | "warning" | "danger";

interface DialProps extends Omit<FormControlProps, "required"> {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: React.ReactNode;
  /** How the value reads, in the dial and to a screen reader: (21.5) => "21.5 °C". */
  format?: (value: number) => string;
  /** A line under the value inside the dial: "Heating to 21 °C". */
  caption?: React.ReactNode;
  size?: DialSize;
  /** The arc's color, as the shared vocabulary names it. */
  tone?: DialTone;
  className?: string;
}

/** The knob fills the circle inside the arc: a press there turns it, a press on the ring sets the value it points to. */
const KNOB = dialFace.knob;

/** The scale of the instrument, drawn once. */
const TICKS = dialTicks();

interface Gesture {
  id: number;
  touch: boolean;
  /** A finger has held still long enough to take the dial from the page's scroll. */
  active: boolean;
  /** The value when the gesture began, for Escape to put back. */
  start: number;
  /** The unrounded position between moves, so small turns add up. */
  position: number;
  /** Where the pointer was last, from the center. */
  last: { dx: number; dy: number };
  /** Where the finger first touched, in the window, to tell a hold from a scroll. */
  x: number;
  y: number;
  timer?: number;
}

/**
 * A value chosen by turning a knob: a thermostat, a fan's speed, a timer.
 * A press on the ring sets the value it points to; a press on the knob turns
 * it from where it is, and a turn past an end stops there. A finger holds
 * still for a moment before it turns the dial, so a finger scrolling past it
 * scrolls the page; a tap on the ring sets the value. Escape during a turn
 * puts the value back. The keys are a slider's: arrows step, Page keys take
 * large steps, Home and End go to the ends.
 */
const Dial = React.forwardRef<HTMLDivElement, DialProps>(
  ({ value, defaultValue, onValueChange, min = 0, max = 100, step = 1, disabled = false, label, format, caption, size = "md", tone = "primary", className, id, name, form, "aria-label": ariaLabel, "aria-labelledby": labelledBy, "aria-describedby": describedBy }, ref) => {
    const low = Number.isFinite(min) ? min : 0;
    const high = Number.isFinite(max) && max > low ? max : low + 100;
    const increment = Number.isFinite(step) && step > 0 ? step : 1;
    // Shared with the framework-free runtime, so both round and turn identically.
    const bounds = React.useMemo(() => ({ min: low, max: high, step: increment }), [low, high, increment]);
    const normalize = React.useCallback((raw: number) => clampToStep(raw, bounds), [bounds]);
    const [currentRaw, setCurrent] = useControllableState({ value, defaultValue: normalize(defaultValue ?? (low + high) / 2), onChange: onValueChange });
    const current = normalize(currentRaw);
    const [turning, setTurning] = React.useState(false);
    const control = React.useRef<HTMLDivElement | null>(null);
    const gesture = React.useRef<Gesture | null>(null);
    const generated = React.useId();
    const dialId = id ?? generated;
    const labelId = label ? `${dialId}-label` : undefined;
    const captionId = caption ? `${dialId}-caption` : undefined;
    const position = percentOf(current, bounds) / 100;
    const text = format ? format(current) : String(current);

    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        control.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    // A long value, or a wide typeface, would reach the notch on the knob's
    // rim: the readout shrinks to the room it has. Measured after layout and
    // again when the text's size changes (a web font arriving).
    const readout = React.useRef<HTMLSpanElement | null>(null);
    React.useLayoutEffect(() => {
      const value = readout.current;
      const dial = control.current;
      if (!value || !dial) return;
      const fit = () => dial.style.setProperty("--ml-dial-fit", String(dialFit(value.offsetWidth, dial.offsetWidth)));
      fit();
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(fit);
      observer.observe(value);
      observer.observe(dial);
      return () => observer.disconnect();
    }, [text, size]);

    /** The pointer's place from the dial's center, and the knob's radius, in pixels. */
    const measure = (clientX: number, clientY: number) => {
      const box = control.current!.getBoundingClientRect();
      return { dx: clientX - (box.left + box.width / 2), dy: clientY - (box.top + box.height / 2), knob: (box.width / 2) * KNOB };
    };

    // Window listeners for one gesture: Escape (in the capture phase, ahead of
    // a dialog that would close on it) and a finger's moves once it has hold.
    const listeners = React.useRef<{ key: (event: KeyboardEvent) => void; touchMove: (event: TouchEvent) => void } | null>(null);

    /**
     * Let go of the gesture: its timer and its window listeners. It reads refs
     * only, so it is the same function on every render. Tied to a callback, it
     * would run whenever a parent passed a new `onValueChange` (an inline
     * arrow does, on every render) and end the turn after its first step.
     */
    const release = React.useCallback(() => {
      const entry = gesture.current;
      gesture.current = null;
      if (!entry) return null;
      window.clearTimeout(entry.timer);
      if (listeners.current) {
        window.removeEventListener("keydown", listeners.current.key, true);
        window.removeEventListener("touchmove", listeners.current.touchMove);
        listeners.current = null;
      }
      return entry;
    }, []);

    const end = (restore: boolean) => {
      const entry = release();
      if (!entry) return;
      setTurning(false);
      if (restore) setCurrent(entry.start);
    };

    // Leaving the page mid-turn leaves no listener behind.
    React.useEffect(
      () => () => {
        release();
      },
      [release],
    );

    const begin = (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || event.button !== 0) return;
      const touch = event.pointerType === "touch";
      const where = measure(event.clientX, event.clientY);
      const pointed = dialPositionAt(where.dx, where.dy, where.knob);
      const entry: Gesture = { id: event.pointerId, touch, active: !touch, start: current, position: pointed ?? position, last: { dx: where.dx, dy: where.dy }, x: event.clientX, y: event.clientY };
      gesture.current = entry;
      const key = (keyEvent: KeyboardEvent) => {
        if (keyEvent.key !== "Escape" || !gesture.current?.active) return;
        keyEvent.preventDefault();
        keyEvent.stopPropagation();
        end(true);
      };
      // Once a finger has held, it turns the dial instead of scrolling the page.
      const touchMove = (touchEvent: TouchEvent) => {
        if (gesture.current?.touch && gesture.current.active && touchEvent.cancelable) touchEvent.preventDefault();
      };
      listeners.current = { key, touchMove };
      window.addEventListener("keydown", key, true);
      window.addEventListener("touchmove", touchMove, { passive: false });
      if (touch) {
        entry.timer = window.setTimeout(() => {
          if (gesture.current !== entry) return;
          entry.active = true;
          setTurning(true);
        }, touchHold.delay);
        return;
      }
      event.currentTarget.setPointerCapture(event.pointerId);
      setTurning(true);
      if (pointed !== null) setCurrent(valueFromRatio(pointed, bounds));
    };

    const move = (event: React.PointerEvent<HTMLDivElement>) => {
      const entry = gesture.current;
      if (!entry || entry.id !== event.pointerId) return;
      if (!entry.active) {
        // A finger that moves before the hold ends is scrolling: let it go.
        if (Math.hypot(event.clientX - entry.x, event.clientY - entry.y) > touchHold.slop) end(false);
        return;
      }
      const where = measure(event.clientX, event.clientY);
      entry.position = dialTurn(entry.position, entry.last, where);
      entry.last = { dx: where.dx, dy: where.dy };
      setCurrent(valueFromRatio(entry.position, bounds));
    };

    const finish = (event: React.PointerEvent<HTMLDivElement>) => {
      const entry = gesture.current;
      if (!entry || entry.id !== event.pointerId) return;
      // A tap: a finger lifted before the hold, without moving, sets the value it pointed to on the ring.
      if (entry.touch && !entry.active) {
        const where = measure(event.clientX, event.clientY);
        const pointed = dialPositionAt(where.dx, where.dy, where.knob);
        if (pointed !== null) setCurrent(valueFromRatio(pointed, bounds));
      }
      end(false);
    };

    return (
      <div className={cx("ml-dial-field", className)} data-size={size} data-tone={tone} data-disabled={disabled ? "" : undefined}>
        {label ? (
          <span id={labelId} className="ml-dial-label">
            {label}
          </span>
        ) : null}
        <div
          ref={setRef}
          id={dialId}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={low}
          aria-valuemax={high}
          aria-valuenow={current}
          aria-valuetext={text}
          aria-labelledby={labelledBy ?? labelId}
          aria-label={labelledBy || label ? undefined : (ariaLabel ?? "Value")}
          aria-describedby={[describedBy, captionId].filter(Boolean).join(" ") || undefined}
          aria-disabled={disabled || undefined}
          data-turning={turning ? "" : undefined}
          className="ml-dial"
          style={{ "--ml-dial-angle": `${dialAngle(position)}deg` } as React.CSSProperties}
          onKeyDown={(event) => {
            if (disabled) return;
            const next = sliderValueForKey(event.key, current, bounds);
            if (next === undefined) return;
            event.preventDefault();
            setCurrent(next);
          }}
          onPointerDown={begin}
          onPointerMove={move}
          onPointerUp={finish}
          onPointerCancel={() => end(false)}
          onLostPointerCapture={(event) => {
            if (gesture.current?.id === event.pointerId && !gesture.current.touch) end(false);
          }}
          // A long press on a phone would open the page's menu over the dial.
          onContextMenu={(event) => {
            if (gesture.current?.touch) event.preventDefault();
          }}
        >
          <svg className="ml-dial-arc" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
            <path className="ml-dial-ticks" d={TICKS} />
            <path className="ml-dial-track" d={dialArc(0, 1)} />
            <path className="ml-dial-range" d={dialArc(0, position)} />
          </svg>
          <span className="ml-dial-knob" aria-hidden="true" />
          <span className="ml-dial-readout" aria-hidden="true">
            <span ref={readout} className="ml-dial-value">
              {text}
            </span>
          </span>
        </div>
        {caption ? (
          <span id={captionId} className="ml-dial-caption">
            {caption}
          </span>
        ) : null}
        <FieldValue name={name} form={form} value={String(current)} disabled={disabled} />
      </div>
    );
  },
);
Dial.displayName = "Dial";

export { Dial };
export type { DialProps, DialSize, DialTone };
