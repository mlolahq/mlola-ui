"use client";

import * as React from "react";
import { IconSearch } from "@mlola-ui/icons";
import { useControllableState } from "../_internal/react";
import { revealIn } from "../_internal/scroll";
import { Kbd, Shortcut } from "../kbd/kbd";
import { Modal } from "../modal/modal";
import { matchCommand } from "../_internal/match";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  /** e.g. "mod+shift+p", shown on the row. */
  shortcut?: string;
  /** Extra words that should find this command. */
  keywords?: string[];
  disabled?: boolean;
  onSelect: () => void;
}

export interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

export interface CommandMenuProps {
  groups: CommandGroup[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Toggles the menu from anywhere. `null` disables it. */
  hotkey?: string | null;
  placeholder?: string;
  label?: string;
}

function matchesHotkey(event: KeyboardEvent, hotkey: string) {
  const parts = hotkey.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const wantsMod = parts.includes("mod");
  const mod = event.metaKey || event.ctrlKey;
  return event.key.toLowerCase() === key && mod === wantsMod && event.shiftKey === parts.includes("shift") && event.altKey === parts.includes("alt");
}

function Highlight({ text, positions }: { text: string; positions: number[] }) {
  if (!positions.length) return <>{text}</>;
  const marked = new Set(positions);
  return (
    <>
      {[...text].map((char, index) =>
        marked.has(index) ? (
          <mark key={index} className="ml-command-match">
            {char}
          </mark>
        ) : (
          <React.Fragment key={index}>{char}</React.Fragment>
        ),
      )}
    </>
  );
}

/**
 * The ⌘K palette: every action a product offers, one keystroke away. Type to
 * rank commands (prefix, word start, substring, then letters in order), move
 * with the arrows, run with Enter.
 */
export function CommandMenu({ groups, open, defaultOpen = false, onOpenChange, hotkey = "mod+k", placeholder = "Type a command or search…", label = "Command menu" }: CommandMenuProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange });
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const listId = React.useId();

  React.useEffect(() => {
    if (!hotkey) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (matchesHotkey(event, hotkey)) {
        event.preventDefault();
        setOpen(!isOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hotkey, isOpen, setOpen]);

  const results = React.useMemo(() => {
    return groups
      .map((group) => ({
        heading: group.heading,
        items: group.items
          .map((item) => ({ item, match: matchCommand(item.label, query, item.keywords) }))
          .filter((entry): entry is { item: CommandItem; match: NonNullable<ReturnType<typeof matchCommand>> } => entry.match !== null)
          .sort((left, right) => (query.trim() ? right.match.score - left.match.score : 0)),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, query]);
  const flat = results.flatMap((group) => group.items);
  const current = Math.min(active, Math.max(0, flat.length - 1));

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  const run = (item: CommandItem | undefined) => {
    if (!item || item.disabled) return;
    close();
    item.onSelect();
  };

  let index = -1;
  return (
    <Modal open={isOpen} onClose={close} label={label} size="md" className="ml-command">
      <div className="ml-command-search">
        <IconSearch aria-hidden="true" size="1.1em" />
        <input
          className="ml-command-input"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={flat.length ? `${listId}-${current}` : undefined}
          aria-autocomplete="list"
          aria-label={label}
          placeholder={placeholder}
          value={query}
          autoFocus
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") setActive((current + 1) % Math.max(1, flat.length));
            else if (event.key === "ArrowUp") setActive((current - 1 + flat.length) % Math.max(1, flat.length));
            else if (event.key === "Home") setActive(0);
            else if (event.key === "End") setActive(Math.max(0, flat.length - 1));
            else if (event.key === "Enter") run(flat[current]?.item);
            else return;
            event.preventDefault();
          }}
        />
      </div>
      <div id={listId} role="listbox" aria-label="Commands" className="ml-command-list">
        {results.map((group) => (
          <div key={group.heading} role="group" aria-label={group.heading} className="ml-command-group">
            <p className="ml-command-heading" aria-hidden="true">
              {group.heading}
            </p>
            {group.items.map(({ item, match }) => {
              index += 1;
              const position = index;
              return (
                <div
                  key={item.id}
                  id={`${listId}-${position}`}
                  role="option"
                  aria-selected={position === current}
                  aria-disabled={item.disabled || undefined}
                  className="ml-command-item"
                  onPointerMove={() => setActive(position)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => run(item)}
                  ref={(node) => {
                    if (position === current && node) revealIn(node.closest<HTMLElement>(".ml-command-list"), node);
                  }}
                >
                  {item.icon ? <span className="ml-command-icon" aria-hidden="true">{item.icon}</span> : null}
                  <span className="ml-command-text">
                    <span className="ml-command-label">
                      <Highlight text={item.label} positions={match.positions} />
                    </span>
                    {item.description ? <span className="ml-command-description">{item.description}</span> : null}
                  </span>
                  {item.shortcut ? <Shortcut keys={item.shortcut} /> : null}
                </div>
              );
            })}
          </div>
        ))}
        {flat.length === 0 ? <p className="ml-command-empty">No commands match “{query.trim()}”.</p> : null}
      </div>
      <footer className="ml-command-footer" aria-hidden="true">
        <span>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> to move
        </span>
        <span>
          <Kbd>↵</Kbd> to run
        </span>
        <span>
          <Kbd>esc</Kbd> to close
        </span>
      </footer>
    </Modal>
  );
}
