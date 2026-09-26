import { ActivityHeatmap } from "./activity-heatmap";

// Counts by day; days not listed count as zero.
const data = [
  { date: "2026-09-21", count: 3 },
  { date: "2026-09-22", count: 7 },
  { date: "2026-09-24", count: 1 },
  { date: "2026-09-25", count: 12 },
];

export default function Example() {
  return <ActivityHeatmap data={data} end="2026-09-26" weeks={8} unit="commit" label="Commits in the last eight weeks" />;
}
