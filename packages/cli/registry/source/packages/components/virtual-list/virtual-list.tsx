"use client";

import * as React from "react";
import { cx } from "../_internal/react";
import { offsetsOf, visibleRange } from "./virtual";

export { offsetsOf, rowAt, visibleRange } from "./virtual";

export interface VirtualListProps {
  count: number;
  /** One row. Rows may differ in height; each is measured once rendered. */
  renderItem: (index: number) => React.ReactNode;
  /** A guess for rows not yet measured, in pixels. */
  estimateSize?: number;
  /** A stable key per row; the index by default. */
  getKey?: (index: number) => React.Key;
  /** Height of the scrolling area: a CSS length, or fill the parent by default. */
  height?: string | number;
  overscan?: number;
  /** Called when the reader nears the end, to load more. */
  onEndReached?: () => void;
  /** How near, in pixels. */
  endThreshold?: number;
  label?: string;
  className?: string;
}

/**
 * A list that renders only the rows on screen, so ten thousand rows scroll
 * like ten. Rows may have any height; each is measured as it appears, and the
 * list keeps its place while measurements arrive. Pair `onEndReached` with a
 * growing `count` for infinite loading.
 */
export function VirtualList({ count, renderItem, estimateSize = 44, getKey, height = "100%", overscan = 6, onEndReached, endThreshold = 400, label, className }: VirtualListProps) {
  const scroller = React.useRef<HTMLDivElement>(null);
  const sizes = React.useRef(new Map<number, number>());
  const [version, setVersion] = React.useState(0);
  const [view, setView] = React.useState({ top: 0, height: 600 });
  const ended = React.useRef(-1);

  const offsets = React.useMemo(() => offsetsOf(count, (index) => sizes.current.get(index) ?? estimateSize), [count, estimateSize, version]);
  const { start, end } = visibleRange(offsets, view.top, view.height, overscan);

  React.useLayoutEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const update = () => setView({ top: element.scrollTop, height: element.clientHeight });
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(element);
    return () => observer?.disconnect();
  }, []);

  // One observer measures every rendered row; a change re-lays the list out.
  const measurer = React.useMemo(
    () =>
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver((entries) => {
            let changed = false;
            for (const entry of entries) {
              const index = Number((entry.target as HTMLElement).dataset.index);
              const size = Math.round(entry.borderBoxSize?.[0]?.blockSize ?? (entry.target as HTMLElement).offsetHeight);
              if (sizes.current.get(index) !== size) {
                sizes.current.set(index, size);
                changed = true;
              }
            }
            if (changed) setVersion((current) => current + 1);
          }),
    [],
  );
  React.useEffect(() => () => measurer?.disconnect(), [measurer]);

  React.useEffect(() => {
    if (!onEndReached || !count) return;
    const bottom = view.top + view.height;
    if (offsets[count] - bottom < endThreshold && ended.current !== count) {
      ended.current = count;
      onEndReached();
    }
  }, [view, offsets, count, onEndReached, endThreshold]);

  const rows: React.ReactNode[] = [];
  for (let index = start; index <= end; index++) {
    rows.push(
      <div
        key={getKey?.(index) ?? index}
        className="ml-virtual-list-row"
        data-index={index}
        role="listitem"
        aria-setsize={count}
        aria-posinset={index + 1}
        style={{ transform: `translateY(${offsets[index]}px)` }}
        ref={(element) => {
          if (!element || !measurer) return;
          measurer.observe(element);
          return () => measurer.unobserve(element);
        }}
      >
        {renderItem(index)}
      </div>,
    );
  }

  return (
    <div
      ref={scroller}
      className={cx("ml-virtual-list", className)}
      style={{ height }}
      role="list"
      aria-label={label}
      tabIndex={0}
      onScroll={(event) => setView({ top: event.currentTarget.scrollTop, height: event.currentTarget.clientHeight })}
    >
      <div className="ml-virtual-list-space" style={{ height: offsets[count] }}>
        {rows}
      </div>
    </div>
  );
}
