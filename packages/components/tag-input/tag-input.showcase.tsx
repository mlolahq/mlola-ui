"use client";

import * as React from "react";
import { TagInput } from "./tag-input";

const TOPICS = ["design", "engineering", "research", "marketing", "ai", "accessibility", "performance", "security"].map((topic) => ({ value: topic, label: topic }));

export default function TagInputShowcase() {
  const [emails, setEmails] = React.useState(["nadia@mlola.dev", "ryan@mlola.dev"]);
  const [topics, setTopics] = React.useState(["design", "ai"]);
  return (
    <div className="ml-tag-input-showcase">
      <div className="ml-showcase-row" data-align="start">
        <TagInput
          label="Invite by email"
          value={emails}
          onValueChange={setEmails}
          placeholder="name@company.com"
          validate={(tag) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tag) ? null : `“${tag}” is not an email address.`)}
          transform={(tag) => tag.trim().toLowerCase()}
          hint="Paste a list; commas and new lines split it."
        />
        <TagInput label="Topics" value={topics} onValueChange={setTopics} suggestions={TOPICS} restrict max={4} placeholder="Add a topic…" hint="Only listed topics, up to four." />
      </div>
      <div className="ml-showcase-row" data-align="start">
        <TagInput label="Keywords" defaultValue={["tokens", "themes"]} placeholder="Type and press Enter" hint="Backspace marks the last tag, then removes it." />
        <TagInput label="Locked" defaultValue={["archived"]} disabled />
      </div>
    </div>
  );
}
