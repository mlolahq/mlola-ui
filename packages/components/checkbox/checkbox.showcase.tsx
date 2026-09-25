"use client";

import * as React from "react";
import { Checkbox } from "./checkbox";

export default function Showcase() {
  const [checked, setChecked] = React.useState(true);
  const [partial, setPartial] = React.useState(false);
  return (
    <div className="ml-checkbox-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">States</h3>
        <div className="ml-showcase-stack">
          <Checkbox label="Unchecked" />
          <Checkbox label="Checked" checked={checked} onCheckedChange={setChecked} />
          <Checkbox label="Indeterminate" indeterminate checked={partial} onCheckedChange={setPartial} />
          <Checkbox label="Disabled" disabled />
          <Checkbox label="Disabled and checked" disabled defaultChecked />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">With description</h3>
        <div className="ml-showcase-stack">
          <Checkbox label="Email notifications" description="Receive a weekly digest of workspace activity." defaultChecked />
          <Checkbox label="Product updates" description="Occasional release notes. No marketing." />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Validation</h3>
        <div className="ml-showcase-stack">
          <Checkbox label="Accept terms" required error="You must accept the terms." />
        </div>
      </section>
    </div>
  );
}
