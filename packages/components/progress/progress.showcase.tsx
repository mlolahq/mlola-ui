"use client";

import * as React from "react";
import { Button } from "../button/button";
import { CircularProgress, Progress } from "./progress";
import type { ProgressTone } from "./progress";

/**
 * A pretend upload whose speed drifts smoothly, the way a real transfer
 * speeds up and slows down, reported ten times a second.
 */
function useUpload() {
  const [value, setValue] = React.useState(0);
  const [running, setRunning] = React.useState(true);
  React.useEffect(() => {
    if (!running) return;
    let current = 0;
    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;
      // Between about 0.4% and 2% per tick, rising and falling like a network.
      const speed = 1.2 + Math.sin(tick / 7) * 0.6 + Math.sin(tick / 3.1) * 0.2;
      current = Math.min(100, current + speed);
      setValue(current);
      if (current >= 100) {
        window.clearInterval(timer);
        setRunning(false);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [running]);
  return {
    value,
    running,
    restart: () => {
      setValue(0);
      setRunning(true);
    },
  };
}

export default function ProgressShowcase() {
  const tones: ProgressTone[] = ["primary", "success", "warning", "danger"];
  const upload = useUpload();
  return (
    <div className="ml-progress-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Live — a light sweeps along while work runs, and the bar glows once when it is done</h3>
        <div className="ml-showcase-stack">
          <Progress label={upload.running ? "Uploading design-tokens.zip" : "Uploaded design-tokens.zip"} value={upload.value} tone={upload.running ? "primary" : "success"} active showLabel />
          <div className="ml-showcase-row">
            <CircularProgress value={upload.value} tone={upload.running ? "primary" : "success"} showLabel size="lg" label="Upload" />
            <Button size="sm" variant="secondary" onClick={upload.restart} disabled={upload.running}>
              Upload again
            </Button>
          </div>
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Tones</h3>
        <div className="ml-showcase-stack">
          {tones.map((tone, index) => (
            <Progress key={tone} tone={tone} label={["Upload", "Backup", "Storage used", "Quota"][index]} value={25 + index * 22} showLabel />
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Sizes</h3>
        <div className="ml-showcase-stack">
          <Progress size="sm" value={40} label="Small" />
          <Progress size="md" value={40} label="Medium" />
          <Progress size="lg" value={40} label="Large" />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Indeterminate</h3>
        <p className="ml-showcase-note">When the total is unknown a segment glides across; with reduced motion it breathes instead.</p>
        <div className="ml-showcase-stack">
          <Progress indeterminate label="Syncing" showLabel />
        </div>
        <div className="ml-showcase-row">
          <CircularProgress indeterminate size="sm" label="Loading" />
          <CircularProgress indeterminate label="Loading" />
          <CircularProgress indeterminate size="lg" tone="success" label="Loading" />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Circular</h3>
        <div className="ml-showcase-row">
          <CircularProgress value={25} showLabel label="Profile" />
          <CircularProgress value={65} tone="success" showLabel label="Tests" />
          <CircularProgress value={90} tone="warning" showLabel label="Storage" />
          <CircularProgress value={100} tone="success" showLabel label="Done" />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Custom max</h3>
        <div className="ml-showcase-stack">
          <Progress value={3} max={7} label="Onboarding steps" showLabel />
        </div>
      </section>
    </div>
  );
}
