"use client";

import * as React from "react";
import { SegmentedControl } from "../segmented-control/segmented-control";
import { ActivityHeatmap, type DayCount } from "./activity-heatmap";

const END = "2026-09-24";
const DAY = 86_400_000;

/** Deterministic, lifelike activity: quiet weekends, busy streaks, days off. */
function demoActivity(days: number, seed: number, scale: number): DayCount[] {
  let state = seed;
  const random = () => ((state = (state * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const end = Date.parse(`${END}T00:00:00Z`);
  let streak = 0;
  return Array.from({ length: days }, (_, index) => {
    const time = end - (days - 1 - index) * DAY;
    const weekday = new Date(time).getUTCDay();
    streak = random() < 0.12 ? Math.floor(random() * 6) + 2 : Math.max(0, streak - 1);
    const weekend = weekday === 0 || weekday === 6;
    const active = streak > 0 || random() < (weekend ? 0.15 : 0.55);
    const count = active ? Math.round(scale * (0.2 + random() ** 2 * (streak ? 2.4 : 1)) * (weekend ? 0.5 : 1)) : 0;
    return { date: new Date(time).toISOString().slice(0, 10), count };
  });
}

const contributions = demoActivity(371, 7, 9);
const tokens = demoActivity(182, 42, 180_000);

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

const RANGES = [
  { value: "all", label: "All", days: 182 },
  { value: "30d", label: "30d", days: 30 },
  { value: "7d", label: "7d", days: 7 },
];

function UsageCard() {
  const [view, setView] = React.useState("overview");
  const [range, setRange] = React.useState("all");
  const days = RANGES.find((option) => option.value === range)?.days ?? 182;
  const inRange = tokens.slice(-days);
  const total = inRange.reduce((sum, day) => sum + day.count, 0);
  const active = inRange.filter((day) => day.count > 0).length;
  const stats = [
    { label: "Sessions", value: String(Math.round(active * 0.64)) },
    { label: "Messages", value: new Intl.NumberFormat("en").format(Math.round(total / 590)) },
    { label: "Total tokens", value: compact.format(total) },
    { label: "Active days", value: String(active) },
    { label: "Peak hour", value: "11 AM" },
    { label: "Favorite model", value: "Opus 5" },
  ];
  // A novel is about 250,000 tokens; the comparison makes a big number felt.
  const novels = Math.max(1, Math.round(total / 250_000));
  return (
    <section className="ml-usage-card" aria-label="Usage">
      <header className="ml-usage-card-header">
        <SegmentedControl
          label="View"
          value={view}
          onValueChange={setView}
          options={[
            { value: "overview", label: "Overview" },
            { value: "models", label: "Models" },
          ]}
        />
        <SegmentedControl label="Range" value={range} onValueChange={setRange} options={RANGES.map(({ value, label }) => ({ value, label }))} />
      </header>
      {view === "overview" ? (
        <>
          <dl className="ml-usage-card-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="ml-usage-card-stat">
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
          <ActivityHeatmap
            data={range === "all" ? tokens : tokens.map((day, index) => (index < tokens.length - days ? { ...day, count: 0 } : day))}
            end={END}
            weeks={26}
            unit="tokens"
            tone="info"
            formatCount={(count) => compact.format(count)}
            caption={null}
            label="Tokens per day"
          />
        </>
      ) : (
        <ul className="ml-usage-card-models">
          {[
            ["Opus 5", 0.62],
            ["Sonnet 5", 0.29],
            ["Haiku 4.5", 0.09],
          ].map(([name, share]) => (
            <li key={name as string} className="ml-usage-card-model">
              <span>{name}</span>
              <span className="ml-usage-card-bar" style={{ ["--ml-usage-share" as string]: share }} />
              <span className="ml-usage-card-share">{compact.format(total * (share as number))}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="ml-usage-card-fact">You’ve used ~{novels}× more tokens than a long novel.</p>
    </section>
  );
}

export default function ActivityHeatmapShowcase() {
  return (
    <div className="ml-activity-heatmap-showcase">
      <div className="ml-showcase-group">
        <p className="ml-showcase-group-label">Usage card</p>
        <UsageCard />
      </div>
      <div className="ml-showcase-group">
        <p className="ml-showcase-group-label">A year of contributions</p>
        <ActivityHeatmap data={contributions} end={END} weeks={53} unit="contributions" tone="success" />
        <p className="ml-showcase-note">Arrow keys move between days; each one is announced with its count.</p>
      </div>
    </div>
  );
}
