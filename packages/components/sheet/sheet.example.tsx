"use client";

import * as React from "react";
import { Button } from "../button/button";
import { Sheet, SheetBody, SheetFooter } from "./sheet";

export default function Example() {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Settings</Button>
      <Sheet open={open} onClose={close} title="Account settings" description="Changes apply instantly.">
        <SheetBody>Escape closes the panel, and so does the backdrop.</SheetBody>
        <SheetFooter>
          <Button onClick={close}>Done</Button>
        </SheetFooter>
      </Sheet>
    </>
  );
}
