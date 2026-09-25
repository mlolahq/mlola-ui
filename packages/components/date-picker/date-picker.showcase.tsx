"use client";

import * as React from "react";
import { DatePicker, rangePresets, type DateRange } from "./date-picker";

const TODAY = "2026-09-24";

export default function DatePickerShowcase() {
  const [date, setDate] = React.useState<string | null>("2026-10-02");
  const [range, setRange] = React.useState<DateRange | null>(null);
  return (
    <div className="ml-date-picker-showcase">
      <div className="ml-showcase-row" data-align="start">
        <DatePicker label="Launch date" hint="Shown to customers in their own format." value={date} onValueChange={setDate} today={TODAY} />
        <DatePicker mode="range" label="Report period" value={range} onValueChange={setRange} presets={rangePresets(TODAY)} today={TODAY} placeholder="Any time" />
      </div>
      <div className="ml-showcase-row" data-align="start">
        <DatePicker label="Due date" error="Pick a date after the kickoff." today={TODAY} />
        <DatePicker label="Archived" disabled defaultValue="2026-08-01" today={TODAY} />
      </div>
      <div className="ml-showcase-row" data-align="start">
        <DatePicker
          label="Delivery day"
          hint="Weekdays from tomorrow, not on 5 October."
          disabledDates={[{ before: "2026-09-25" }, { dayOfWeek: [0, 6] }, "2026-10-05"]}
          today={TODAY}
        />
        <DatePicker
          mode="range"
          label="Stay"
          hint="2 to 7 nights; ranges stop at booked days."
          disabledDates={[{ before: TODAY }, { from: "2026-10-08", to: "2026-10-10" }, "2026-10-17"]}
          minDays={3}
          maxDays={8}
          presets={[]}
          today={TODAY}
        />
        <DatePicker
          label="Office hours"
          hint="Only Tuesdays and Thursdays in October."
          enabledDates={(date) => date.startsWith("2026-10") && [2, 4].includes(new Date(date).getUTCDay())}
          today={TODAY}
        />
      </div>
    </div>
  );
}
