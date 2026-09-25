"use client";

import * as React from "react";
import { Switch, Toggle } from "./toggle";

export default function Showcase() {
  const [notify, setNotify] = React.useState(true);
  const [marks, setMarks] = React.useState<string[]>(["bold"]);
  const toggleMark = (mark: string) =>
    setMarks((current) => (current.includes(mark) ? current.filter((entry) => entry !== mark) : [...current, mark]));
  return (
    <div className="ml-toggle-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Switch sizes</h3>
        <div className="ml-showcase-row">
          <Switch size="sm" label="Small" defaultChecked />
          <Switch size="md" label="Medium" defaultChecked />
          <Switch size="lg" label="Large" defaultChecked />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Switch states</h3>
        <div className="ml-showcase-row">
          <Switch label="Push notifications" checked={notify} onCheckedChange={setNotify} />
          <Switch label="Off" />
          <Switch label="Disabled" disabled />
          <Switch label="Disabled on" disabled defaultChecked />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Toggle buttons</h3>
        <p className="ml-showcase-note">Toggles report pressed state, so they suit formatting controls.</p>
        <div className="ml-showcase-row">
          {["bold", "italic", "underline"].map((mark) => (
            <Toggle key={mark} pressed={marks.includes(mark)} onPressedChange={() => toggleMark(mark)}>
              {mark}
            </Toggle>
          ))}
          <Toggle disabled>disabled</Toggle>
        </div>
      </section>
    </div>
  );
}
