"use client";

import * as React from "react";
import { Button } from "../button/button";
import { Tour } from "./tour";

export default function TourShowcase() {
  const [open, setOpen] = React.useState(false);
  const [finished, setFinished] = React.useState(false);
  return (
    <div className="ml-tour-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">A guided tour of a small app</h3>
        <div className="ml-tour-showcase-app">
          <header>
            <strong>Acme</strong>
            <input id="tour-search" className="ml-tour-showcase-search" placeholder="Search…" aria-label="Search" />
            <Button id="tour-new" size="sm">
              New project
            </Button>
          </header>
          <div className="ml-tour-showcase-body">
            <nav id="tour-nav">
              <span>Projects</span>
              <span>Team</span>
              <span>Settings</span>
            </nav>
            <div id="tour-stats" className="ml-tour-showcase-stats">
              <span>
                <b>12</b> projects
              </span>
              <span>
                <b>98%</b> uptime
              </span>
            </div>
          </div>
        </div>
        <div className="ml-showcase-row">
          <Button onClick={() => setOpen(true)}>Start the tour</Button>
          {finished ? <span className="ml-showcase-note">Tour finished.</span> : null}
        </div>
        <Tour
          open={open}
          onOpenChange={setOpen}
          onFinish={() => setFinished(true)}
          steps={[
            { title: "Welcome to Acme", body: "Four stops, under a minute. Use the arrow keys or the buttons; Escape ends it." },
            { target: "#tour-search", title: "Find anything", body: "Search projects, people and settings. Press / from anywhere.", side: "bottom" },
            { target: "#tour-new", title: "Start a project", body: "Projects hold your pages, files and team.", side: "bottom" },
            { target: "#tour-nav", title: "Move around", body: "Everything else lives in the sidebar.", side: "right" },
            { target: "#tour-stats", title: "Know how you are doing", body: "Health at a glance, updated live.", side: "top" },
          ]}
        />
      </section>
    </div>
  );
}
