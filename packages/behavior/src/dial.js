/**
 * The framework-free dial, a module of its own: a page with a dial imports it
 * beside the runtime (import "@mlola-ui/behavior/dial"), and every other page
 * keeps the small core. On import it adds "dial" to the runtime's behaviors
 * and enhances the dials already on the page; observe() takes later ones.
 * Its decisions are the same functions React's Dial reads.
 */

import { behaviors, enhance } from "./index.js";
import { clampToStep, percentOf, sliderValueForKey, touchHold, valueFromRatio } from "./interaction.js";
import { dialAngle, dialArc, dialFace, dialFit, dialPositionAt, dialTurn } from "./dial-logic.js";

function on(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

export function dial(root) {
  // The round face carries role="slider"; the arc, the knob and the readout follow its value.
  const control = root.querySelector('[role="slider"]');
  if (!control) return [];
  const range = root.querySelector(".ml-dial-range");
  const readout = root.querySelector(".ml-dial-value");
  const unit = root.dataset.mlUnit ?? "";
  const disabled = root.dataset.disabled !== undefined || control.getAttribute("aria-disabled") === "true";
  const bounds = () => ({
    min: Number(control.getAttribute("aria-valuemin") ?? 0),
    max: Number(control.getAttribute("aria-valuemax") ?? 100),
    step: Number(root.dataset.mlStep ?? 1),
  });
  const current = () => Number(control.getAttribute("aria-valuenow") ?? bounds().min);
  const paint = (value) => {
    const position = percentOf(value, bounds()) / 100;
    const text = `${value}${unit}`;
    control.setAttribute("aria-valuenow", String(value));
    control.setAttribute("aria-valuetext", text);
    control.style.setProperty("--ml-dial-angle", `${dialAngle(position)}deg`);
    range?.setAttribute("d", dialArc(0, position));
    if (readout) {
      readout.textContent = text;
      // A long value shrinks to the room it has, clear of the notch on the knob's rim.
      control.style.setProperty("--ml-dial-fit", String(dialFit(readout.offsetWidth, control.offsetWidth)));
    }
  };
  const set = (raw) => {
    const next = clampToStep(raw, bounds());
    paint(next);
    root.dispatchEvent(new CustomEvent("ml-change", { detail: { value: next }, bubbles: true }));
  };
  /** The pointer's place from the center, and the knob's radius: a press on the knob turns, on the ring it jumps. */
  const measure = (event) => {
    const box = control.getBoundingClientRect();
    return { dx: event.clientX - (box.left + box.width / 2), dy: event.clientY - (box.top + box.height / 2), knob: (box.width / 2) * dialFace.knob };
  };

  let gesture = null;
  const finish = (restore) => {
    if (!gesture) return;
    const ended = gesture;
    gesture = null;
    clearTimeout(ended.timer);
    ended.cleanup.forEach((cleanup) => cleanup());
    delete control.dataset.turning;
    if (restore) set(ended.start);
  };

  paint(clampToStep(current(), bounds()));

  return [
    on(control, "pointerdown", (event) => {
      if (disabled || event.button !== 0) return;
      const touch = event.pointerType === "touch";
      const where = measure(event);
      const pointed = dialPositionAt(where.dx, where.dy, where.knob);
      const start = current();
      gesture = {
        id: event.pointerId,
        touch,
        active: !touch,
        start,
        position: pointed ?? percentOf(start, bounds()) / 100,
        last: where,
        x: event.clientX,
        y: event.clientY,
        cleanup: [
          // Escape puts the value back: marked used, ahead of a dialog that would close on it, only while turning.
          on(document, "keydown", (key) => {
            if (key.key !== "Escape" || !gesture?.active) return;
            key.preventDefault();
            key.stopPropagation();
            finish(true);
          }, true),
          // Once a finger has held, it turns the dial instead of scrolling the page.
          on(document, "touchmove", (move) => {
            if (gesture?.touch && gesture.active && move.cancelable) move.preventDefault();
          }, { passive: false }),
        ],
      };
      control.focus();
      if (touch) {
        const held = gesture;
        held.timer = setTimeout(() => {
          if (gesture !== held) return;
          held.active = true;
          control.dataset.turning = "";
        }, touchHold.delay);
        return;
      }
      control.setPointerCapture?.(event.pointerId);
      control.dataset.turning = "";
      if (pointed !== null) set(valueFromRatio(pointed, bounds()));
    }),
    on(control, "pointermove", (event) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      if (!gesture.active) {
        // A finger that moves before the hold ends is scrolling: let it go.
        if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > touchHold.slop) finish(false);
        return;
      }
      const where = measure(event);
      gesture.position = dialTurn(gesture.position, gesture.last, where);
      gesture.last = where;
      set(valueFromRatio(gesture.position, bounds()));
    }),
    on(control, "pointerup", (event) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      // A tap: a finger lifted before the hold sets the value it pointed to on the ring.
      if (gesture.touch && !gesture.active) {
        const where = measure(event);
        const pointed = dialPositionAt(where.dx, where.dy, where.knob);
        if (pointed !== null) set(valueFromRatio(pointed, bounds()));
      }
      finish(false);
    }),
    on(control, "pointercancel", () => finish(false)),
    // A long press on a phone would open the page's menu over the dial.
    on(control, "contextmenu", (event) => {
      if (gesture?.touch) event.preventDefault();
    }),
    on(control, "keydown", (event) => {
      if (disabled) return;
      const next = sliderValueForKey(event.key, current(), bounds());
      if (next === undefined) return;
      event.preventDefault();
      set(next);
    }),
    () => finish(false),
  ];
}

behaviors.dial = dial;
if (typeof document !== "undefined") enhance();
