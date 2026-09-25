"use client";

import { Textarea } from "./textarea";

export default function TextareaShowcase() {
  return (
    <div className="ml-textarea-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Grows with what is written</h3>
        <div className="ml-showcase-columns">
          <Textarea label="Release notes" hint="Markdown is supported." placeholder="What changed in this release?" />
          <Textarea label="Bio" maxLength={160} showCount defaultValue="Designs themes that survive dark mode." />
        </div>
      </section>
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Validation</h3>
        <Textarea label="Reason" required error="Tell us why before submitting." />
      </section>
    </div>
  );
}
