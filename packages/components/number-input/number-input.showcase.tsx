"use client";

import * as React from "react";
import { NumberInput } from "./number-input";

export default function NumberInputShowcase() {
  const [price, setPrice] = React.useState<number | null>(1299.5);
  const [seats, setSeats] = React.useState<number | null>(5);
  return (
    <div className="ml-number-input-showcase">
      <div className="ml-showcase-row" data-align="start">
        <NumberInput label="Price" value={price} onValueChange={setPrice} min={0} step={0.5} precision={2} format={{ style: "currency", currency: "USD" }} hint="Formatted at rest, plain while typing." />
        <NumberInput label="Seats" value={seats} onValueChange={setSeats} min={1} max={10} hint="Hold − or + to keep counting." />
      </div>
      <div className="ml-showcase-row" data-align="start">
        <NumberInput label="Weight" defaultValue={12.4} step={0.1} format={{ style: "unit", unit: "kilogram" }} />
        <NumberInput label="Harga" defaultValue={2500000} locale="id-ID" step={50000} format={{ style: "currency", currency: "IDR", maximumFractionDigits: 0 }} hint="Indonesian separators: type 2.500.000." />
        <NumberInput label="Quantity" buttons={false} placeholder="0" min={0} />
      </div>
      <p className="ml-showcase-note">
        Values: {price ?? "empty"} and {seats ?? "empty"}. Arrows step, Shift steps ten, Page keys step ten, Home and End go to the bounds.
      </p>
    </div>
  );
}
