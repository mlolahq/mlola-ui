"use client";

import * as React from "react";
import { Select } from "./select";

export default function Showcase() {
  const [fruit, setFruit] = React.useState("");
  const [team, setTeam] = React.useState<string[]>(["design"]);
  const fruits = [
    { value: "apple", label: "Apple" },
    { value: "pear", label: "Pear" },
    { value: "cherry", label: "Cherry" },
    { value: "durian", label: "Durian", disabled: true },
  ];
  const grouped = [
    { value: "ada", label: "Ada Obi", group: "Engineering" },
    { value: "sara", label: "Sara Kim", group: "Engineering" },
    { value: "lena", label: "Lena Fischer", group: "Design" },
    { value: "hugo", label: "Hugo Diaz", group: "Growth" },
  ];
  const teams = [
    { value: "design", label: "Design" },
    { value: "platform", label: "Platform" },
    { value: "growth", label: "Growth" },
    { value: "support", label: "Support" },
    { value: "research", label: "Research" },
  ];
  return (
    <div className="ml-select-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Basic</h3>
        <div className="ml-showcase-columns">
          <Select label="Favorite fruit" options={fruits} value={fruit} onValueChange={setFruit} />
          <Select label="Clearable" options={fruits} defaultValue="pear" clearable />
        </div>
        <p className="ml-showcase-note">Durian is disabled, so keyboard navigation skips it.</p>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Searchable and grouped</h3>
        <div className="ml-showcase-columns">
          <Select label="Assignee" options={grouped} searchable clearable placeholder="Search people…" />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Multiple</h3>
        <div className="ml-showcase-columns">
          <Select label="Teams" multiple options={teams} value={team} onValueChange={setTeam} clearable placeholder="Pick teams" />
          <Select label="Many selected" multiple options={teams} defaultValue={["design", "platform", "growth", "support"]} maxVisibleChips={2} />
        </div>
        <p className="ml-showcase-note">The menu stays open while toggling; extra chips collapse into a counter.</p>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Sizes</h3>
        <div className="ml-showcase-columns">
          <Select label="Small" size="sm" options={fruits} defaultValue="apple" />
          <Select label="Medium" size="md" options={fruits} defaultValue="apple" />
          <Select label="Large" size="lg" options={fruits} defaultValue="apple" />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">States</h3>
        <div className="ml-showcase-columns">
          <Select label="Disabled" options={fruits} defaultValue="apple" disabled />
          <Select label="Invalid" options={fruits} error="Pick a fruit to continue." />
        </div>
      </section>
    </div>
  );
}
