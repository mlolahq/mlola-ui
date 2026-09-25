"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { IconCheck } from "@mlola-ui/icons";
import { cx } from "../_internal/react";
import { usePortalNode } from "../_internal/floating";

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  /** Shows a tick, for toggles such as "Show grid". */
  checked?: boolean;
  /** Draw a divider above this item. */
  separatorBefore?: boolean;
  onSelect?: () => void;
}

export interface ContextMenuProps {
  /** The area that answers a right-click, a long press or the menu key. */
  children: React.ReactNode;
  /** The items, or a function that builds them for what was clicked. */
  items: ContextMenuItem[] | ((target: EventTarget | null) => ContextMenuItem[]);
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** Keep a menu of this size inside the window, flipping from the pointer when it would overflow. */
export function placeMenu(x: number, y: number, width: number, height: number, viewport: { width: number; height: number }, margin = 8) {
  const left = x + width + margin > viewport.width ? Math.max(margin, x - width) : x;
  const top = y + height + margin > viewport.height ? Math.max(margin, y - height) : y;
  return { left, top };
}

/**
 * Actions for what is under the pointer: right-click (or long-press, or the
 * menu key) opens a menu at that spot, kept inside the window. Arrows move,
 * a letter jumps, Enter chooses, Escape returns focus where it was.
 */
export function ContextMenu({ children, items, label = "Actions", disabled, className }: ContextMenuProps) {
  const portal = usePortalNode();
  const [state, setState] = React.useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [active, setActive] = React.useState(0);
  const menu = React.useRef<HTMLDivElement>(null);
  const returnTo = React.useRef<HTMLElement | null>(null);
  const press = React.useRef<number | undefined>(undefined);

  // From the keyboard the first item is highlighted; from a pointer nothing is until the pointer or an arrow moves.
  const openAt = (x: number, y: number, target: EventTarget | null, keyboard = false) => {
    const list = typeof items === "function" ? items(target) : items;
    if (!list.length) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    setState({ x, y, items: list });
    setActive(keyboard ? list.findIndex((item) => !item.disabled) : -1);
  };

  const close = React.useCallback((restore = true) => {
    setState(null);
    if (restore) requestAnimationFrame(() => returnTo.current?.focus?.());
  }, []);

  // Place inside the window once the menu's size is known, then take focus.
  React.useLayoutEffect(() => {
    const element = menu.current;
    if (!state || !element) return;
    const { left, top } = placeMenu(state.x, state.y, element.offsetWidth, element.offsetHeight, { width: window.innerWidth, height: window.innerHeight });
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
    element.focus({ preventScroll: true });
  }, [state]);

  React.useEffect(() => {
    if (!state) return;
    const away = (event: Event) => {
      if (!menu.current?.contains(event.target as Node)) close(false);
    };
    const shut = () => close(false);
    document.addEventListener("pointerdown", away, true);
    window.addEventListener("resize", shut);
    window.addEventListener("scroll", shut, true);
    window.addEventListener("blur", shut);
    return () => {
      document.removeEventListener("pointerdown", away, true);
      window.removeEventListener("resize", shut);
      window.removeEventListener("scroll", shut, true);
      window.removeEventListener("blur", shut);
    };
  }, [state, close]);

  const choose = (item: ContextMenuItem | undefined) => {
    if (!item || item.disabled) return;
    close();
    item.onSelect?.();
  };

  const move = (step: number) => {
    if (!state) return;
    const count = state.items.length;
    let next = active < 0 ? (step > 0 ? -1 : count) : active;
    for (let tries = 0; tries < count; tries++) {
      next = (next + step + count) % count;
      if (!state.items[next].disabled) break;
    }
    setActive(next);
  };

  const onMenuKey = (event: React.KeyboardEvent) => {
    if (!state) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : state.items.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      choose(state.items[active]);
    } else if (event.key === "Escape" || event.key === "Tab") {
      event.preventDefault();
      close();
    } else if (/^\w$/.test(event.key)) {
      // A letter jumps to the next item that starts with it.
      const letter = event.key.toLowerCase();
      const order = state.items.map((_, index) => (active + 1 + index) % state.items.length);
      const found = order.find((index) => !state.items[index].disabled && state.items[index].label.toLowerCase().startsWith(letter));
      if (found !== undefined) setActive(found);
    }
  };

  return (
    <div
      className={cx("ml-context-menu-area", className)}
      onContextMenu={(event) => {
        if (disabled) return;
        event.preventDefault();
        openAt(event.clientX, event.clientY, event.target);
      }}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
          event.preventDefault();
          const rect = (event.target as HTMLElement).getBoundingClientRect();
          openAt(rect.left + 8, rect.bottom, event.target, true);
        }
      }}
      onPointerDown={(event) => {
        // A long press opens the menu on touch screens.
        if (event.pointerType !== "touch" || disabled) return;
        const { clientX, clientY, target } = event;
        press.current = window.setTimeout(() => openAt(clientX, clientY, target), 520);
      }}
      onPointerUp={() => window.clearTimeout(press.current)}
      onPointerMove={() => window.clearTimeout(press.current)}
    >
      {children}
      {state && portal
        ? createPortal(
            <div ref={menu} className="ml-context-menu" role="menu" aria-label={label} tabIndex={-1} onKeyDown={onMenuKey} style={{ left: state.x, top: state.y }}>
              {state.items.map((item, index) => (
                <React.Fragment key={`${item.label}-${index}`}>
                  {item.separatorBefore ? <div className="ml-context-menu-separator" role="separator" /> : null}
                  <button
                    type="button"
                    role={item.checked === undefined ? "menuitem" : "menuitemcheckbox"}
                    aria-checked={item.checked === undefined ? undefined : item.checked}
                    tabIndex={-1}
                    className="ml-context-menu-item"
                    data-highlighted={index === active || undefined}
                    data-danger={item.danger || undefined}
                    aria-disabled={item.disabled || undefined}
                    onPointerMove={() => !item.disabled && index !== active && setActive(index)}
                    onClick={() => choose(item)}
                  >
                    <span className="ml-context-menu-icon" aria-hidden="true">
                      {item.checked ? <IconCheck size="1em" /> : item.icon}
                    </span>
                    <span className="ml-context-menu-label">{item.label}</span>
                    {item.shortcut ? <span className="ml-context-menu-shortcut">{item.shortcut}</span> : null}
                  </button>
                </React.Fragment>
              ))}
            </div>,
            portal,
          )
        : null}
    </div>
  );
}
