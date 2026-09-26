"use client";

import * as React from "react";
import { rovingIndex } from "@mlola-ui/behavior/logic";
import { IconChevronLeft, IconChevronRight } from "@mlola-ui/icons";
import { cx, useControllableState } from "../_internal/react";

export interface CarouselProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** One slide per entry. */
  items: React.ReactNode[];
  /** Accessible name for the carousel and its indicators. */
  label?: string;
  /** Accessible name per slide; defaults to “Slide N”. */
  itemLabels?: string[];
  /** Arrows wrap past the ends. Defaults to true. */
  loop?: boolean;
  /** The first visible slide. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (index: number) => void;
  /** Slides visible at once. Defaults to 1. */
  perView?: number;
  /** The narrowest a slide may get; on small screens fewer slides show instead. */
  minSlideWidth?: string;
  /** How much of the next slide peeks in, as a CSS length, hinting there is more. */
  peek?: string;
  /** Milliseconds between slides; off by default, paused on hover, focus, a hidden tab and reduced motion. */
  autoplay?: number;
  /** Dots under the slides, a counter, or nothing. */
  indicators?: "dots" | "counter" | "none";
  /** Arrows over the slide edges. Defaults to true. */
  arrows?: boolean;
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/**
 * Slides on a native scroll-snap track: swipe on touch, scroll with a
 * trackpad, or use the arrows, dots and keyboard. Several slides can show at
 * once, with the next one peeking in. Autoplay shows its progress on the
 * active dot and pauses whenever the reader is looking closer.
 */
export function Carousel({
  items,
  label = "Carousel",
  itemLabels,
  loop = true,
  value,
  defaultValue = 0,
  onValueChange,
  perView = 1,
  minSlideWidth,
  peek,
  autoplay,
  indicators = "dots",
  arrows = true,
  className,
  style,
  ...props
}: CarouselProps) {
  const count = items.length;
  const view = Math.max(1, Math.min(perView, count));
  // How many slides actually fit, which minSlideWidth can lower on narrow screens.
  const [fits, setFits] = React.useState(Math.floor(view));
  // Positions the first visible slide can take.
  const positions = Math.max(1, count - fits + 1);
  const [requested, setRequested] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const index = clamp(requested, 0, positions - 1);
  const track = React.useRef<HTMLDivElement>(null);
  const dots = React.useRef<Array<HTMLButtonElement | null>>([]);
  const scrolled = React.useRef(index);
  /** While an arrow or dot scrolls the track, passing positions are not reported. */
  const heading = React.useRef<{ target: number; until: number } | null>(null);
  const [paused, setPaused] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);

  const labelFor = (position: number) => itemLabels?.[position] ?? `Slide ${position + 1}`;

  const scrollTo = React.useCallback((target: number, smooth = true) => {
    const element = track.current;
    const slide = element?.children[target] as HTMLElement | undefined;
    if (!element || !slide) return;
    scrolled.current = target;
    heading.current = { target, until: Date.now() + 800 };
    // The track is the slides' offset parent, so offsetLeft is the scroll position.
    element.scrollTo({ left: slide.offsetLeft, behavior: smooth && !reduced ? "smooth" : "auto" });
  }, [reduced]);

  const go = (next: number) => {
    const target = loop ? ((next % positions) + positions) % positions : clamp(next, 0, positions - 1);
    setRequested(target);
    scrollTo(target);
  };

  // A value set from outside scrolls the track there.
  React.useEffect(() => {
    if (index !== scrolled.current) scrollTo(index);
  }, [index, scrollTo]);

  // The track's scroll position decides the current slide, whatever moved it.
  const onScroll = () => {
    const element = track.current;
    if (!element) return;
    const first = element.children[0] as HTMLElement | undefined;
    const second = element.children[1] as HTMLElement | undefined;
    const stride = first && second ? second.offsetLeft - first.offsetLeft : element.clientWidth;
    const at = clamp(Math.round(element.scrollLeft / Math.max(1, stride)), 0, positions - 1);
    // At the very end, the last position is current even if it cannot snap to the start.
    const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 ? positions - 1 : at;
    const flight = heading.current;
    if (flight && Date.now() < flight.until && end !== flight.target) return;
    heading.current = null;
    if (end !== scrolled.current) {
      scrolled.current = end;
      setRequested(end);
    }
  };

  React.useEffect(() => {
    const element = track.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const first = element.children[0] as HTMLElement | undefined;
      const second = element.children[1] as HTMLElement | undefined;
      if (!first) return;
      const stride = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
      setFits(Math.max(1, Math.min(count, Math.floor((element.clientWidth + 1) / Math.max(1, stride)) || 1)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [count, view, minSlideWidth]);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Autoplay: one timer per slide, stopped while paused or hidden.
  React.useEffect(() => {
    if (!autoplay || paused || reduced || positions < 2) return;
    const timer = window.setTimeout(() => {
      if (document.visibilityState === "visible") go(index + 1);
    }, autoplay);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, paused, reduced, index, positions]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      go(index + (event.key === "ArrowRight" ? 1 : -1));
    }
  };

  const onDotKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = rovingIndex(positions, index, event.key, { horizontal: true, wrap: loop });
    if (target < 0) return;
    event.preventDefault();
    go(target);
    dots.current[target]?.focus();
  };

  if (count === 0) return null;

  const atStart = !loop && index === 0;
  const atEnd = !loop && index === positions - 1;
  const playing = Boolean(autoplay) && !paused && !reduced && positions > 1;

  return (
    <div
      {...props}
      className={cx("ml-carousel", className)}
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      data-playing={playing || undefined}
      style={{ ...style, "--ml-carousel-per-view": view, "--ml-carousel-peek": peek ?? "0px", "--ml-carousel-min": minSlideWidth ?? "0px", "--ml-carousel-autoplay": `${autoplay ?? 0}ms` } as React.CSSProperties}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setPaused(false);
      }}
    >
      <div className="ml-carousel-viewport">
        <div ref={track} className="ml-carousel-track" tabIndex={0} aria-label={`${label}, use the arrow keys`} onScroll={onScroll} onKeyDown={onKeyDown}>
          {items.map((item, position) => (
            <div
              key={position}
              className="ml-carousel-slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${position + 1} of ${count}: ${labelFor(position)}`}
              data-current={(position >= index && position < index + fits) || undefined}
            >
              {item}
            </div>
          ))}
        </div>
        {arrows && positions > 1 ? (
          <>
            <button type="button" className="ml-carousel-arrow" data-side="previous" aria-label="Previous slide" disabled={atStart} onClick={() => go(index - 1)}>
              <IconChevronLeft aria-hidden="true" size="1.1em" />
            </button>
            <button type="button" className="ml-carousel-arrow" data-side="next" aria-label="Next slide" disabled={atEnd} onClick={() => go(index + 1)}>
              <IconChevronRight aria-hidden="true" size="1.1em" />
            </button>
          </>
        ) : null}
      </div>

      {indicators === "dots" && positions > 1 ? (
        <div className="ml-carousel-dots" role="group" aria-label={`Choose ${label.toLowerCase()}`} onKeyDown={onDotKeyDown}>
          {Array.from({ length: positions }, (_, position) => {
            const active = position === index;
            return (
              <button
                key={position}
                ref={(node) => {
                  dots.current[position] = node;
                }}
                type="button"
                className="ml-carousel-dot"
                data-hit="expand"
                aria-current={active ? "true" : undefined}
                aria-label={labelFor(position)}
                tabIndex={active ? 0 : -1}
                onClick={() => go(position)}
              >
                {/* Keyed by index so the autoplay fill restarts on every slide. */}
                {active && playing ? <span key={index} className="ml-carousel-dot-fill" /> : null}
              </button>
            );
          })}
        </div>
      ) : indicators === "counter" ? (
        <p className="ml-carousel-counter" aria-live="polite">
          {index + 1} / {positions}
        </p>
      ) : null}
    </div>
  );
}
