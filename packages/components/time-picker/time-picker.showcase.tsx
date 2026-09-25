"use client";

import * as React from "react";
import { TimePicker } from "./time-picker";

export default function TimePickerShowcase() {
  const [meeting, setMeeting] = React.useState<string | null>("09:30");
  const [alarm, setAlarm] = React.useState<string | null>("06:45");
  return (
    <div className="ml-time-picker-showcase">
      <div className="ml-showcase-row" data-align="start">
        <TimePicker label="Meeting starts" hourCycle={12} step={5} value={meeting} onValueChange={setMeeting} min="07:00" max="20:00" hint="Type digits or use the arrows." />
        <TimePicker label="Alarm (24-hour)" hourCycle={24} value={alarm} onValueChange={setAlarm} />
        <TimePicker label="Reminder" hourCycle={12} listStep={15} />
      </div>
      <div className="ml-showcase-row" data-align="start">
        <TimePicker
          label="Delivery window"
          hourCycle={24}
          step={15}
          min="08:00"
          max="18:00"
          disabledTimes="12:00-13:00"
          defaultValue="11:45"
          hint="08:00–18:00, closed 12:00–13:00. The hour arrows jump the break; a typed time inside it snaps out."
        />
        <TimePicker
          label="Book a call"
          hourCycle={12}
          enabledTimes={["09:00", "10:30", "13:15", "15:00", "16:45"]}
          hint="Only these five slots can be picked."
        />
      </div>
      <p className="ml-showcase-note">
        Values: {meeting ?? "empty"} and {alarm ?? "empty"}, always "HH:MM" in 24-hour time.
      </p>
    </div>
  );
}
