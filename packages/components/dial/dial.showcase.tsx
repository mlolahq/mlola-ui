"use client";

import * as React from "react";
import { Dial } from "./dial";

const celsius = (value: number) => `${value.toFixed(1)} °C`;

export default function Showcase() {
  const [target, setTarget] = React.useState(21.5);
  const [fan, setFan] = React.useState(2);
  const room = 19.8;
  const heating = target > room;
  return (
    <div className="ml-dial-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">A thermostat</h3>
        <p className="ml-showcase-note">Press the ring to jump to a value, or hold the knob and turn it. Escape during a turn puts the value back.</p>
        <Dial
          label="Living room"
          size="lg"
          min={10}
          max={30}
          step={0.5}
          value={target}
          onValueChange={setTarget}
          format={celsius}
          tone={heating ? "warning" : "info"}
          caption={heating ? `Heating from ${celsius(room)}` : `Holding at ${celsius(room)}`}
        />
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Sizes</h3>
        <div className="ml-showcase-row" data-align="start">
          <Dial label="Small" size="sm" defaultValue={30} />
          <Dial label="Medium" size="md" defaultValue={50} />
          <Dial label="Large" size="lg" defaultValue={70} />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Tones</h3>
        <div className="ml-showcase-row" data-align="start">
          {(["primary", "info", "success", "warning", "danger"] as const).map((tone) => (
            <Dial key={tone} label={tone} size="sm" tone={tone} defaultValue={60} />
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Few steps, read as words</h3>
        <p className="ml-showcase-note">Arrow keys move one step; Home and End go to the ends.</p>
        <Dial label="Fan" min={0} max={4} step={1} value={fan} onValueChange={setFan} format={(value) => (value === 0 ? "Off" : `Speed ${value}`)} caption="Ceiling fan in the bedroom" />
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Disabled</h3>
        <Dial label="Locked by the schedule" defaultValue={40} disabled format={(value) => `${value}%`} />
      </section>
    </div>
  );
}
