"use client";

import * as React from "react";
import { Avatar } from "../avatar/avatar";
import { Combobox, type ComboboxOption } from "./combobox";

const COUNTRIES: ComboboxOption[] = [
  ["id", "Indonesia", "Asia"],
  ["sg", "Singapore", "Asia"],
  ["jp", "Japan", "Asia"],
  ["in", "India", "Asia"],
  ["de", "Germany", "Europe"],
  ["nl", "Netherlands", "Europe"],
  ["fr", "France", "Europe"],
  ["gb", "United Kingdom", "Europe"],
  ["us", "United States", "Americas"],
  ["br", "Brazil", "Americas"],
  ["ca", "Canada", "Americas"],
].map(([value, label, group]) => ({ value, label, group, keywords: [value] }));

const PEOPLE = ["Nadia Kusuma", "Ryan Walker", "Sari Wijaya", "Fikri Firdaus", "Mei Lestari", "Omar Haddad"].map((name) => ({
  value: name.toLowerCase().replace(/\s/g, "-"),
  label: name,
  description: `${name.split(" ")[0].toLowerCase()}@mlola.dev`,
  leading: <Avatar size="xs" name={name} />,
}));

export default function ComboboxShowcase() {
  const [country, setCountry] = React.useState<string | null>("id");
  const [owner, setOwner] = React.useState<string | null>(null);
  const [tags, setTags] = React.useState<ComboboxOption[]>([{ value: "design", label: "design" }, { value: "engineering", label: "engineering" }]);
  const [tag, setTag] = React.useState<string | null>(null);
  return (
    <div className="ml-combobox-showcase">
      <div className="ml-showcase-row" data-align="start">
        <Combobox label="Country" options={COUNTRIES} value={country} onValueChange={setCountry} hint="Type “ger” or the code “nl”." />
        <Combobox label="Owner" options={PEOPLE} value={owner} onValueChange={setOwner} placeholder="Search people…" />
      </div>
      <div className="ml-showcase-row" data-align="start">
        <Combobox
          label="Team"
          options={tags}
          value={tag}
          onValueChange={setTag}
          placeholder="Find or create…"
          onCreate={(text) => {
            const value = text.toLowerCase();
            setTags((all) => [...all, { value, label: value }]);
            setTag(value);
          }}
          hint="Type something new to create it."
        />
        <Combobox label="Region" options={COUNTRIES} disabled defaultValue="sg" />
      </div>
      <p className="ml-showcase-note">
        Values: {country ?? "none"}, {owner ?? "none"}, {tag ?? "none"}.
      </p>
    </div>
  );
}
