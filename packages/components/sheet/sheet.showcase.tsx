"use client";

import * as React from "react";
import { Sheet, SheetBody, SheetFooter, SheetHeader } from "./sheet";
import type { SheetSide, SheetSize } from "./sheet";

export default function Showcase() {
  const [side, setSide] = React.useState<SheetSide | null>(null);
  const [size, setSize] = React.useState<SheetSize | null>(null);
  const sides: SheetSide[] = ["left", "right", "top", "bottom"];
  const sizes: SheetSize[] = ["sm", "md", "lg"];
  const close = () => {
    setSide(null);
    setSize(null);
  };
  return (
    <div className="ml-sheet-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Side</h3>
        <div className="ml-showcase-row">
          {sides.map((value) => (
            <button key={value} type="button" className="ml-button" data-variant="secondary" data-size="sm" onClick={() => setSide(value)}>
              {value}
            </button>
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Size</h3>
        <div className="ml-showcase-row">
          {sizes.map((value) => (
            <button key={value} type="button" className="ml-button" data-variant="secondary" data-size="sm" onClick={() => setSize(value)}>
              {value}
            </button>
          ))}
        </div>
        <p className="ml-showcase-note">Focus stays inside the panel and returns to the trigger on close.</p>
      </section>

      <Sheet open={side !== null} onClose={close} side={side ?? "right"} title="Account settings" description="Changes apply instantly.">
        <SheetHeader title={`Anchored ${side ?? "right"}`} description="Changes apply instantly." onClose={close} />
        <SheetBody>
          <div className="ml-showcase-stack">
            <p>The panel slides from the chosen edge and keeps the same internal rhythm.</p>
            <p>Escape closes it, and the backdrop is clickable.</p>
          </div>
        </SheetBody>
        <SheetFooter>
          <button type="button" className="ml-button" data-variant="secondary" onClick={close}>Cancel</button>
          <button type="button" className="ml-button" data-variant="primary" onClick={close}>Done</button>
        </SheetFooter>
      </Sheet>

      <Sheet open={size !== null} onClose={close} size={size ?? "md"} title="Filters" description="Narrow the result set.">
        <SheetHeader title={`Size ${size ?? "md"}`} description="Narrow the result set." onClose={close} />
        <SheetBody>Width follows the size token while the height fills the edge.</SheetBody>
        <SheetFooter>
          <button type="button" className="ml-button" data-variant="primary" onClick={close}>Apply</button>
        </SheetFooter>
      </Sheet>
    </div>
  );
}
