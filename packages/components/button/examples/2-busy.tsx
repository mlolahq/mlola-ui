"use client";

import * as React from "react";
import { Button } from "../button";

export const title = "While it works";
export const description = "A busy button keeps its color, shows a spinner and says what it is doing; a second press does nothing.";

export default function Example() {
  const [saving, setSaving] = React.useState(false);
  const save = () => {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 1600);
  };
  return (
    <Button loading={saving} onClick={save}>
      {saving ? "Saving…" : "Save changes"}
    </Button>
  );
}
