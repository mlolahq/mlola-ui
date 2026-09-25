"use client";

import { IconDownload, IconPlus, IconSettings } from "@mlola-ui/icons";
import { Button } from "./button";
import type { ButtonVariant } from "./button";

export default function ButtonShowcase() {
  const variants: ButtonVariant[] = ["primary", "secondary", "outline", "subtle", "danger", "link"];
  return (
    <div className="ml-button-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Variants</h3>
        <div className="ml-showcase-row">
          {variants.map((variant) => (
            <Button key={variant} variant={variant}>{variant}</Button>
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Sizes</h3>
        <div className="ml-showcase-row">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Add item"><IconPlus aria-hidden="true" /></Button>
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">With icons</h3>
        <div className="ml-showcase-row">
          <Button><IconPlus aria-hidden="true" />New project</Button>
          <Button variant="secondary">Download<IconDownload aria-hidden="true" /></Button>
          <Button variant="outline"><IconSettings aria-hidden="true" />Settings</Button>
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">States</h3>
        <div className="ml-showcase-row">
          <Button loading>Saving</Button>
          <Button variant="secondary" loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button variant="secondary" disabled>Disabled</Button>
          <Button magnetic>Magnetic pull</Button>
        </div>
      </section>
    </div>
  );
}
