"use client";

import { Spinner } from "./spinner";

export default function SpinnerShowcase() {
  return (
    <div className="ml-stack">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Sizes</h3>
        <div className="ml-showcase-row">
          <Spinner size="sm" label="Loading, small" />
          <Spinner label="Loading, medium" />
          <Spinner size="lg" label="Loading, large" />
        </div>
      </section>
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">It takes the color of the text around it</h3>
        <div className="ml-showcase-row">
          <span className="ml-cluster" style={{ color: "var(--ml-text-muted)" }}>
            <Spinner />
            Syncing changes
          </span>
          <span className="ml-cluster" style={{ color: "var(--ml-primary-text)" }}>
            <Spinner />
            Publishing
          </span>
        </div>
      </section>
    </div>
  );
}
