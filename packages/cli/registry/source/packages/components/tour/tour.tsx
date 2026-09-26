"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { IconX } from "@mlola-ui/icons";
import { cx } from "../_internal/react";
import { usePortalNode, type Side } from "../_internal/floating";
import { placeFloating } from "../_internal/anchor";

export interface TourStep {
  /** A CSS selector or a ref for the element to point at; none shows the card centered. */
  target?: string | React.RefObject<HTMLElement | null>;
  title: string;
  body?: React.ReactNode;
  side?: Side;
}

export interface TourProps {
  steps: TourStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step?: number;
  defaultStep?: number;
  onStepChange?: (step: number) => void;
  /** Called when the reader reaches the end, not when they skip. */
  onFinish?: () => void;
  label?: string;
  className?: string;
}

const PAD = 6;

function resolve(target: TourStep["target"]) {
  if (!target) return null;
  if (typeof target === "string") return typeof document === "undefined" ? null : document.querySelector<HTMLElement>(target);
  return target.current;
}

/**
 * A guided tour: the page dims, a spotlight opens on one element at a time,
 * and a card beside it explains what it is for. Back, Next and the arrow
 * keys move through the steps; Escape or Skip ends it. Each step scrolls its
 * element into view and follows it as the page moves.
 */
export function Tour({ steps, open, onOpenChange, step: stepProp, defaultStep = 0, onStepChange, onFinish, label = "Tour", className }: TourProps) {
  const portal = usePortalNode();
  const [inner, setInner] = React.useState(defaultStep);
  const index = Math.min(steps.length - 1, Math.max(0, stepProp ?? inner));
  const setIndex = (next: number) => {
    if (stepProp === undefined) setInner(next);
    onStepChange?.(next);
  };
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const card = React.useRef<HTMLDivElement>(null);
  const titleId = React.useId();
  const current = steps[index];

  // Place the card beside the spotlight whenever the target moves; center it when there is none.
  React.useLayoutEffect(() => {
    const element = card.current;
    if (!element) return;
    if (!rect) {
      element.style.left = "";
      element.style.top = "";
      return;
    }
    const place = placeFloating(
      { x: rect.left - PAD, y: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 },
      { width: element.offsetWidth, height: element.offsetHeight },
      { width: window.innerWidth, height: window.innerHeight },
      { side: current?.side ?? "bottom", align: "center", offset: 14 },
    );
    element.style.left = `${place.x}px`;
    element.style.top = `${place.y}px`;
  });

  // Bring the step's element into view, then keep the spotlight on it.
  React.useEffect(() => {
    if (!open) return;
    const element = resolve(current?.target);
    if (!element) {
      setRect(null);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollIntoView({ block: "center", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setRect(element.getBoundingClientRect()));
    };
    measure();
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [open, index, current?.target]);

  React.useEffect(() => {
    if (open) requestAnimationFrame(() => card.current?.focus({ preventScroll: true }));
  }, [open, index]);

  const finish = () => {
    onOpenChange(false);
    onFinish?.();
  };
  const next = () => (index === steps.length - 1 ? finish() : setIndex(index + 1));
  const back = () => index > 0 && setIndex(index - 1);

  if (!open || !portal || !current) return null;

  return createPortal(
    <div className={cx("ml-tour", className)}>
      <div className="ml-tour-scrim" data-spotlight={rect ? "" : undefined} aria-hidden="true" />
      {rect ? (
        <div
          className="ml-tour-spotlight"
          aria-hidden="true"
          style={{ left: rect.left - PAD, top: rect.top - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }}
        />
      ) : null}
      <div
        ref={card}
        className="ml-tour-card"
        data-centered={rect ? undefined : ""}
        role="dialog"
        aria-modal="true"
        aria-label={`${label}: step ${index + 1} of ${steps.length}`}
        aria-describedby={titleId}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onOpenChange(false);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            next();
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            back();
          } else if (event.key === "Tab") {
            // Focus stays in the card while the tour is open.
            const focusable = [...(card.current?.querySelectorAll<HTMLElement>("button") ?? [])];
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <div className="ml-tour-head">
          <span className="ml-tour-count">
            {index + 1} of {steps.length}
          </span>
          <button type="button" className="ml-tour-skip" aria-label="End the tour" onClick={() => onOpenChange(false)}>
            <IconX aria-hidden="true" size="0.95em" />
          </button>
        </div>
        <h2 id={titleId} className="ml-tour-title">
          {current.title}
        </h2>
        {current.body ? <div className="ml-tour-body">{current.body}</div> : null}
        <div className="ml-tour-foot">
          <span className="ml-tour-dots" aria-hidden="true">
            {steps.map((_, position) => (
              <span key={position} className="ml-tour-dot" data-active={position === index || undefined} />
            ))}
          </span>
          {index > 0 ? (
            <button type="button" className="ml-tour-button" onClick={back}>
              Back
            </button>
          ) : null}
          <button type="button" className="ml-tour-button" data-primary="" onClick={next}>
            {index === steps.length - 1 ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>,
    portal,
  );
}
