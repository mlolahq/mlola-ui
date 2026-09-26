"use client";

import * as React from "react";
import { Button } from "../../button/button";
import { Alert, AlertDescription, AlertTitle } from "../alert";

export const title = "With an action, dismissible";
export const description = "An alert can offer the fix and step aside once it is read.";

export default function Example() {
  const [open, setOpen] = React.useState(true);
  if (!open) return <Button variant="secondary" onClick={() => setOpen(true)}>Show the alert again</Button>;
  return (
    <Alert tone="info" onDismiss={() => setOpen(false)} action={<Button size="sm" variant="secondary">Review</Button>}>
      <AlertTitle>Two invitations are waiting</AlertTitle>
      <AlertDescription>They expire in three days.</AlertDescription>
    </Alert>
  );
}
