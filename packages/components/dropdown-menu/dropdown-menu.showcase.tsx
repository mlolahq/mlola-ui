"use client";

import * as React from "react";
import { IconCopy, IconDownload, IconEdit, IconExternalLink, IconFilePlus, IconFolderOpen, IconTrash, IconUser } from "@mlola-ui/icons";
import { DropdownMenu } from "./dropdown-menu";

export default function Showcase() {
  const [status, setStatus] = React.useState("No action selected.");
  return (
    <div className="ml-dropdown-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">With icons and shortcuts</h3>
        <div className="ml-showcase-row">
          <DropdownMenu
            trigger="File"
            label="File actions"
            onSelect={setStatus}
            items={[
              { label: "New file", icon: <IconFilePlus aria-hidden="true" />, shortcut: "⌘N" },
              { label: "Open…", icon: <IconFolderOpen aria-hidden="true" />, shortcut: "⌘O" },
              { label: "Duplicate", icon: <IconCopy aria-hidden="true" />, shortcut: "⇧⌘D" },
              { label: "Rename", icon: <IconEdit aria-hidden="true" />, separatorBefore: true },
              { label: "Export", icon: <IconDownload aria-hidden="true" />, disabled: true },
              { label: "Delete", icon: <IconTrash aria-hidden="true" />, danger: true, shortcut: "⌫", separatorBefore: true },
            ]}
          />
          <DropdownMenu
            trigger="Share"
            label="Share options"
            onSelect={setStatus}
            items={[
              { label: "Copy link", icon: <IconCopy aria-hidden="true" /> },
              { label: "Invite people", icon: <IconUser aria-hidden="true" /> },
              { label: "Publish to web", icon: <IconExternalLink aria-hidden="true" /> },
            ]}
          />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Alignment</h3>
        <p className="ml-showcase-note">End alignment keeps the menu inside the viewport for right-hand triggers.</p>
        <div className="ml-showcase-row">
          <DropdownMenu
            trigger="Align start"
            align="start"
            onSelect={setStatus}
            items={[{ label: "First" }, { label: "Second" }, { label: "Third" }]}
          />
          <DropdownMenu
            trigger="Align end"
            align="end"
            onSelect={setStatus}
            items={[{ label: "First" }, { label: "Second" }, { label: "Third" }]}
          />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Text only</h3>
        <div className="ml-showcase-row">
          <DropdownMenu
            trigger="Sort by"
            label="Sort order"
            onSelect={setStatus}
            items={[
              { label: "Newest first" },
              { label: "Oldest first" },
              { label: "Name A to Z" },
              { label: "Name Z to A" },
            ]}
          />
        </div>
        <p aria-live="polite" className="ml-dropdown-status">{status}</p>
      </section>
    </div>
  );
}
