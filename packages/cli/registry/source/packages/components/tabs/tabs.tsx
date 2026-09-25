"use client";

import * as React from "react";
import { rovingIndex } from "@mlola-ui/behavior/logic";
import { cx, useControllableState } from "../_internal/react";

export type TabsVariant = "default" | "pills" | "enclosed";
type TabsOrientation = "horizontal" | "vertical";

interface TabsContextValue {
  value: string;
  variant: TabsVariant;
  orientation: TabsOrientation;
  prefix: string;
  select: (value: string) => void;
  triggers: React.MutableRefObject<Map<string, HTMLButtonElement>>;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);
const useTabs = () => {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used within Tabs");
  return context;
};

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  orientation?: TabsOrientation;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue = "",
  value,
  onValueChange,
  variant = "default",
  orientation = "horizontal",
  children,
  className,
}: TabsProps) {
  const [current, select] = useControllableState({ value, defaultValue, onChange: onValueChange });
  const triggers = React.useRef(new Map<string, HTMLButtonElement>());
  const prefix = `tabs-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <TabsContext.Provider value={{ value: current, variant, orientation, prefix, select, triggers }}>
      <div className={cx("ml-tabs", className)} data-variant={variant} data-orientation={orientation}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function TabsList({ children, className, "aria-label": ariaLabel }: TabsListProps) {
  const { orientation } = useTabs();
  return (
    <div role="tablist" aria-label={ariaLabel} aria-orientation={orientation} className={cx("ml-tabs-list", className)}>
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, disabled = false, children, className }: TabsTriggerProps) {
  const context = useTabs();
  const active = context.value === value;
  const register = React.useCallback((node: HTMLButtonElement | null) => {
    if (node) context.triggers.current.set(value, node);
    else context.triggers.current.delete(value);
  }, [context.triggers, value]);

  const ordered = () =>
    Array.from(context.triggers.current.entries()).sort((left, right) =>
      left[1].compareDocumentPosition(right[1]) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
    );

  // The same decision the framework-free runtime makes, so both skip disabled
  // tabs and wrap identically.
  const move = (key: string) => {
    const items = ordered();
    const index = items.findIndex(([entry]) => entry === value);
    const target = rovingIndex(items.length, index, key, {
      horizontal: context.orientation === "horizontal",
      enabled: (at) => !items[at][1].disabled,
    });
    if (target < 0) return;
    const [nextValue, element] = items[target];
    element.focus();
    context.select(nextValue);
  };

  return (
    <button
      ref={register}
      id={`${context.prefix}-tab-${value}`}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={`${context.prefix}-panel-${value}`}
      tabIndex={active ? 0 : -1}
      disabled={disabled}
      data-state={active ? "active" : "inactive"}
      className={cx("ml-tabs-trigger", className)}
      onClick={() => !disabled && context.select(value)}
      onKeyDown={(event) => {
        const before = event.key;
        const items = ordered();
        const index = items.findIndex(([entry]) => entry === value);
        if (
          rovingIndex(items.length, index, before, {
            horizontal: context.orientation === "horizontal",
            enabled: (at) => !items[at][1].disabled,
          }) < 0
        ) {
          return;
        }
        event.preventDefault();
        move(before);
      }}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const context = useTabs();
  const active = context.value === value;
  return (
    <div
      id={`${context.prefix}-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`${context.prefix}-tab-${value}`}
      tabIndex={0}
      hidden={!active}
      data-state={active ? "active" : "inactive"}
      className={cx("ml-tabs-content", className)}
    >
      {children}
    </div>
  );
}
