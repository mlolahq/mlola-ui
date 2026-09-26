"use client";

import * as React from "react";
import { IconLink, IconShare } from "@mlola-ui/icons";
import { Button } from "../button/button";
import { Checkbox } from "../checkbox/checkbox";
import { Input } from "../input/input";
import { Popover } from "./popover";

export default function PopoverShowcase() {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="ml-popover-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Anchored to its trigger, flips and shifts to stay on screen</h3>
        <div className="ml-showcase-row">
          <Popover
            label="Share"
            trigger={
              <Button variant="secondary" size="sm">
                <IconShare aria-hidden="true" size="1em" />
                Share
              </Button>
            }
          >
            <div className="ml-showcase-stack">
              <strong>Share this theme</strong>
              <Input aria-label="Link" readOnly value="https://ui.mlola.com/t/th-62m10vqryb7f" leading={<IconLink size={14} />} />
              <Button size="sm" onClick={() => setCopied(true)}>
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          </Popover>
          <Popover label="Filter" side="bottom" align="end" trigger={<Button variant="outline" size="sm">Filter</Button>}>
            <div className="ml-showcase-stack">
              <strong>Status</strong>
              <Checkbox label="Running" defaultChecked />
              <Checkbox label="Needs attention" defaultChecked />
              <Checkbox label="Finished" />
            </div>
          </Popover>
          <Popover label="What is OKLCH?" side="top" trigger={<Button variant="subtle" size="sm">What is OKLCH?</Button>}>
            <p>A color space where lightness matches what the eye sees, so contrast can be solved instead of guessed.</p>
          </Popover>
        </div>
        <p className="ml-showcase-note">Escape, an outside click or tabbing away closes it; focus returns to the trigger.</p>
      </section>
    </div>
  );
}
