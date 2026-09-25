"use client";

import * as React from "react";
import { RadioGroup, RadioGroupItem } from "./radio-group";

export default function Showcase() {
  const [plan, setPlan] = React.useState("pro");
  return (
    <div className="ml-radio-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">With descriptions</h3>
        <RadioGroup label="Choose a plan" value={plan} onValueChange={setPlan}>
          <RadioGroupItem value="starter" label="Starter" description="For side projects and prototypes." />
          <RadioGroupItem value="pro" label="Pro" description="For teams shipping production apps." />
          <RadioGroupItem value="team" label="Team" description="Shared workspaces and role-based access." />
          <RadioGroupItem value="enterprise" label="Enterprise" description="Contact sales for compliance needs." disabled />
        </RadioGroup>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Horizontal</h3>
        <RadioGroup label="Billing period" defaultValue="yearly" orientation="horizontal">
          <RadioGroupItem value="monthly" label="Monthly" />
          <RadioGroupItem value="yearly" label="Yearly" />
          <RadioGroupItem value="lifetime" label="Lifetime" />
        </RadioGroup>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Whole group disabled</h3>
        <RadioGroup label="Region" defaultValue="eu" disabled>
          <RadioGroupItem value="eu" label="Europe" />
          <RadioGroupItem value="us" label="United States" />
        </RadioGroup>
      </section>
    </div>
  );
}
