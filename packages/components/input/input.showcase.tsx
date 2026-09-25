"use client";

import { Input } from "./input";
import type { InputVariant } from "./input";

export default function Showcase() {
  const variants: InputVariant[] = ["default", "filled", "subtle"];
  return (
    <div className="ml-input-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Variants</h3>
        <div className="ml-showcase-columns">
          {variants.map((variant) => (
            <Input key={variant} label={variant} variant={variant} placeholder="you@company.com" />
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Sizes</h3>
        <div className="ml-showcase-columns">
          <Input label="Small" size="sm" placeholder="Small" />
          <Input label="Medium" size="md" placeholder="Medium" />
          <Input label="Large" size="lg" placeholder="Large" />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Hint, error, and required</h3>
        <div className="ml-showcase-columns">
          <Input label="Email" type="email" hint="We never share your address." placeholder="you@company.com" />
          <Input label="Token" error="Token has expired." defaultValue="mk_live_2f91" />
          <Input label="Workspace" required placeholder="acme" hint="Lowercase letters and dashes only." />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Types and states</h3>
        <div className="ml-showcase-columns">
          <Input label="Password" type="password" defaultValue="correct-horse" />
          <Input label="Search" type="search" placeholder="Search orders…" />
          <Input label="Amount" type="number" defaultValue={240} />
          <Input label="Read only" defaultValue="mlola-ui" readOnly />
          <Input label="Disabled" placeholder="Unavailable" disabled />
        </div>
      </section>
    </div>
  );
}
