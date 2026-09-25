"use client";

import * as React from "react";
import { Slider } from "./slider";

export default function Showcase() {
  const [brightness, setBrightness] = React.useState(40);
  const [volume, setVolume] = React.useState(65);
  const [price, setPrice] = React.useState(250);
  return (
    <div className="ml-slider-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Basic</h3>
        <div className="ml-showcase-stack">
          <Slider label="Brightness" showValue value={brightness} onValueChange={setBrightness} />
          <Slider label="Volume" showValue value={volume} onValueChange={setVolume} />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Sizes</h3>
        <div className="ml-showcase-stack">
          <Slider label="Small" size="sm" defaultValue={30} showValue />
          <Slider label="Medium" size="md" defaultValue={30} showValue />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Range and step</h3>
        <p className="ml-showcase-note">Arrow keys move by one step; Home and End jump to the bounds.</p>
        <div className="ml-showcase-stack">
          <Slider label="Budget" min={0} max={1000} step={50} value={price} onValueChange={setPrice} showValue />
          <Slider label="Rating" min={1} max={5} step={1} defaultValue={4} showValue />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Disabled</h3>
        <div className="ml-showcase-stack">
          <Slider label="Locked" defaultValue={75} showValue disabled />
        </div>
      </section>
    </div>
  );
}
