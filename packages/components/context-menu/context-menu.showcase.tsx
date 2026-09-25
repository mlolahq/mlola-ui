"use client";

import * as React from "react";
import { IconCopy, IconEdit, IconLink, IconShare, IconStar, IconTrash } from "@mlola-ui/icons";
import { ContextMenu } from "./context-menu";

const FILES = ["Launch plan.md", "Pricing FAQ.md", "Brand guidelines.pdf", "Q4 roadmap.xlsx"];

export default function ContextMenuShowcase() {
  const [grid, setGrid] = React.useState(true);
  const [last, setLast] = React.useState("Right-click a file, long-press it on a phone, or focus one and press Shift+F10.");
  return (
    <div className="ml-context-menu-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Menus built for what was clicked</h3>
        <ContextMenu
          label="File actions"
          items={(target) => {
            const file = (target as HTMLElement | null)?.closest<HTMLElement>("[data-file]")?.dataset.file;
            if (!file)
              return [
                { label: "New file", icon: <IconEdit size="1em" />, shortcut: "⌘N", onSelect: () => setLast("New file") },
                { label: "Show grid", checked: grid, onSelect: () => setGrid(!grid), separatorBefore: true },
              ];
            return [
              { label: "Open", icon: <IconEdit size="1em" />, shortcut: "↵", onSelect: () => setLast(`Opened ${file}`) },
              { label: "Copy link", icon: <IconLink size="1em" />, shortcut: "⌘L", onSelect: () => setLast(`Copied a link to ${file}`) },
              { label: "Duplicate", icon: <IconCopy size="1em" />, shortcut: "⌘D", onSelect: () => setLast(`Duplicated ${file}`) },
              { label: "Add to favourites", icon: <IconStar size="1em" />, onSelect: () => setLast(`Starred ${file}`) },
              { label: "Share…", icon: <IconShare size="1em" />, disabled: true },
              { label: "Delete", icon: <IconTrash size="1em" />, shortcut: "⌫", danger: true, separatorBefore: true, onSelect: () => setLast(`Deleted ${file}`) },
            ];
          }}
        >
          <ul className="ml-context-menu-showcase-files" data-grid={grid || undefined}>
            {FILES.map((file) => (
              <li key={file} data-file={file} tabIndex={0}>
                {file}
              </li>
            ))}
          </ul>
        </ContextMenu>
        <p className="ml-showcase-note">{last}</p>
      </section>
    </div>
  );
}
