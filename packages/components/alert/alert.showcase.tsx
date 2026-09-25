"use client";

import * as React from "react";
import { Button } from "../button/button";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import type { AlertTone } from "./alert";

export default function Showcase() {
  const [shown, setShown] = React.useState(true);
  const tones: Array<{ tone: AlertTone; title: string; body: string }> = [
    { tone: "neutral", title: "Heads up", body: "This workspace is running the latest release." },
    { tone: "info", title: "New version available", body: "Version 2.4 adds dark mode across every block." },
    { tone: "success", title: "Changes published", body: "Your edits are live for everyone on the team." },
    { tone: "warning", title: "Trial ending", body: "Your Pro trial ends in three days. Add billing to keep access." },
    { tone: "danger", title: "Deploy failed", body: "Step 3 exited with code 1. Check the build log for details." },
  ];
  return (
    <div className="ml-alert-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Variants</h3>
        <div className="ml-showcase-stack">
          {tones.map(({ tone, title, body }) => (
            <Alert key={tone} tone={tone}>
              <AlertTitle>{title}</AlertTitle>
              <AlertDescription>{body}</AlertDescription>
            </Alert>
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Soft — tinted, for a banner across a page</h3>
        <div className="ml-showcase-stack">
          {tones.map(({ tone, title, body }) => (
            <Alert key={tone} tone={tone} variant="soft">
              <AlertTitle>{title}</AlertTitle>
              <AlertDescription>{body}</AlertDescription>
            </Alert>
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">With action and dismiss</h3>
        <div className="ml-showcase-stack">
          <Alert
            tone="warning"
            action={
              <Button size="sm" variant="secondary">
                Add billing
              </Button>
            }
          >
            <AlertTitle>Payment method missing</AlertTitle>
            <AlertDescription>Add a card before the trial ends to avoid interruption.</AlertDescription>
          </Alert>
          {shown ? (
            <Alert tone="info" onDismiss={() => setShown(false)}>
              <AlertTitle>Dismissible</AlertTitle>
              <AlertDescription>It eases out before onDismiss runs, so the page closes smoothly around it.</AlertDescription>
            </Alert>
          ) : (
            <div>
              <Button size="sm" variant="subtle" onClick={() => setShown(true)}>
                Show it again
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Title only</h3>
        <div className="ml-showcase-stack">
          <Alert tone="success"><AlertTitle>Saved</AlertTitle></Alert>
          <Alert tone="danger"><AlertTitle>Connection lost</AlertTitle></Alert>
        </div>
      </section>
    </div>
  );
}
