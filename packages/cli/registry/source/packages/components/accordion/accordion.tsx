"use client";

import * as React from "react";
import { cx } from "../_internal/react";
import { rovingIndex } from "@mlola-ui/behavior/logic";
import { IconChevronDown } from "@mlola-ui/icons";

type AccordionType = "single" | "multiple";
interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AccordionType;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[] | undefined) => void;
  collapsible?: boolean;
}
interface AccordionContextValue {
  openValues: string[];
  toggle: (value: string) => void;
}
interface ItemContextValue {
  open: boolean;
  disabled: boolean;
  triggerId: string;
  contentId: string;
  toggle: () => void;
}
const AccordionContext = React.createContext<AccordionContextValue | null>(null);
const ItemContext = React.createContext<ItemContextValue | null>(null);
const normalize = (value: string | string[] | undefined) =>
  value === undefined || value === "" ? [] : Array.isArray(value) ? value : [value];

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = "single", defaultValue, value, onValueChange, collapsible = true, className, children, ...props }, ref) => {
    const controlled = value !== undefined;
    const [internal, setInternal] = React.useState(() => normalize(defaultValue));
    const openValues = controlled ? normalize(value) : internal;
    const rootRef = React.useRef<HTMLDivElement>(null);
    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );
    const toggle = React.useCallback((itemValue: string) => {
      const open = openValues.includes(itemValue);
      if (type === "single") {
        if (open && !collapsible) return;
        const next = open ? [] : [itemValue];
        if (!controlled) setInternal(next);
        onValueChange?.(next[0]);
      } else {
        const next = open ? openValues.filter((item) => item !== itemValue) : [...openValues, itemValue];
        if (!controlled) setInternal(next);
        onValueChange?.(next);
      }
    }, [collapsible, controlled, onValueChange, openValues, type]);

    // Arrow, Home and End move focus between triggers. The framework-free
    // runtime makes the same decision with the same shared function.
    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      props.onKeyDown?.(event);
      if (event.defaultPrevented || !rootRef.current) return;
      const triggers = [...rootRef.current.querySelectorAll<HTMLButtonElement>(".ml-accordion-trigger")];
      const target = rovingIndex(
        triggers.length,
        triggers.indexOf(document.activeElement as HTMLButtonElement),
        event.key,
        { horizontal: false, enabled: (index) => !triggers[index].disabled },
      );
      if (target < 0) return;
      event.preventDefault();
      triggers[target].focus();
    };

    return (
      <AccordionContext.Provider value={{ openValues, toggle }}>
        <div ref={setRef} className={cx("ml-accordion", className)} onKeyDown={onKeyDown} {...props}>{children}</div>
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}
const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, disabled = false, className, children, ...props }, ref) => {
    const accordion = React.useContext(AccordionContext);
    if (!accordion) throw new Error("AccordionItem must be used inside Accordion");
    const open = accordion.openValues.includes(value);
    const id = React.useId();
    const item = React.useMemo(() => ({
      open,
      disabled,
      triggerId: `${id}-trigger`,
      contentId: `${id}-content`,
      toggle: () => !disabled && accordion.toggle(value),
    }), [accordion, disabled, id, open, value]);
    return (
      <ItemContext.Provider value={item}>
        <div ref={ref} data-state={open ? "open" : "closed"} data-disabled={disabled ? "" : undefined} className={cx("ml-accordion-item", className)} {...props}>
          {children}
        </div>
      </ItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const item = React.useContext(ItemContext);
    if (!item) throw new Error("AccordionTrigger must be used inside AccordionItem");
    return (
      <h3 className="ml-accordion-heading">
        <button
          ref={ref}
          id={item.triggerId}
          type="button"
          aria-expanded={item.open}
          aria-controls={item.contentId}
          disabled={item.disabled}
          data-state={item.open ? "open" : "closed"}
          className={cx("ml-accordion-trigger", className)}
          onClick={item.toggle}
          {...props}
        >
          <span className="ml-accordion-trigger-label">{children}</span>
          <IconChevronDown aria-hidden="true" className="ml-accordion-chevron" />
        </button>
      </h3>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}
const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const item = React.useContext(ItemContext);
    if (!item) throw new Error("AccordionContent must be used inside AccordionItem");
    return (
      <div
        ref={ref}
        id={item.contentId}
        role="region"
        aria-labelledby={item.triggerId}
        hidden={!item.open}
        data-state={item.open ? "open" : "closed"}
        className={cx("ml-accordion-panel", className)}
        {...props}
      >
        <div className="ml-accordion-panel-inner">{children}</div>
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
