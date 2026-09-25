"use client";

import * as React from "react";
import { ColorPicker } from "./color-picker";

const BRAND = ["#111111", "#6b7280", "#e11d48", "#f97316", "#eab308", "#16a34a", "#0a84ff", "#7c3aed"];

export default function ColorPickerShowcase() {
  const [brand, setBrand] = React.useState("#0a84ff");
  const [accent, setAccent] = React.useState("oklch(62% 0.19 25)");
  return (
    <div className="ml-color-picker-showcase">
      <div className="ml-showcase-row" data-align="start">
        <ColorPicker label="Brand colour" value={brand} onValueChange={setBrand} swatches={BRAND} hint="With presets and a contrast check." />
        <ColorPicker label="Accent (OKLCH)" value={accent} onValueChange={setAccent} format="oklch" hint="Returns oklch(), as the theme engine uses." />
        <ColorPicker label="Overlay" defaultValue="#11111180" alpha format="rgb" hint="With opacity." />
      </div>
      <p className="ml-showcase-note">
        Values: {brand} and {accent}.
      </p>
    </div>
  );
}
