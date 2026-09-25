"use client";

import * as React from "react";
import { Button } from "../button/button";
import { Stepper } from "./stepper";

const CHECKOUT = [{ label: "Cart" }, { label: "Shipping", description: "Address and speed" }, { label: "Payment" }, { label: "Review" }];

export default function StepperShowcase() {
  const [step, setStep] = React.useState(1);
  return (
    <div className="ml-stepper-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Checkout — click a done step to go back; narrow containers condense to “Step 2 of 4”</h3>
        <Stepper label="Checkout" steps={CHECKOUT} current={step} onStepChange={setStep} />
        <div className="ml-showcase-row">
          <Button variant="secondary" size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
            Back
          </Button>
          <Button size="sm" disabled={step === CHECKOUT.length - 1} onClick={() => setStep(step + 1)}>
            Continue
          </Button>
        </div>
      </section>
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Vertical, with an optional step and one that needs attention</h3>
        <Stepper
          label="Workspace setup"
          orientation="vertical"
          current={2}
          steps={[
            { label: "Create workspace", description: "Name and URL" },
            { label: "Connect GitHub", description: "Permission was revoked", error: true },
            { label: "Invite your team", optional: true },
            { label: "Pick a theme" },
          ]}
        />
      </section>
    </div>
  );
}
