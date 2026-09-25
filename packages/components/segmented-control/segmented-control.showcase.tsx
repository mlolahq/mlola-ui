"use client";

import * as React from "react";
import { SegmentedControl } from "./segmented-control";

export default function Showcase() {
  const [period, setPeriod] = React.useState("monthly");

  return (
    <div className="ml-showcase-stack">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Single select</h3>
        <SegmentedControl
          label="Billing period"
          value={period}
          onValueChange={setPeriod}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" },
          ]}
        />
        <p className="ml-showcase-note">Selected: {period}</p>
      </section>
    </div>
  );
}
