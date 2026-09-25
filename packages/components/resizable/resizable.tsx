"use client";

import * as React from "react";
import { cx, useControllableState } from "../_internal/react";

export interface ResizableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  first: React.ReactNode;
  second: React.ReactNode;
  /** "horizontal" puts the panes side by side. */
  direction?: "horizontal" | "vertical";
  /** Which pane holds the size; the other takes the rest. A right-hand inspector anchors "second". */
  anchor?: "first" | "second";
  /** "percent" of the whole, or "pixels" for panes that should keep their width as the window grows. */
  units?: "percent" | "pixels";
  /** Size of the anchored pane. */
  size?: number;
  defaultSize?: number;
  onSizeChange?: (size: number) => void;
  min?: number;
  max?: number;
  /** Let the anchored pane collapse: drag it past its minimum, press Enter on the handle, or set `collapsed`. */
  collapsible?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Remember the size and collapsed state in this browser under this key. */
  storageKey?: string;
  /** The separator's accessible name. */
  label?: string;
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

function readStored(key: string | undefined): { size?: number; collapsed?: boolean } {
  if (!key) return {};
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? "{}") as { size?: number; collapsed?: boolean };
  } catch {
    return {};
  }
}

/**
 * Two panes and a handle between them. Drag it, or focus it and use the
 * arrow keys (Home and End jump to the limits); double-click restores the
 * default split. Sizes can be percentages or pixels, anchored to either pane,
 * and a collapsible pane folds away past its minimum or on Enter.
 */
export function Resizable({
  first,
  second,
  direction = "horizontal",
  anchor = "first",
  units = "percent",
  size,
  defaultSize = units === "pixels" ? 280 : 50,
  onSizeChange,
  min = units === "pixels" ? 160 : 15,
  max = units === "pixels" ? 720 : 85,
  collapsible = false,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  storageKey,
  label = "Resize panes",
  className,
  style,
  ...props
}: ResizableProps) {
  const [current, setCurrent] = useControllableState({ value: size, defaultValue: defaultSize, onChange: onSizeChange });
  const [folded, setFolded] = useControllableState({ value: collapsed, defaultValue: defaultCollapsed, onChange: onCollapsedChange });
  const root = React.useRef<HTMLDivElement>(null);
  const dragging = React.useRef(false);
  const horizontal = direction === "horizontal";
  const set = (value: number) => setCurrent(Math.round(clamp(value, min, max) * 10) / 10);
  const isFolded = collapsible && folded;

  // Restore a remembered layout after mount, so the server and the first client render agree.
  React.useEffect(() => {
    const stored = readStored(storageKey);
    if (typeof stored.size === "number") setCurrent(clamp(stored.size, min, max));
    if (collapsible && typeof stored.collapsed === "boolean") setFolded(stored.collapsed);
    // Only on mount and when the key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  React.useEffect(() => {
    if (!storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ size: current, collapsed: isFolded }));
    } catch {
      // The layout still works when storage is unavailable.
    }
  }, [storageKey, current, isFolded]);

  const fromPointer = (event: React.PointerEvent) => {
    const rect = root.current?.getBoundingClientRect();
    if (!rect) return;
    const total = horizontal ? rect.width : rect.height;
    const offset = horizontal ? event.clientX - rect.left : event.clientY - rect.top;
    const along = anchor === "first" ? offset : total - offset;
    const value = units === "pixels" ? along : (along / total) * 100;
    // Dragging well past the minimum folds a collapsible pane; dragging back unfolds it.
    if (collapsible && value < min * 0.6) {
      setFolded(true);
      return;
    }
    if (isFolded) setFolded(false);
    set(value);
  };

  const shown = isFolded ? 0 : current;
  const track = units === "pixels" ? `${shown}px` : `${shown}%`;
  const grow = anchor === "first" ? 1 : -1;

  return (
    <div
      ref={root}
      className={cx("ml-resizable", className)}
      data-direction={direction}
      data-anchor={anchor}
      data-collapsed={isFolded || undefined}
      style={{ ...style, ["--ml-resizable-size" as string]: track }}
      {...props}
    >
      <div className="ml-resizable-pane" data-folded={(isFolded && anchor === "first") || undefined}>
        {first}
      </div>
      <div
        role="separator"
        tabIndex={0}
        aria-label={label}
        aria-orientation={horizontal ? "vertical" : "horizontal"}
        aria-valuemin={collapsible ? 0 : min}
        aria-valuemax={max}
        aria-valuenow={Math.round(shown)}
        aria-expanded={collapsible ? !isFolded : undefined}
        className="ml-resizable-handle"
        onPointerDown={(event) => {
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (dragging.current) fromPointer(event);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onDoubleClick={() => {
          setFolded(false);
          set(defaultSize);
        }}
        onKeyDown={(event) => {
          const step = (event.shiftKey ? 5 : 1) * (units === "pixels" ? 16 : 2);
          const back = horizontal ? "ArrowLeft" : "ArrowUp";
          const forward = horizontal ? "ArrowRight" : "ArrowDown";
          if (event.key === back) set(current - step * grow);
          else if (event.key === forward) set(current + step * grow);
          else if (event.key === "Home") set(anchor === "first" ? min : max);
          else if (event.key === "End") set(anchor === "first" ? max : min);
          else if (event.key === "Enter" && collapsible) setFolded(!isFolded);
          else return;
          event.preventDefault();
        }}
      />
      <div className="ml-resizable-pane" data-folded={(isFolded && anchor === "second") || undefined}>
        {second}
      </div>
    </div>
  );
}
