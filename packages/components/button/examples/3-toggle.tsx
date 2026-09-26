"use client";

import * as React from "react";
import { IconBold, IconItalic, IconUnderline } from "@mlola-ui/icons";
import { Button } from "../button";

export const title = "As a toggle";
export const description = "aria-pressed turns a subtle button into an on and off switch, drawn filled while on.";

export default function Example() {
  const [marks, setMarks] = React.useState<string[]>(["bold"]);
  const toggle = (mark: string) => setMarks((on) => (on.includes(mark) ? on.filter((item) => item !== mark) : [...on, mark]));
  const tools = [
    { mark: "bold", label: "Bold", Icon: IconBold },
    { mark: "italic", label: "Italic", Icon: IconItalic },
    { mark: "underline", label: "Underline", Icon: IconUnderline },
  ];
  return (
    <div className="ml-cluster" role="toolbar" aria-label="Text style">
      {tools.map(({ mark, label, Icon }) => (
        <Button key={mark} variant="subtle" size="icon" aria-label={label} aria-pressed={marks.includes(mark)} onClick={() => toggle(mark)}>
          <Icon aria-hidden="true" size="1em" />
        </Button>
      ))}
    </div>
  );
}
