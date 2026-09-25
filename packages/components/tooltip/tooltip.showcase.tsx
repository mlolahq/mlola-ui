"use client";

import { IconCopy } from "@mlola-ui/icons";
import { Tooltip } from "./tooltip";
import type { TooltipPlacement } from "./tooltip";

export default function Showcase() {
  const placements: TooltipPlacement[] = ["top", "right", "bottom", "left"];
  return (
    <div className="ml-tooltip-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Placement</h3>
        <p className="ml-showcase-note">Hover or focus any trigger. Escape dismisses an open tooltip.</p>
        <div className="ml-showcase-row">
          {placements.map((placement) => (
            <Tooltip key={placement} placement={placement} content={`Anchored ${placement}`}>
              <button type="button" className="ml-button" data-variant="secondary" data-size="sm">
                {placement}
              </button>
            </Tooltip>
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Delay</h3>
        <div className="ml-showcase-row">
          <Tooltip delay={0} content="Opens immediately">
            <button type="button" className="ml-button" data-variant="secondary" data-size="sm">No delay</button>
          </Tooltip>
          <Tooltip delay={200} content="Opens after 200ms">
            <button type="button" className="ml-button" data-variant="secondary" data-size="sm">Default</button>
          </Tooltip>
          <Tooltip delay={600} content="Opens after 600ms">
            <button type="button" className="ml-button" data-variant="secondary" data-size="sm">Patient</button>
          </Tooltip>
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Content</h3>
        <div className="ml-showcase-row">
          <Tooltip content="Copy to clipboard">
            <button type="button" className="ml-button" data-variant="subtle" data-size="sm" aria-label="Copy">
              <IconCopy aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip content="Rich content works too: keyboard shortcuts, hints, and short help text.">
            <button type="button" className="ml-button" data-variant="secondary" data-size="sm">Long text</button>
          </Tooltip>
          <Tooltip content="Disabled triggers still describe themselves">
            <span tabIndex={0} className="ml-button" data-variant="secondary" data-size="sm" aria-disabled="true">
              Non-button
            </span>
          </Tooltip>
        </div>
      </section>
    </div>
  );
}
