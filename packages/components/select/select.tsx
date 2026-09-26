"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { rovingIndex } from "@mlola-ui/behavior/logic";
import { useFloating, usePortalNode } from "../_internal/floating";
import { composeRefs, cx, useControllableState } from "../_internal/react";
import { IconCheck, IconChevronDown, IconX } from "@mlola-ui/icons";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
  /** A second line under the label, announced as the option's description. */
  description?: React.ReactNode;
  /** Decoration before the label (a mark or icon). Shown on the trigger too. */
  leading?: React.ReactNode;
  /** Decoration after the label, such as badges. Decorative: put anything a
      screen reader needs into `description`. */
  trailing?: React.ReactNode;
}

export type SelectSize = "sm" | "md" | "lg";

interface SelectBaseProps {
  options: SelectOption[];
  /** Cap the chips rendered before collapsing into a counter. */
  maxVisibleChips?: number;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  size?: SelectSize;
  error?: string;
  label?: string;
  /** Keep the label for assistive technology but do not show it (toolbars). */
  hideLabel?: boolean;
  className?: string;
}

interface SelectSingleProps {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

/** Select more than one option. Chips replace the single-value label. */
interface SelectMultipleProps {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type SelectProps = SelectBaseProps & (SelectSingleProps | SelectMultipleProps);

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(function Select(props: SelectProps, ref) {
  const {
    options,
    maxVisibleChips = 3,
    placeholder = "Select…",
    searchable = false,
    clearable = false,
    disabled = false,
    size = "md",
    error,
    label,
    hideLabel = false,
    className,
  } = props;
  const multiple = props.multiple === true;
  const [selectedValue, setSelectedValue] = useControllableState<string>({
    value: props.multiple ? undefined : props.value,
    defaultValue: props.multiple ? "" : (props.defaultValue ?? ""),
    onChange: props.multiple ? undefined : props.onValueChange,
  });
  const [selectedValues, setSelectedValues] = useControllableState<string[]>({
    value: props.multiple ? props.value : undefined,
    defaultValue: props.multiple ? (props.defaultValue ?? []) : [],
    onChange: props.multiple ? props.onValueChange : undefined,
  });
  const [open, setOpenState] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const controlRef = React.useRef<HTMLDivElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const portal = usePortalNode();
  // The list lives on <body>, fixed beside the control: no scrolling panel or
  // clipped card can cut it off, and it opens upward when there is no room below.
  useFloating(controlRef, popoverRef, open && Boolean(portal), { side: "bottom", align: "start", offset: 6 });
  React.useLayoutEffect(() => {
    if (open && popoverRef.current && controlRef.current) popoverRef.current.style.minWidth = `${controlRef.current.offsetWidth}px`;
  }, [open, portal]);
  const setOpen = (next: boolean | ((current: boolean) => boolean)) => setOpenState((current) => (typeof next === "function" ? next(current) : next));
  const id = React.useId();
  const labelId = `${id}-label`;
  const listId = `${id}-listbox`;
  const errorId = `${id}-error`;
  const selected = options.find((option) => option.value === selectedValue);
  const chosen = React.useMemo(
    () => (multiple ? options.filter((option) => selectedValues.includes(option.value)) : []),
    [multiple, options, selectedValues],
  );
  const isChosen = (option: SelectOption) =>
    multiple ? selectedValues.includes(option.value) : option.value === selectedValue;
  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized
      ? options.filter((option) => option.label.toLocaleLowerCase().includes(normalized))
      : options;
  }, [options, query]);
  const active = filtered[activeIndex];

  const close = React.useCallback((restoreFocus = false) => {
    setOpenState(false);
    setQuery("");
    setActiveIndex(-1);
    if (restoreFocus) requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  React.useEffect(() => {
    if (disabled) close();
  }, [disabled, close]);

  React.useEffect(() => {
    if (!open) return;
    const selectedIndex = filtered.findIndex(
      (option) => option.value === selectedValue && !option.disabled
    );
    setActiveIndex(
      selectedIndex >= 0 ? selectedIndex : filtered.findIndex((option) => !option.disabled)
    );
    if (searchable) requestAnimationFrame(() => searchRef.current?.focus());
    const onPointerDown = (event: MouseEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target) && !popoverRef.current?.contains(event.target)) {
        close();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, searchable, selectedValue, filtered, close]);

  // Shared with the framework-free runtime: one definition of how the
  // highlight moves and which options it steps over.
  const move = (key: string) => {
    const target = rovingIndex(filtered.length, activeIndex, key, {
      horizontal: false,
      enabled: (at) => !filtered[at].disabled,
    });
    if (target >= 0) setActiveIndex(target);
  };

  const choose = (option: SelectOption | undefined) => {
    if (!option || option.disabled || disabled) return;
    if (multiple) {
      setSelectedValues(
        selectedValues.includes(option.value)
          ? selectedValues.filter((entry) => entry !== option.value)
          : [...selectedValues, option.value],
      );
      return;
    }
    setSelectedValue(option.value);
    close(true);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") {
      close();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      else move(event.key);
    } else if (event.key === "Enter" || event.key === " ") {
      if (event.currentTarget === searchRef.current && event.key === " ") return;
      event.preventDefault();
      if (!open) setOpen(true);
      else choose(active);
    } else if (event.key === "Home" && open) {
      event.preventDefault();
      setActiveIndex(filtered.findIndex((option) => !option.disabled));
    } else if (event.key === "End" && open) {
      event.preventDefault();
      for (let index = filtered.length - 1; index >= 0; index -= 1) {
        if (!filtered[index].disabled) {
          setActiveIndex(index);
          break;
        }
      }
    }
  };

  return (
    <div
      ref={rootRef}
      className={cx("ml-select-root", className)}
      data-disabled={disabled ? "" : undefined}
      data-invalid={error ? "" : undefined}
    >
      {label ? <span id={labelId} className={hideLabel ? "ml-visually-hidden" : "ml-select-label"}>{label}</span> : null}
      <div ref={controlRef} className="ml-select-control">
        <button
          ref={composeRefs(triggerRef, ref)}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-labelledby={label ? labelId : undefined}
          aria-label={label ? undefined : placeholder}
          aria-activedescendant={open && active ? `${id}-option-${activeIndex}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          disabled={disabled}
          data-size={size}
          data-state={open ? "open" : "closed"}
          className="ml-select"
          onClick={() => setOpen((current) => !current)}
          onKeyDown={onKeyDown}
        >
          {multiple ? (
            <span className="ml-select-value" data-placeholder={chosen.length ? undefined : ""}>
              {chosen.length ? (
                <span className="ml-select-chips">
                  {chosen.slice(0, maxVisibleChips).map((option) => (
                    <span key={option.value} className="ml-badge" data-size="sm">
                      {option.label}
                    </span>
                  ))}
                  {chosen.length > maxVisibleChips ? (
                    <span className="ml-select-chip-overflow">+{chosen.length - maxVisibleChips}</span>
                  ) : null}
                </span>
              ) : (
                placeholder
              )}
            </span>
          ) : (
            <span className="ml-select-value" data-placeholder={selected ? undefined : ""}>
              {selected?.leading ? <span aria-hidden="true" className="ml-select-option-leading">{selected.leading}</span> : null}
              {selected?.label ?? placeholder}
            </span>
          )}
          <IconChevronDown aria-hidden="true" className="ml-select-chevron" size="1.125em" />
        </button>
        {clearable && (multiple ? chosen.length > 0 : Boolean(selected)) && !disabled ? (
          <button
            type="button"
            aria-label={`Clear ${label ?? "selection"}`}
            className="ml-select-clear" data-hit="expand"
            onClick={() => {
              if (multiple) setSelectedValues([]);
              else setSelectedValue("");
              close(true);
            }}
          >
            <IconX aria-hidden="true" size="0.875em" />
          </button>
        ) : null}
      </div>
      {open && !disabled && portal ? createPortal(
        <div ref={popoverRef} className="ml-select-popover" data-state="open" data-side="bottom">
          {searchable ? (
            <div className="ml-select-search-wrap">
              <input
                ref={searchRef}
                className="ml-select-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={onKeyDown}
                aria-label="Search options"
                placeholder="Search options…"
                aria-controls={listId}
                aria-activedescendant={active ? `${id}-option-${activeIndex}` : undefined}
              />
            </div>
          ) : null}
          <ul id={listId} role="listbox" aria-multiselectable={multiple || undefined} aria-labelledby={label ? labelId : undefined} className="ml-select-list">
            {filtered.length ? filtered.map((option, index) => (
              <React.Fragment key={option.value}>
                {(index === 0 || filtered[index - 1]?.group !== option.group) && option.group ? (
                  <li role="presentation" className="ml-select-group">{option.group}</li>
                ) : null}
                <li
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={isChosen(option)}
                  aria-disabled={option.disabled || undefined}
                  data-state={isChosen(option) ? "checked" : "unchecked"}
                  data-highlighted={index === activeIndex ? "" : undefined}
                  data-disabled={option.disabled ? "" : undefined}
                  aria-label={option.description ? option.label : undefined}
                  aria-describedby={option.description ? `${id}-option-${index}-description` : undefined}
                  className="ml-select-option"
                  onPointerMove={() => !option.disabled && setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                >
                  {option.leading ? <span aria-hidden="true" className="ml-select-option-leading">{option.leading}</span> : null}
                  {option.description ? (
                    <span className="ml-select-option-text">
                      <span className="ml-select-option-label">{option.label}</span>
                      <span id={`${id}-option-${index}-description`} className="ml-select-option-description">{option.description}</span>
                    </span>
                  ) : (
                    <span className="ml-select-option-label">{option.label}</span>
                  )}
                  {option.trailing ? <span aria-hidden="true" className="ml-select-option-trailing">{option.trailing}</span> : null}
                  {isChosen(option) ? <IconCheck aria-hidden="true" className="ml-select-check" size="1em" /> : null}
                </li>
              </React.Fragment>
            )) : <li role="presentation" className="ml-select-empty">No results found</li>}
          </ul>
        </div>,
        portal,
      ) : null}
      {error ? <p id={errorId} role="alert" className="ml-select-error">{error}</p> : null}
    </div>
  );
});
Select.displayName = "Select";
