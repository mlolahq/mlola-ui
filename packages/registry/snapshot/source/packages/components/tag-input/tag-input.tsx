"use client";

import * as React from "react";
import { IconX } from "@mlola-ui/icons";
import { ComboboxList, filterOptions, sideFor, type ComboboxOption } from "../combobox/combobox";
import { Field, fieldDescription } from "../input/input";
import { cx } from "../_internal/react";

export interface TagInputProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (tags: string[]) => void;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  placeholder?: string;
  /** Tags to suggest as you type; their labels become the tags. */
  suggestions?: ComboboxOption[];
  /** Accept only suggested tags. */
  restrict?: boolean;
  /** Return a message to refuse a tag: "Use lowercase letters and dashes". */
  validate?: (tag: string) => string | null;
  /** Shape each tag before it is added, such as trimming or lowercasing. */
  transform?: (tag: string) => string;
  max?: number;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
}

/** Split pasted or typed text into tags on commas, semicolons and new lines. */
export function splitTags(text: string) {
  return text
    .split(/[,;\n\r\t]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Many short values in one field: emails, labels, keywords. Enter or a comma
 * adds a tag, pasting a list adds them all, Backspace on an empty field
 * marks the last tag and then removes it, and arrows move between tags.
 * Suggestions, validation and a limit are optional.
 */
export function TagInput({
  value,
  defaultValue = [],
  onValueChange,
  label,
  hint,
  error,
  placeholder = "Add…",
  suggestions,
  restrict = false,
  validate,
  transform = (tag) => tag.trim(),
  max,
  disabled,
  required,
  id,
  className,
}: TagInputProps) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  const listId = `${fieldId}-list`;
  const [inner, setInner] = React.useState(defaultValue);
  const tags = value ?? inner;
  const [text, setText] = React.useState("");
  const [armed, setArmed] = React.useState<number | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [announcement, setAnnouncement] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [side, setSide] = React.useState<"top" | "bottom">("bottom");
  const control = React.useRef<HTMLDivElement>(null);
  const input = React.useRef<HTMLInputElement>(null);

  const full = max !== undefined && tags.length >= max;
  const available = (suggestions ?? []).filter((option) => !tags.some((tag) => tag.toLowerCase() === option.label.toLowerCase()));
  const shown = filterOptions(available, text);

  const commit = (next: string[]) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  /** Add every candidate that passes; report the first that does not. */
  const add = (candidates: string[]) => {
    const next = [...tags];
    const added: string[] = [];
    for (const raw of candidates) {
      const tag = transform(raw);
      if (!tag) continue;
      if (max !== undefined && next.length >= max) {
        setProblem(`Up to ${max} ${max === 1 ? "item" : "items"}.`);
        break;
      }
      if (next.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
        setProblem(`“${tag}” is already added.`);
        continue;
      }
      if (restrict && !suggestions?.some((option) => option.label.toLowerCase() === tag.toLowerCase())) {
        setProblem(`“${tag}” is not one of the options.`);
        continue;
      }
      const message = validate?.(tag);
      if (message) {
        setProblem(message);
        continue;
      }
      next.push(tag);
      added.push(tag);
    }
    if (added.length) {
      commit(next);
      setAnnouncement(`Added ${added.join(", ")}.`);
    }
    return added.length > 0;
  };

  const remove = (index: number) => {
    const tag = tags[index];
    commit(tags.filter((_, position) => position !== index));
    setAnnouncement(`Removed ${tag}.`);
    setArmed(null);
    setProblem(null);
    input.current?.focus();
  };

  const submitText = () => {
    if (open && shown[active] && text.trim()) {
      add([shown[active].label]);
      setText("");
      return;
    }
    if (!text.trim()) return;
    if (add(splitTags(text)) || !restrict) setText("");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const caretAtStart = event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0;
    if (event.key === "Enter" || event.key === ",") {
      if (event.nativeEvent.isComposing) return;
      if (event.key === "Enter" && !text.trim() && !open) return;
      event.preventDefault();
      submitText();
    } else if (event.key === "Backspace" && !text) {
      event.preventDefault();
      if (armed !== null) remove(armed);
      else if (tags.length) setArmed(tags.length - 1);
    } else if (event.key === "Delete" && armed !== null) {
      event.preventDefault();
      remove(armed);
    } else if (event.key === "ArrowLeft" && caretAtStart && tags.length) {
      event.preventDefault();
      setArmed((current) => (current === null ? tags.length - 1 : Math.max(0, current - 1)));
    } else if (event.key === "ArrowRight" && armed !== null) {
      event.preventDefault();
      setArmed((current) => (current === null || current >= tags.length - 1 ? null : current + 1));
    } else if ((event.key === "ArrowDown" || event.key === "ArrowUp") && suggestions?.length) {
      event.preventDefault();
      if (!open) {
        setSide(sideFor(control.current));
        setOpen(true);
        setActive(0);
      } else if (shown.length) setActive((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + shown.length) % shown.length);
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        setOpen(false);
      } else setArmed(null);
    }
  };

  const message = problem ?? error;

  return (
    <Field id={fieldId} label={label} hint={hint} error={message ?? undefined} required={required} disabled={disabled} className={cx("ml-tag-input", className)}>
      <div
        ref={control}
        className="ml-tag-input-control"
        data-disabled={disabled || undefined}
        data-invalid={message ? "" : undefined}
        onMouseDown={(event) => {
          // Clicking the field's empty space puts the caret in the input.
          if (event.target === event.currentTarget) {
            event.preventDefault();
            input.current?.focus();
          }
        }}
      >
        <ul className="ml-tag-input-tags" aria-label="Added">
          {tags.map((tag, index) => (
            <li key={tag} className="ml-tag-input-tag" data-armed={armed === index || undefined}>
              <span className="ml-tag-input-text">{tag}</span>
              {disabled ? null : (
                <button type="button" className="ml-tag-input-remove" tabIndex={-1} aria-label={`Remove ${tag}`} onMouseDown={(event) => event.preventDefault()} onClick={() => remove(index)}>
                  <IconX aria-hidden="true" size="0.8em" />
                </button>
              )}
            </li>
          ))}
        </ul>
        <input
          ref={input}
          id={fieldId}
          className="ml-tag-input-field"
          role={suggestions ? "combobox" : undefined}
          aria-expanded={suggestions ? open : undefined}
          aria-controls={suggestions ? listId : undefined}
          aria-autocomplete={suggestions ? "list" : undefined}
          aria-activedescendant={open && shown.length ? `${listId}-${active}` : undefined}
          aria-invalid={message ? true : undefined}
          aria-describedby={fieldDescription(fieldId, { hint, error: message })}
          value={text}
          placeholder={full ? "" : placeholder}
          disabled={disabled || full}
          autoComplete="off"
          onChange={(event) => {
            setText(event.target.value);
            setArmed(null);
            setProblem(null);
            setActive(0);
            if (suggestions?.length && event.target.value.trim()) {
              if (!open) setSide(sideFor(control.current));
              setOpen(true);
            } else setOpen(false);
          }}
          onKeyDown={onKeyDown}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text/plain");
            if (splitTags(pasted).length > 1) {
              event.preventDefault();
              add(splitTags(pasted));
            }
          }}
          onBlur={() => {
            setOpen(false);
            setArmed(null);
            // A half-typed tag is kept, as people expect when they click away.
            if (text.trim() && !restrict && add(splitTags(text))) setText("");
          }}
        />
        {max !== undefined ? (
          <span className="ml-tag-input-count" aria-hidden="true">
            {tags.length}/{max}
          </span>
        ) : null}
        {open && suggestions ? (
          <ComboboxList
            id={listId}
            options={shown}
            active={active}
            onActiveChange={setActive}
            onPick={(option) => {
              add([option.label]);
              setText("");
              setOpen(false);
              input.current?.focus();
            }}
            empty={restrict ? "No matching options" : `Press Enter to add “${text.trim()}”`}
            side={side}
            grouped={false}
          />
        ) : null}
      </div>
      <p className="ml-visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
    </Field>
  );
}
