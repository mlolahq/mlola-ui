"use client";

import { CopyButton } from "./copy-button";

export default function CopyButtonShowcase() {
  return (
    <div className="ml-stack">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Icon only, beside what it copies</h3>
        <div className="ml-cluster">
          <code>npm install @mlola-ui/engine</code>
          <CopyButton value="npm install @mlola-ui/engine" label="Copy command" variant="subtle" />
        </div>
      </section>
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">With text</h3>
        <div className="ml-cluster">
          <CopyButton value="https://ui.mlola.com/invite/3fa9" size="sm">Copy invite link</CopyButton>
          <CopyButton value="sk_live_****" variant="outline" size="sm" label="Copy key">Copy key</CopyButton>
        </div>
      </section>
    </div>
  );
}
