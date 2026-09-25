"use client";

import { Badge } from "./badge";
import type { BadgeTone, BadgeVariant } from "./badge";

const TONES: BadgeTone[] = ["neutral", "primary", "info", "success", "warning", "danger"];
const VARIANTS: BadgeVariant[] = ["soft", "solid", "outline"];

export default function Showcase() {
  return (
    <div className="ml-badge-showcase">
      {VARIANTS.map((variant) => (
        <section key={variant} className="ml-showcase-group">
          <h3 className="ml-showcase-group-label">{variant === "soft" ? "Soft — the default" : variant === "solid" ? "Solid — for emphasis" : "Outline — the quietest"}</h3>
          <div className="ml-showcase-row">
            {TONES.map((tone) => (
              <Badge key={tone} tone={tone} variant={variant}>
                {tone}
              </Badge>
            ))}
          </div>
        </section>
      ))}

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Sizes</h3>
        <div className="ml-showcase-row">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
          <Badge size="lg">Large</Badge>
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">With status dot</h3>
        <div className="ml-showcase-row">
          <Badge dot tone="success">Live</Badge>
          <Badge dot tone="warning">Degraded</Badge>
          <Badge dot tone="danger">Offline</Badge>
          <Badge dot>Draft</Badge>
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Removable</h3>
        <div className="ml-showcase-row">
          <Badge onRemove={() => undefined}>Design</Badge>
          <Badge tone="primary" onRemove={() => undefined}>
            Engineering
          </Badge>
        </div>
      </section>
    </div>
  );
}
