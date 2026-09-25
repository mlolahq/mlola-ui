"use client";

import { Resizable } from "./resizable";

export default function ResizableShowcase() {
  return (
    <div className="ml-resizable-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Drag the handle, or focus it and use the arrow keys</h3>
        <Resizable
          className="ml-card"
          style={{ height: "18rem", padding: 0 }}
          defaultSize={40}
          first={<div className="ml-showcase-stack" style={{ padding: "1rem" }}><strong>Conversation</strong><p className="ml-showcase-note">The agent&apos;s messages and work log.</p></div>}
          second={
            <Resizable
              direction="vertical"
              defaultSize={60}
              label="Resize diff and terminal"
              first={<div className="ml-showcase-stack" style={{ padding: "1rem" }}><strong>Diff</strong><p className="ml-showcase-note">Changes for the selected turn.</p></div>}
              second={<div className="ml-showcase-stack" style={{ padding: "1rem" }}><strong>Terminal</strong><p className="ml-showcase-note">npm test — 214 passed.</p></div>}
            />
          }
        />
        <p className="ml-showcase-note">Shift+arrow moves by 10%. Double-click restores the default split.</p>
      </section>
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">App layout: a pixel sidebar that collapses, and a right-hand inspector</h3>
        <Resizable
          className="ml-card"
          style={{ height: "18rem", padding: 0 }}
          units="pixels"
          defaultSize={220}
          min={180}
          max={360}
          collapsible
          label="Resize sidebar"
          first={<div className="ml-showcase-stack" style={{ padding: "1rem" }}><strong>Threads</strong><p className="ml-showcase-note">Drag past the edge, or press Enter on the handle, to fold it away.</p></div>}
          second={
            <Resizable
              anchor="second"
              units="pixels"
              defaultSize={260}
              min={200}
              max={420}
              label="Resize inspector"
              first={<div className="ml-showcase-stack" style={{ padding: "1rem" }}><strong>Canvas</strong><p className="ml-showcase-note">Takes whatever is left.</p></div>}
              second={<div className="ml-showcase-stack" style={{ padding: "1rem" }}><strong>Inspector</strong><p className="ml-showcase-note">Keeps its width as the window grows.</p></div>}
            />
          }
        />
      </section>
    </div>
  );
}
