"use client";

import * as React from "react";
import { RenderSurface } from "./render-surface";

const CATALOG = "https://ui.mlola.com/a2ui/catalog/v1";
const V = "v0.9.1";
const surface = (surfaceId: string, components: unknown[], data?: unknown, theme?: { name: string; mode: string }) => [
  { version: V, createSurface: { surfaceId, catalogId: CATALOG, ...(theme ? { theme } : {}) } },
  { version: V, updateComponents: { surfaceId, components } },
  ...(data === undefined ? [] : [{ version: V, updateDataModel: { surfaceId, path: "/", value: data } }]),
];

const BOOKING = surface(
  "booking",
  [
    { id: "root", component: "Card", children: ["title", "form"] },
    { id: "title", component: "Heading", level: 3, text: "Book a table" },
    { id: "form", component: "Stack", children: ["name", "date", "guests", "seating", "notes", "remind", "actions"] },
    { id: "name", component: "Input", label: "Name", value: { path: "/booking/name" }, required: true },
    { id: "date", component: "DatePicker", label: "Day", value: { path: "/booking/day" }, min: "2026-10-12", max: "2026-12-31", required: true },
    { id: "guests", component: "Slider", label: "Guests", min: 1, max: 12, value: { path: "/booking/guests" } },
    { id: "seating", component: "Select", label: "Seating", options: [{ label: "Inside", value: "inside" }, { label: "Terrace", value: "terrace" }, { label: "By the window", value: "window" }], value: { path: "/booking/seating" } },
    { id: "notes", component: "Textarea", label: "Notes for the kitchen", hint: "Allergies, a high chair, a quiet corner.", value: { path: "/booking/notes" }, rows: 2 },
    { id: "remind", component: "Checkbox", label: "Remind me the day before", checked: { path: "/booking/remind" } },
    { id: "actions", component: "Row", children: ["book", "cancel"] },
    { id: "book", component: "Button", text: "Book the table", action: { event: { name: "book_table", context: { booking: { path: "/booking" } } } } },
    { id: "cancel", component: "Button", variant: "secondary", text: "Not now", action: { event: { name: "dismiss" } } },
  ],
  { booking: { name: "", day: null, guests: 2, seating: "inside", notes: "", remind: true } },
);

const ORDERS = surface(
  "orders",
  [
    { id: "root", component: "Stack", children: ["heading", "status", "progress", "table"] },
    { id: "heading", component: "Heading", level: 3, text: "This week's orders" },
    { id: "status", component: "Row", children: ["shipped", "waiting", "owner"] },
    { id: "shipped", component: "Badge", tone: "success", text: "42 shipped" },
    { id: "waiting", component: "Badge", tone: "warning", text: "3 waiting" },
    { id: "owner", component: "Avatar", name: "Nadia Putri", size: "sm", status: "online" },
    { id: "progress", component: "Progress", label: "Orders shipped", value: 42, max: 45, showLabel: true },
    { id: "table", component: "Table", caption: "Orders waiting to ship", columns: [{ key: "order", label: "Order" }, { key: "city", label: "City" }, { key: "items", label: "Items", align: "right" }, { key: "paid", label: "Paid" }], rows: { path: "/waiting" } },
  ],
  { waiting: [{ order: "#1041", city: "Surabaya", items: 2, paid: true }, { order: "#1042", city: "Bandung", items: 1, paid: false }, { order: "#1045", city: "Medan", items: 4, paid: true }] },
);

const TASKS = surface(
  "tasks",
  [
    { id: "root", component: "Stack", children: ["heading", "list", "add"] },
    { id: "heading", component: "Heading", level: 3, text: "Due today" },
    { id: "list", component: "Stack", children: { componentId: "task", path: "/tasks" } },
    { id: "task", component: "Row", children: ["done", "due"] },
    { id: "done", component: "Checkbox", label: { path: "title" }, checked: { path: "done" } },
    { id: "due", component: "Badge", tone: "warning", text: { path: "due" } },
    { id: "add", component: "Button", variant: "secondary", text: "Add a task", action: { event: { name: "add_task" } } },
  ],
  { tasks: [{ title: "Send the March invoice", done: false, due: "By 5 pm" }, { title: "Confirm the venue", done: true, due: "Noon" }, { title: "Reply to the caterer", done: false, due: "Today" }] },
);

const SETTINGS = surface(
  "settings",
  [
    { id: "root", component: "Stack", children: ["notice", "tabs", "faq", "empty"] },
    { id: "notice", component: "Alert", tone: "info", title: "Changes apply right away", text: "Nothing here needs saving." },
    { id: "tabs", component: "Tabs", label: "Settings", children: ["profile", "alerts"] },
    { id: "profile", component: "Tab", label: "Profile", children: ["display", "plan"] },
    { id: "alerts", component: "Tab", label: "Notifications", children: ["email", "push"] },
    { id: "display", component: "Input", label: "Display name", value: { path: "/name" } },
    { id: "plan", component: "RadioGroup", label: "Plan", options: [{ label: "Free", value: "free" }, { label: "Team", value: "team" }], value: { path: "/plan" }, orientation: "horizontal" },
    { id: "email", component: "Switch", label: "Email me a weekly summary", checked: { path: "/email" } },
    { id: "push", component: "Switch", label: "Push notifications", checked: { path: "/push" } },
    { id: "faq", component: "Accordion", children: ["q1", "q2"] },
    { id: "q1", component: "AccordionItem", title: "Who sees my display name?", children: ["a1"] },
    { id: "a1", component: "Text", text: "Everyone in your workspace.\nGuests see your initials." },
    { id: "q2", component: "AccordionItem", title: "Can I change plans later?", children: ["a2"] },
    { id: "a2", component: "Text", text: "At any time, from this tab." },
    { id: "empty", component: "EmptyState", title: "No connected apps yet", description: "Connect a calendar to see your day here.", children: ["connect"] },
    { id: "connect", component: "Button", variant: "outline", text: "Connect a calendar", action: { event: { name: "connect_calendar" } } },
  ],
  { name: "Nadia", plan: "team", email: true, push: false },
);

const THEMED = surface(
  "receipt",
  [
    { id: "root", component: "Card", variant: "elevated", children: ["title", "note", "done"] },
    { id: "title", component: "Heading", level: 3, text: "Payment received" },
    { id: "note", component: "Text", text: "We sent the receipt to lena@company.com." },
    { id: "done", component: "Button", text: "View the receipt", action: { event: { name: "view_receipt" } } },
  ],
  undefined,
  { name: "atelier", mode: "dark" },
);

// An update the check refuses: the surface keeps what it showed, and the agent is told why.
const REFUSED = [
  ...surface("status", [
    { id: "root", component: "Stack", children: ["state"] },
    { id: "state", component: "Badge", tone: "success", text: "Deployed" },
  ]),
  { version: V, updateComponents: { surfaceId: "status", components: [{ id: "state", component: "Badge", tone: "green", text: "Deployed", style: { color: "#00ff00" } }] } },
];

export default function RenderSurfaceShowcase() {
  const [sent, setSent] = React.useState("");
  const [refused, setRefused] = React.useState<string[]>([]);
  return (
    <div className="ml-render-surface-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">A form: required fields hold its action back, the other button goes freely</h3>
        <RenderSurface messages={BOOKING} today="2026-10-09" onAction={(message) => setSent(JSON.stringify(message.action, null, 2))} />
        <pre role="status" aria-label="What the agent received" tabIndex={0} className="ml-render-surface-showcase-sent">
          {sent || "Press a button to see the action the agent receives."}
        </pre>
      </section>
      <div className="ml-showcase-columns">
        <section className="ml-showcase-group">
          <h3 className="ml-showcase-group-label">Read-only data: badges, progress and a table from the data model</h3>
          <RenderSurface messages={ORDERS} />
        </section>
        <section className="ml-showcase-group">
          <h3 className="ml-showcase-group-label">A template: one component for each item of a list</h3>
          <RenderSurface messages={TASKS} />
        </section>
      </div>
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Containers: an alert, tabs, an accordion and an empty state</h3>
        <RenderSurface messages={SETTINGS} />
      </section>
      <div className="ml-showcase-columns">
        <section className="ml-showcase-group">
          <h3 className="ml-showcase-group-label">The theme the agent named</h3>
          <RenderSurface messages={THEMED} />
        </section>
        <section className="ml-showcase-group">
          <h3 className="ml-showcase-group-label">The same surface in the page&apos;s own theme</h3>
          <RenderSurface messages={THEMED} theme="inherit" />
        </section>
      </div>
      <div className="ml-showcase-columns">
        <section className="ml-showcase-group">
          <h3 className="ml-showcase-group-label">While messages are on their way</h3>
          <RenderSurface messages={[]} streaming fallback={<p className="ml-fine-print">The agent is composing a surface.</p>} />
        </section>
        <section className="ml-showcase-group">
          <h3 className="ml-showcase-group-label">A refused update: what was drawn stays, and the agent is told why</h3>
          <RenderSurface messages={REFUSED} onError={(messages) => setRefused(messages.map((message) => `${message.error.path}: ${message.error.message}`))} />
          <div role="status" aria-label="What the agent is told">
            {refused.length ? (
              <ul className="ml-render-surface-showcase-refused">
                {refused.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
