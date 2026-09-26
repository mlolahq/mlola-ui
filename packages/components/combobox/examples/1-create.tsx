"use client";

import * as React from "react";
import { Combobox } from "../combobox";

export const title = "Create what is missing";
export const description = "When the search finds nothing, the typed text can become a new option.";

export default function Example() {
  const [options, setOptions] = React.useState([
    { value: "design", label: "Design" },
    { value: "research", label: "Research" },
  ]);
  const [value, setValue] = React.useState<string | null>(null);
  return (
    <Combobox
      label="Label"
      placeholder="Find or create a label"
      options={options}
      value={value}
      onValueChange={setValue}
      onCreate={(text) => {
        const option = { value: text.toLowerCase(), label: text };
        setOptions((all) => [...all, option]);
        setValue(option.value);
      }}
    />
  );
}
