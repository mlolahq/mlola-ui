"use client";

import * as React from "react";
import { IconMoon, IconPalette, IconPlus, IconSearch, IconSettings, IconSpark, IconUser } from "@mlola-ui/icons";
import { Button } from "../button/button";
import { Shortcut } from "../kbd/kbd";
import { CommandMenu, type CommandGroup } from "./command-menu";

export default function CommandMenuShowcase() {
  const [open, setOpen] = React.useState(false);
  const [ran, setRan] = React.useState<string | null>(null);
  const act = (label: string) => () => setRan(label);
  const groups: CommandGroup[] = [
    {
      heading: "Suggestions",
      items: [
        { id: "new", label: "New theme", description: "Describe a look in a sentence", icon: <IconPlus size="1em" />, shortcut: "mod+n", onSelect: act("New theme") },
        { id: "ask", label: "Ask Mlola", description: "Chat with the assistant", icon: <IconSpark size="1em" />, shortcut: "mod+j", onSelect: act("Ask Mlola") },
      ],
    },
    {
      heading: "Appearance",
      items: [
        { id: "dark", label: "Toggle dark mode", icon: <IconMoon size="1em" />, keywords: ["night", "theme"], shortcut: "mod+shift+l", onSelect: act("Toggle dark mode") },
        { id: "theme", label: "Change theme", icon: <IconPalette size="1em" />, keywords: ["graphite", "atelier", "nordic"], onSelect: act("Change theme") },
      ],
    },
    {
      heading: "Navigate",
      items: [
        { id: "search", label: "Search components", icon: <IconSearch size="1em" />, onSelect: act("Search components") },
        { id: "settings", label: "Settings", icon: <IconSettings size="1em" />, shortcut: "mod+,", onSelect: act("Settings") },
        { id: "account", label: "Account", icon: <IconUser size="1em" />, onSelect: act("Account") },
      ],
    },
  ];
  return (
    <div className="ml-command-menu-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Press the shortcut anywhere, or use the button</h3>
        <div className="ml-showcase-row">
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            Open command menu <Shortcut keys="mod+k" />
          </Button>
          <span className="ml-showcase-note" role="status">{ran ? `Ran “${ran}”` : "Try typing “tdm” for Toggle dark mode."}</span>
        </div>
        <CommandMenu groups={groups} open={open} onOpenChange={setOpen} />
      </section>
    </div>
  );
}
