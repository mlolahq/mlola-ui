"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { IconCheck, IconChevronDown, IconPlus, IconX } from "@mlola-ui/icons";
import { Field, fieldDescription, type FormControlProps } from "../input/input";
import { useFloating, usePortalNode } from "../_internal/floating";
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
  /** The field it opens from: it is placed beside it and at least as wide. Defaults to the element it is rendered in. */
  anchor?: React.RefObject<HTMLElement | null>;
  side: "top" | "bottom";
  label?: string;
  grouped?: boolean;
}

/**
 * The popup list a combobox or tag input shows under its field: grouped,
 * highlighted by pointer or arrows, never taking focus from the input. It
 * opens on <body>, placed beside the field, so no card, panel or scroll
 * area around the field can cover or cut it.
 */
export function ComboboxList({ id, options, active, onActiveChange, onPick, isSelected, create, empty, anchor, side, label, grouped = true }: ComboboxListProps) {
  const list = React.useRef<HTMLUListElement>(null);
  const layer = React.useRef<HTMLDivElement>(null);
  const spot = React.useRef<HTMLSpanElement>(null);
  const field = React.useRef<HTMLElement | null>(null);
  const portal = usePortalNode();
  // As wide as the field, and never taller than the window's room on its side.
  React.useLayoutEffect(() => {
    field.current = anchor?.current ?? spot.current?.parentElement ?? null;
    if (!field.current || !layer.current) return;
    const rect = field.current.getBoundingClientRect();
    const room = side === "top" ? rect.top - 12 : window.innerHeight - rect.bottom - 12;
    layer.current.style.minWidth = `${rect.width}px`;
    layer.current.style.setProperty("--ml-combobox-room", `${Math.max(120, Math.floor(room))}px`);
  }, [anchor, side, portal]);
  useFloating(field, layer, Boolean(portal), { side, align: "start", offset: 6 });
  React.useEffect(() => {
    revealIn(list.current, list.current?.querySelector<HTMLElement>("[data-highlighted]") ?? null);
  }, [active, options]);
  const popup = (
    <div ref={layer} data-ml-portal="" className="ml-combobox-popover" data-side={side} onMouseDown={(event) => event.preventDefault()}>
      <ul ref={list} id={id} role="listbox" aria-label={label} className="ml-combobox-list">
        {options.map((option, index) => {
          const heading = grouped && option.group && option.group !== options[index - 1]?.group ? option.group : null;
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
  return (
    <>
      <span ref={spot} hidden />
      {portal ? createPortal(popup, portal) : null}
    </>
  );
}

/**
 * Open the list below the field unless there is too little room in the
 * window there and more above. The list is a layer on <body>, so no
 * container clips it; only the window's edges count.
 */
export function sideFor(element: HTMLElement | null, room = 280): "top" | "bottom" {
  if (!element) return "bottom";
  const rect = element.getBoundingClientRect();
  const below = window.innerHeight - rect.bottom - 12;
  const above = rect.top - 12;
  return below < room && above > below ? "top" : "bottom";
}

export interface ComboboxProps extends FormControlProps {
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
  name,
  form,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
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
  const chosenLabel = chosen?.label ?? "";
  const [synced, setSynced] = React.useState({ label: chosenLabel, open });
  if (synced.label !== chosenLabel || synced.open !== open) {
    setSynced({ label: chosenLabel, open });
    if (!open) setQuery(chosenLabel);
  }

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
    <Field id={fieldId} label={label} hint={hint} error={error} required={required} disabled={disabled} name={name} form={form} value={current} className={cx("ml-combobox", className)}>
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
          aria-label={ariaLabel}
          aria-labelledby={labelledBy}
          aria-describedby={fieldDescription(fieldId, { hint, error, describedBy })}
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
            anchor={control}
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
