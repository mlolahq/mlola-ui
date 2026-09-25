"use client";

import * as React from "react";
import { Avatar } from "../avatar/avatar";
import { VirtualList } from "./virtual-list";

const NAMES = ["Nadia Kusuma", "Ryan Walker", "Sari Wijaya", "Fikri Firdaus", "Mei Lestari", "Omar Haddad", "Lena Fischer", "Rohan Mehta"];
const EVENTS = ["deployed the preview", "commented on the pricing page", "merged the editor branch", "opened a bug about dark mode", "invited two teammates", "published theme Nordic Night"];

export default function VirtualListShowcase() {
  const [count, setCount] = React.useState(10_000);
  const [loading, setLoading] = React.useState(false);
  return (
    <div className="ml-virtual-list-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">{count.toLocaleString()} rows of different heights, and more load near the end</h3>
        <div className="ml-virtual-list-showcase-frame">
          <VirtualList
            count={count}
            label="Activity"
            estimateSize={56}
            onEndReached={() => {
              if (loading) return;
              setLoading(true);
              window.setTimeout(() => {
                setCount((current) => current + 1000);
                setLoading(false);
              }, 600);
            }}
            renderItem={(index) => {
              const name = NAMES[index % NAMES.length];
              return (
                <div className="ml-virtual-list-showcase-row">
                  <Avatar size="sm" name={name} />
                  <p>
                    <strong>{name}</strong> {EVENTS[index % EVENTS.length]}
                    {index % 4 === 0 ? <span className="ml-virtual-list-showcase-note">Longer rows are measured as they appear: “Looks great on mobile too — the drawer keeps its place and the list never jumps.”</span> : null}
                  </p>
                  <span className="ml-virtual-list-showcase-index">#{index + 1}</span>
                </div>
              );
            }}
          />
        </div>
        <p className="ml-showcase-note">{loading ? "Loading 1,000 more…" : "Only the rows on screen exist in the page."}</p>
      </section>
    </div>
  );
}
