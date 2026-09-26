"use client";

import * as React from "react";
import { IconCheck, IconChevronDown, IconPlus, IconX } from "@mlola-ui/icons";
import { Field, fieldDescription } from "../input/input";
import { cx } from "../_internal/react";
import { matchCommand } from "../_internal/match";
import { revealIn } from "../_internal/scroll";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  /** An icon, avatar or swatch before the label. */
  leading?: React.ReactNode;
  /** More words that find this option. */
  keywords?: string[];
  group?: string;
  disabled?: boolean;
}

/** Rank options against what was typed: prefix, word start, substring, then letters in order. */
export function filterOptions(options: ComboboxOption[], query: string) {
  if (!query.trim()) return options;
  return options
    .map((option) => ({ option, match: matchCommand(option.label, query, option.keywords) }))
    .filter((entry) => entry.match)
    .sort((a, b) => b.match!.score - a.match!.score)
    .map((entry) => entry.option);
}

export interface ComboboxListProps {
  id: string;
  options: ComboboxOption[];
  /** Index of the highlighted row. */
  active: number;
  onActiveChange: (index: number) => void;
  onPick: (option: ComboboxOption) => void;
  isSelected?: (option: ComboboxOption) => boolean;
  /** A last row that creates what was typed. */
  create?: { label: string; onCreate: () => void } | null;
  empty?: React.ReactNode;
  side: "top" | "bottom";
  label?: string;
  grouped?: boolean;
}

/**
 * The popup list a combobox or tag input shows under its field: grouped,
 * highlighted by pointer or arrows, never taking focus from the input.
 */
export function ComboboxList({ id, options, active, onActiveChange, onPick, isSelected, create, empty, side, label, grouped = true }: ComboboxListProps) {
  const list = React.useRef<HTMLUListElement>(null);
  React.useEffect(() => {
    revealIn(list.current, list.current?.querySelector<HTMLElement>("[data-highlighted]") ?? null);
  }, [active, options]);
  let lastGroup: string | undefined;
  return (
    <div className="ml-combobox-popover" data-side={side} onMouseDown={(event) => event.preventDefault()}>
      <ul ref={list} id={id} role="listbox" aria-label={label} className="ml-combobox-list">
        {options.map((option, index) => {
          const heading = grouped && option.group && option.group !== lastGroup ? option.group : null;
          lastGroup = option.group;
          const selected = isSelected?.(option) ?? false;
          return (
            <React.Fragment key={option.value}>
              {heading ? (
                <li role="presentation" className="ml-combobox-group">
                  {heading}
                </li>
              ) : null}
              <li
                id={`${id}-${index}`}
                role="option"
                aria-selected={selected}
                aria-disabled={option.disabled || undefined}
                className="ml-combobox-option"
                data-highlighted={index === active || undefined}
                onPointerMove={() => index !== active && onActiveChange(index)}
                onClick={() => !option.disabled && onPick(option)}
              >
                {option.leading ? (
                  <span className="ml-combobox-leading" aria-hidden="true">
                    {option.leading}
                  </span>
                ) : null}
                <span className="ml-combobox-text">
                  <span className="ml-combobox-label">{option.label}</span>
                  {option.description ? <span className="ml-combobox-description">{option.description}</span> : null}
                </span>
                {selected ? <IconCheck aria-hidden="true" size="0.95em" className="ml-combobox-check" /> : null}
              </li>
            </React.Fragment>
          );
        })}
        {create ? (
          <li
            id={`${id}-${options.length}`}
            role="option"
            aria-selected={false}
            className="ml-combobox-option"
            data-create=""
            data-highlighted={active === options.length || undefined}
            onPointerMove={() => active !== options.length && onActiveChange(options.length)}
            onClick={create.onCreate}
          >
            <span className="ml-combobox-leading" aria-hidden="true">
              <IconPlus size="1em" />
            </span>
            <span className="ml-combobox-label">{create.label}</span>
          </li>
        ) : null}
        {!options.length && !create ? <li className="ml-combobox-empty">{empty ?? "No matches"}</li> : null}
      </ul>
    </div>
  );
}

/** The visible band a list can open into: the viewport, cut down by any ancestor that clips its content. */
function visibleBand(element: HTMLElement) {
  let top = 0;
  let bottom = window.innerHeight;
  for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (/(hidden|clip|auto|scroll)/.test(style.overflowY) || /(hidden|clip|auto|scroll)/.test(style.overflow)) {
      const rect = node.getBoundingClientRect();
      top = Math.max(top, rect.top);
      bottom = Math.min(bottom, rect.bottom);
    }
  }
  return { top, bottom };
}

/**
 * Open the list below the field unless there is too little room there and
 * more above, counting only space that is actually visible (a card that clips
 * its content counts as an edge). The room found is left on the field as
 * --ml-combobox-room, so the list never grows past what can be seen.
 */
export function sideFor(element: HTMLElement | null, room = 280): "top" | "bottom" {
  if (!element) return "bottom";
  const rect = element.getBoundingClientRect();
  const band = visibleBand(element);
  const below = band.bottom - rect.bottom - 12;
  const above = rect.top - band.top - 12;
  const side = below < room && above > below ? "top" : "bottom";
  element.style.setProperty("--ml-combobox-room", `${Math.max(120, Math.floor(side === "top" ? above : below))}px`);
  return side;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  placeholder?: string;
  /** Offer to create what was typed when nothing matches it exactly. */
  onCreate?: (text: string) => void;
  /** Shown when nothing matches. */
  emptyMessage?: React.ReactNode;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
}

/**
 * A text field that filters a list as you type: the searchable choice for
 * long lists such as countries, people or repositories. Arrows move, Enter
 * chooses, Escape restores; with `onCreate`, a missing option can be added.
 */
export const Combobox = React.forwardRef<HTMLInputElement, ComboboxProps>(function Combobox({
  options,
  value,
  defaultValue = null,
  onValueChange,
  label,
  hint,
  error,
  placeholder = "Search…",
  onCreate,
  emptyMessage,
  clearable = true,
  disabled,
  required,
  id,
  className,
}: ComboboxProps, ref) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  const listId = `${fieldId}-list`;
  const [inner, setInner] = React.useState<string | null>(defaultValue);
  const current = value !== undefined ? value : inner;
  const chosen = options.find((option) => option.value === current) ?? null;
  const [query, setQuery] = React.useState(chosen?.label ?? "");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [side, setSide] = React.useState<"top" | "bottom">("bottom");
  const control = React.useRef<HTMLDivElement>(null);
  const typed = React.useRef(false);

  // Show the chosen label whenever the value changes from outside or the list closes.
  React.useEffect(() => {
    if (!open) setQuery(chosen?.label ?? "");
  }, [chosen?.label, open]);

  const shown = typed.current ? filterOptions(options, query) : options;
  const exact = options.some((option) => option.label.toLowerCase() === query.trim().toLowerCase());
  const create = onCreate && query.trim() && !exact ? { label: `Create “${query.trim()}”`, onCreate: () => pickCreate() } : null;
  const count = shown.length + (create ? 1 : 0);

  const commit = (next: string | null) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  const openList = () => {
    if (disabled) return;
    setSide(sideFor(control.current));
    setOpen(true);
    const index = shown.findIndex((option) => option.value === current);
    setActive(Math.max(0, index));
  };

  const close = () => {
    setOpen(false);
    typed.current = false;
  };

  const pick = (option: ComboboxOption) => {
    commit(option.value);
    setQuery(option.label);
    close();
  };

  function pickCreate() {
    const text = query.trim();
    if (!text) return;
    onCreate?.(text);
    close();
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return openList();
      if (!count) return;
      setActive((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + count) % count);
    } else if (event.key === "Enter" && open) {
      event.preventDefault();
      if (active < shown.length) {
        const option = shown[active];
        if (option && !option.disabled) pick(option);
      } else if (create) pickCreate();
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setQuery(chosen?.label ?? "");
        close();
      } else if (clearable && current) {
        event.preventDefault();
        commit(null);
        setQuery("");
      }
    } else if (event.key === "Tab" && open) close();
  };

  return (
    <Field id={fieldId} label={label} hint={hint} error={error} required={required} disabled={disabled} className={cx("ml-combobox", className)}>
      <div ref={control} className="ml-combobox-control" data-open={open || undefined}>
        {chosen?.leading && !typed.current ? (
          <span className="ml-combobox-value-leading" aria-hidden="true">
            {chosen.leading}
          </span>
        ) : null}
        <input
          ref={ref}
          id={fieldId}
          className="ml-input ml-combobox-input"
          data-leading={chosen?.leading && !typed.current ? "" : undefined}
          data-clearable={clearable && current && !disabled ? "" : undefined}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && count ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={fieldDescription(fieldId, { hint, error })}
          value={query}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            typed.current = true;
            setQuery(event.target.value);
            setActive(0);
            if (!open) openList();
          }}
          onFocus={(event) => event.currentTarget.select()}
          onClick={() => (open ? undefined : openList())}
          onKeyDown={onKeyDown}
          onBlur={() => {
            setQuery(chosen?.label ?? "");
            close();
          }}
        />
        {clearable && current && !disabled ? (
          <button
            type="button"
            className="ml-combobox-clear" data-hit="expand"
            aria-label="Clear"
            tabIndex={-1}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              commit(null);
              setQuery("");
            }}
          >
            <IconX aria-hidden="true" size="0.9em" />
          </button>
        ) : null}
        <IconChevronDown aria-hidden="true" size="1.1em" className="ml-combobox-chevron" />
        {open ? (
          <ComboboxList
            id={listId}
            options={shown}
            active={active}
            onActiveChange={setActive}
            onPick={pick}
            isSelected={(option) => option.value === current}
            create={create}
            empty={emptyMessage}
            side={side}
            label={typeof label === "string" ? label : undefined}
            grouped={!typed.current}
          />
        ) : null}
      </div>
    </Field>
  );
});
Combobox.displayName = "Combobox";
