"use client";

import { IconGitBranch, IconGitCommit, IconGitPullRequest, IconRefresh, IconTriangleAlert, IconUser } from "@mlola-ui/icons";
import { Timeline, TimelineItem } from "./timeline";

const glyph = (Icon: typeof IconUser) => <Icon aria-hidden="true" size="0.875rem" />;

export default function Showcase() {
  return (
    <div className="ml-timeline-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Release history — the rail fills as the sequence progresses</h3>
        <Timeline>
          <TimelineItem status="complete" time="Jan 12" dateTime="2026-01-12" title="v2.4 — Dark mode" description="System-aware theming rolled out across all components." />
          <TimelineItem status="complete" time="Mar 3" dateTime="2026-03-03" title="v2.5 — Command palette" description="Keyboard-first navigation with fuzzy search." />
          <TimelineItem status="current" time="Sep 1" dateTime="2026-09-01" title="v2.6 — Realtime collaboration" description="Live cursors and presence are in public beta." />
          <TimelineItem status="upcoming" time="Nov 15" dateTime="2026-11-15" title="v3.0 — Plugin API" description="Third-party extensions with sandboxed permissions." />
        </Timeline>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Activity feed — icons, tones and rich content</h3>
        <Timeline>
          <TimelineItem status="complete" icon={glyph(IconGitBranch)} time="2h ago" title="Nadia created the branch feat/editor" />
          <TimelineItem status="complete" icon={glyph(IconGitCommit)} time="1h ago" title="3 commits pushed" description="Block editor, slash menu, drag to reorder." />
          <TimelineItem status="complete" tone="danger" icon={glyph(IconTriangleAlert)} time="48m ago" title="Preview deploy failed" description="Type error in block-editor.tsx:212." />
          <TimelineItem status="complete" tone="info" icon={glyph(IconUser)} time="30m ago" title="Ryan commented">
            <blockquote className="ml-timeline-showcase-quote">Slash menu feels great. Can Escape close it without losing the query?</blockquote>
          </TimelineItem>
          <TimelineItem status="current" tone="success" icon={glyph(IconGitPullRequest)} time="Just now" title="Ready for review" />
          <TimelineItem status="upcoming" icon={glyph(IconRefresh)} title="Merge and release" />
        </Timeline>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Order tracking</h3>
        <Timeline>
          <TimelineItem status="complete" time="09:12" title="Order placed" />
          <TimelineItem status="complete" time="11:40" title="Payment captured" />
          <TimelineItem status="current" time="14:05" title="Packed and awaiting carrier" />
          <TimelineItem status="upcoming" title="Out for delivery" />
          <TimelineItem status="upcoming" title="Delivered" />
        </Timeline>
      </section>
    </div>
  );
}
