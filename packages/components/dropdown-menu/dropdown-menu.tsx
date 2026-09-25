"use client";

import * as React from "react";
import { rovingIndex } from "@mlola-ui/behavior/logic";
import { composeRefs, cx } from "../_internal/react";
import { IconChevronDown } from "@mlola-ui/icons";

interface DropdownMenuItem {
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  separatorBefore?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  label?: string;
  align?: "start" | "end";
  onSelect?: (label: string) => void;
  className?: string;
}

const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ trigger, items, label = "Menu", align = "start", onSelect, className }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(-1);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
    const enabled = React.useMemo(
      () => items.map((item, index) => item.disabled ? -1 : index).filter((index) => index >= 0),
      [items]
    );
    const close = React.useCallback((restore = false) => {
      setOpen(false);
      setActiveIndex(-1);
      if (restore) requestAnimationFrame(() => triggerRef.current?.focus());
    }, []);
    const focus = React.useCallback((index: number) => {
      if (index < 0) return;
      setActiveIndex(index);
      requestAnimationFrame(() => itemRefs.current[index]?.focus());
    }, []);
    const openAt = (index: number) => {
      setOpen(true);
      focus(index);
    };
    const choose = (index: number) => {
      const item = items[index];
      if (!item || item.disabled) return;
      onSelect?.(item.label);
      close(true);
    };
    // Shared with the framework-free runtime, so the highlight steps over
    // disabled items the same way in both.
    const move = (key: string) => {
      const target = rovingIndex(items.length, activeIndex, key, {
        horizontal: false,
        enabled: (at) => !items[at].disabled,
      });
      if (target >= 0) focus(target);
    };

    React.useEffect(() => {
      if (!open) return;
      const onPointerDown = (event: MouseEvent) => {
        if (rootRef.current && event.target instanceof Node && !rootRef.current.contains(event.target)) close();
      };
      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }, [close, open]);

    return (
      <div ref={composeRefs(rootRef, ref)} className={cx("ml-dropdown", className)} data-state={open ? "open" : "closed"}>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          className="ml-dropdown-trigger"
          onClick={() => open ? close() : openAt(enabled[0] ?? -1)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openAt(enabled[0] ?? -1);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              openAt(enabled[enabled.length - 1] ?? -1);
            } else if (event.key === "Escape") {
              close(true);
            }
          }}
        >
          <span className="ml-dropdown-trigger-label">{trigger}</span>
          <IconChevronDown aria-hidden="true" className="ml-dropdown-chevron" size="1em" />
        </button>
        {open ? (
          <div
            role="menu"
            aria-label={label}
            data-align={align}
            className="ml-dropdown-menu"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                close(true);
              } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                move(event.key);
              } else if (event.key === "Home" || event.key === "End") {
                event.preventDefault();
                focus(event.key === "Home" ? enabled[0] : enabled[enabled.length - 1]);
              } else if (event.key === "Tab") {
                close();
              } else if (event.key.length === 1 && /\S/.test(event.key)) {
                const start = Math.max(0, enabled.indexOf(activeIndex) + 1);
                const ordered = [...enabled.slice(start), ...enabled.slice(0, start)];
                const match = ordered.find((index) => items[index].label.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()));
                if (match !== undefined) focus(match);
              }
            }}
          >
            <div className="ml-dropdown-label">{label}</div>
            {items.map((item, index) => (
              <React.Fragment key={`${item.label}-${index}`}>
                {item.separatorBefore ? <div role="separator" className="ml-dropdown-separator" /> : null}
                <button
                  ref={(node) => { itemRefs.current[index] = node; }}
                  type="button"
                  role="menuitem"
                  tabIndex={activeIndex === index ? 0 : -1}
                  disabled={item.disabled}
                  aria-disabled={item.disabled || undefined}
                  data-highlighted={activeIndex === index ? "" : undefined}
                  data-danger={item.danger ? "" : undefined}
                  className="ml-dropdown-item"
                  onFocus={() => !item.disabled && setActiveIndex(index)}
                  onPointerMove={() => !item.disabled && focus(index)}
                  onClick={() => choose(index)}
                >
                  {item.icon ? <span aria-hidden="true" className="ml-dropdown-item-icon">{item.icon}</span> : null}
                  <span className="ml-dropdown-item-label">{item.label}</span>
                  {item.shortcut ? <span aria-hidden="true" className="ml-dropdown-shortcut">{item.shortcut}</span> : null}
                </button>
              </React.Fragment>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);
DropdownMenu.displayName = "DropdownMenu";
export { DropdownMenu };
