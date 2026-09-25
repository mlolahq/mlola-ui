"use client";

import * as React from "react";
import { Calendar, type DateRange } from "./calendar";
import { addDays, weekday } from "./dates";

const TODAY = "2026-09-24";

export default function CalendarShowcase() {
  const [single, setSingle] = React.useState<string | null>(TODAY);
  const [range, setRange] = React.useState<DateRange | null>({ from: "2026-09-21", to: "2026-09-27" });
  const [days, setDays] = React.useState<string[]>(["2026-09-08", "2026-09-15", "2026-09-22"]);
  return (
    <div className="ml-calendar-showcase">
      <div className="ml-showcase-row" data-align="start">
        <div className="ml-showcase-group">
          <p className="ml-showcase-group-label">One date</p>
          <Calendar value={single} onValueChange={setSingle} today={TODAY} />
          <p className="ml-showcase-note">Selected: {single ?? "none"}</p>
        </div>
        <div className="ml-showcase-group">
          <p className="ml-showcase-group-label">Several dates, weekends off</p>
          <Calendar mode="multiple" value={days} onValueChange={setDays} today={TODAY} isDisabled={(date) => weekday(date) === 0 || weekday(date) === 6} />
          <p className="ml-showcase-note">{days.length} dates picked</p>
        </div>
      </div>
      <div className="ml-showcase-group">
        <p className="ml-showcase-group-label">A range across two months, nothing before today</p>
        <Calendar mode="range" months={2} value={range} onValueChange={setRange} today={TODAY} min={TODAY} max={addDays(TODAY, 120)} />
        <p className="ml-showcase-note">
          {range ? `${range.from} → ${range.to ?? "…"}` : "No range"}. Arrows move by day and week, Page Up and Down by month.
        </p>
      </div>
    </div>
  );
}
