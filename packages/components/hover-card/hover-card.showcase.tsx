"use client";

import { Avatar } from "../avatar/avatar";
import { HoverCard } from "./hover-card";

export default function HoverCardShowcase() {
  return (
    <div className="ml-hover-card-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Rest the pointer on a name or a link, or Tab to it</h3>
        <p className="ml-hover-card-showcase-text">
          The editor was designed by{" "}
          <HoverCard
            content={
              <div className="ml-hover-card-showcase-profile">
                <Avatar name="Nadia Kusuma" size="md" status="online" />
                <div>
                  <strong>Nadia Kusuma</strong>
                  <span>Design engineer · Jakarta</span>
                  <p>Builds the block editor and the calendar. Likes spacing that adds up.</p>
                  <a href="#nadia">View profile</a>
                </div>
              </div>
            }
          >
            <a href="#nadia" className="ml-hover-card-showcase-link">
              @nadia
            </a>
          </HoverCard>{" "}
          and shipped in{" "}
          <HoverCard
            side="top"
            content={
              <div className="ml-hover-card-showcase-page">
                <strong>Release notes 1.4</strong>
                <p>Writing comes to the library: a rich text editor, a block editor and tracked AI edits.</p>
                <span>Updated yesterday · 4 min read</span>
              </div>
            }
          >
            <a href="#release" className="ml-hover-card-showcase-link">
              release 1.4
            </a>
          </HoverCard>
          .
        </p>
      </section>
    </div>
  );
}
