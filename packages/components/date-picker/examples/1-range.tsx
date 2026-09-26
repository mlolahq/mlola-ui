import { DatePicker } from "../date-picker";

export const title = "A range with presets";
export const description = "Presets cover the common ranges; the calendar covers the rest.";

export default function Example() {
  return (
    <DatePicker
      mode="range"
      label="Report period"
      today="2026-09-14"
      defaultValue={{ from: "2026-09-01", to: "2026-09-14" }}
      presets={[
        { label: "Last 7 days", value: { from: "2026-09-08", to: "2026-09-14" } },
        { label: "This month", value: { from: "2026-09-01", to: "2026-09-30" } },
      ]}
    />
  );
}
