"use client";

import * as React from "react";
import { Button } from "../../button/button";
import { Dial } from "../dial";

export const title = "In a form";
export const description = "With a name, the dial submits its value like a native input.";

export default function Example() {
  const [sent, setSent] = React.useState<string | null>(null);
  return (
    <form
      className="ml-stack"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(String(new FormData(event.currentTarget).get("speed")));
      }}
    >
      <Dial label="Fan speed" name="speed" size="sm" min={0} max={4} step={1} defaultValue={2} format={(value) => (value === 0 ? "Off" : String(value))} />
      <Button type="submit" variant="secondary">
        Save
      </Button>
      <p role="status">{sent === null ? "" : `Saved speed ${sent}`}</p>
    </form>
  );
}
