"use client";

import * as React from "react";
import { Button } from "../button/button";
import { CommandMenu } from "./command-menu";

export default function Example() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Search commands</Button>
      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        groups={[
          {
            heading: "Project",
            items: [
              { id: "new", label: "New project", shortcut: "mod+n", onSelect: () => setOpen(false) },
              { id: "invite", label: "Invite a teammate", onSelect: () => setOpen(false) },
            ],
          },
        ]}
      />
    </>
  );
}
