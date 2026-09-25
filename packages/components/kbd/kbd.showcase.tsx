"use client";

import { Kbd, Shortcut } from "./kbd";

export default function KbdShowcase() {
  return (
    <div className="ml-kbd-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Shortcuts read the visitor&apos;s platform: ⌘ on a Mac, Ctrl elsewhere</h3>
        <div className="ml-showcase-row">
          <Shortcut keys="mod+k" />
          <Shortcut keys="mod+shift+p" />
          <Shortcut keys="shift+enter" />
          <Shortcut keys="alt+up" />
        </div>
        <p>
          Press <Kbd>Esc</Kbd> to close, or <Shortcut keys="mod+enter" /> to send.
        </p>
      </section>
    </div>
  );
}
