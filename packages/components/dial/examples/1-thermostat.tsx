"use client";

import * as React from "react";
import { Dial } from "../dial";

export const title = "A thermostat";
export const description = "format says the value in a unit, and caption and tone follow what the value means.";

export default function Example() {
  const room = 19.5;
  const [target, setTarget] = React.useState(21);
  const heating = target > room;
  return (
    <Dial
      label="Living room"
      size="lg"
      min={10}
      max={30}
      step={0.5}
      value={target}
      onValueChange={setTarget}
      format={(value) => `${value.toFixed(1)} °C`}
      tone={heating ? "warning" : "info"}
      caption={heating ? `Heating from ${room} °C` : `Holding at ${room} °C`}
    />
  );
}
