import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

// Mlola Render without a framework (packages/behavior/src/render/dom.js):
// the same surfaces as the React renderer, drawn as the components' markup,
// with the runtime's behaviors attached. The browser journeys are in
// tests/e2e/framework-free.spec.ts.

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://localhost/" });
const { window } = dom;
for (const key of ["window", "document", "navigator", "HTMLElement", "Element", "Node", "CustomEvent", "Event", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: key === "window" ? window : window[key] });
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { mountRender } = await import("../packages/behavior/src/render/dom.js");
const rules = (await import("../packages/behavior/src/render/rules.js")).default;
const full = JSON.parse(fs.readFileSync(path.join(root, "packages/registry/generated/render-rules.json"), "utf8"));
const V = "v0.9.1";
const example = (name) => full.examples.find((entry) => entry.name === name).messages;
const create = (surfaceId = "s", extra = {}) => ({ version: V, createSurface: { surfaceId, catalogId: rules.catalogId, ...extra } });
const update = (components, surfaceId = "s") => ({ version: V, updateComponents: { surfaceId, components } });
const data = (pointer, value, surfaceId = "s") => ({ version: V, updateDataModel: { surfaceId, path: pointer, value } });

function mount(options = {}) {
  const element = document.createElement("div");
  document.body.append(element);
  const sent = [];
  const refused = [];
  const view = mountRender(element, { rules, onAction: (message) => sent.push(message), onError: (messages) => refused.push(...messages), ...options });
  return { element, view, sent, refused, done: () => (view.destroy(), element.remove()) };
}
const field = (element, label) => {
  const found = [...element.querySelectorAll("label")].find((entry) => entry.textContent.replace("*", "").trim() === label);
  assert.ok(found, `no field labeled ${label}`);
  return document.getElementById(found.htmlFor);
};
const button = (element, name) => [...element.querySelectorAll("button")].find((entry) => entry.textContent.trim() === name);
const type = (control, value) => {
  control.value = value;
  control.dispatchEvent(new window.Event("input", { bubbles: true }));
};

test("the rules a page loads are the catalog, less the examples an agent reads", () => {
  const { examples, $comment, ...rest } = full;
  assert.deepEqual(rules.examples, []);
  assert.deepEqual({ ...rules, examples: undefined, $comment: undefined }, { ...rest, examples: undefined, $comment: undefined });
});

test("a form draws as the components' markup, and what a person types comes back with the action", () => {
  const { element, view, sent, done } = mount();
  view.receive(example("workspace-signup"));
  const surface = element.querySelector(".ml-render-surface");
  assert.equal(surface.dataset.theme, "graphite");
  assert.equal(element.querySelector("h2").textContent, "Create your workspace");
  assert.ok(element.querySelector('.ml-card[data-variant="default"] .ml-card-content'));
  type(field(element, "Workspace name"), "Atlas Studio");
  type(field(element, "Work email"), "lena@company.com");
  const team = element.querySelector('input[type="radio"][value="team"]');
  team.checked = true;
  team.dispatchEvent(new window.Event("change", { bubbles: true }));
  button(element, "Create workspace").click();
  assert.deepEqual(sent.map((message) => [message.action.name, message.action.context]), [["create_workspace", { form: { name: "Atlas Studio", email: "lena@company.com", plan: "team" } }]]);
  done();
});

test("a required field left empty keeps the action back, marks the field and takes focus", () => {
  const { element, view, sent, done } = mount();
  view.receive(example("workspace-signup"));
  button(element, "Create workspace").click();
  assert.equal(sent.length, 0);
  const name = field(element, "Workspace name");
  assert.equal(document.activeElement, name);
  assert.equal(name.getAttribute("aria-invalid"), "true");
  assert.equal(element.querySelector(".ml-render > [role=status]").textContent, "Fill in Workspace name, Work email first.");
  type(name, "Atlas Studio");
  assert.equal(name.getAttribute("aria-invalid"), null);
  done();
});

test("typing keeps the field it happens in: data changes update in place, never rebuild", () => {
  const { element, view, done } = mount();
  view.receive(example("workspace-signup"));
  const name = field(element, "Workspace name");
  name.focus();
  type(name, "Atl");
  assert.equal(field(element, "Workspace name"), name);
  assert.equal(document.activeElement, name);
  done();
});

test("a template draws a row for each item; a longer list rebuilds and keeps the open tab", () => {
  const { element, view, done } = mount();
  view.receive([
    create(),
    update([
      { id: "root", component: "Tabs", label: "Lists", children: ["first", "second"] },
      { id: "first", component: "Tab", label: "First", children: ["note"] },
      { id: "second", component: "Tab", label: "Second", children: ["list"] },
      { id: "note", component: "Text", text: "Nothing here" },
      { id: "list", component: "Stack", children: { componentId: "row", path: "/items" } },
      { id: "row", component: "Checkbox", label: { path: "title" }, checked: { path: "done" } },
    ]),
    data("/items", [{ title: "One", done: false }, { title: "Two", done: true }]),
  ]);
  const tabs = () => [...element.querySelectorAll('[role="tab"]')];
  tabs()[1].click();
  assert.equal(tabs()[1].getAttribute("aria-selected"), "true");
  view.receive(data("/items/2", { title: "Three", done: false }));
  assert.deepEqual([...element.querySelectorAll(".ml-checkbox-text")].map((label) => label.textContent), ["One", "Two", "Three"]);
  assert.equal(tabs()[1].getAttribute("aria-selected"), "true");
  // Ticking a row writes to its own item.
  const boxes = element.querySelectorAll('input[type="checkbox"]');
  boxes[2].checked = true;
  boxes[2].dispatchEvent(new window.Event("change", { bubbles: true }));
  assert.equal(view.host.dataModel("s").items[2].done, true);
  done();
});

test("the switch, select and slider write through the runtime's ml-change", () => {
  const { element, view, done } = mount();
  view.receive([
    create(),
    update([
      { id: "root", component: "Stack", children: ["alerts", "size", "volume"] },
      { id: "alerts", component: "Switch", label: "Email alerts", checked: { path: "/alerts" } },
      { id: "size", component: "Select", label: "Size", options: [{ label: "Small", value: "s" }, { label: "Large", value: "l" }], value: { path: "/size" }, placeholder: "Pick a size" },
      { id: "volume", component: "Slider", label: "Volume", value: { path: "/volume" }, min: 0, max: 10 },
    ]),
    data("/", { alerts: false, size: "", volume: 4 }),
  ]);
  element.querySelector('[role="switch"]').click();
  assert.equal(view.host.dataModel("s").alerts, true);
  assert.equal(element.querySelector(".ml-select-value").textContent, "Pick a size");
  element.querySelector(".ml-select").click();
  element.querySelector('.ml-select-option[data-value="l"]').click();
  assert.equal(view.host.dataModel("s").size, "l");
  assert.equal(element.querySelector(".ml-select-value").textContent, "Large");
  const thumb = element.querySelector('[role="slider"]');
  assert.equal(thumb.getAttribute("aria-valuenow"), "4");
  thumb.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  assert.equal(view.host.dataModel("s").volume, 5);
  done();
});

test("every component of the catalog draws, and what the agent wrote stays text", () => {
  const { element, view, refused, done } = mount();
  view.receive([
    create("all", { theme: { name: "nordic", mode: "dark" } }),
    update(
      [
        { id: "root", component: "Stack", children: ["grid", "alert", "empty", "tabs", "faq", "date", "area", "badge", "progress", "avatar", "table"] },
        { id: "grid", component: "Grid", columns: "2", children: ["h", "t"] },
        { id: "h", component: "Heading", level: 2, text: "<img src=x onerror=alert(1)>" },
        { id: "t", component: "Text", text: "Two\nlines" },
        { id: "alert", component: "Alert", tone: "danger", title: "Stopped", text: "The deploy stopped." },
        { id: "empty", component: "EmptyState", title: "Nothing yet" },
        { id: "tabs", component: "Tabs", label: "Views", children: ["one"] },
        { id: "one", component: "Tab", label: "One", children: [] },
        { id: "faq", component: "Accordion", children: ["q"] },
        { id: "q", component: "AccordionItem", title: "Why?", children: ["a"] },
        { id: "a", component: "Text", text: "Because." },
        { id: "date", component: "DatePicker", label: "Arrival", value: "2026-10-12", min: "2026-10-01" },
        { id: "area", component: "Textarea", label: "Notes", rows: 3 },
        { id: "badge", component: "Badge", text: "New", tone: "info" },
        { id: "progress", component: "Progress", label: "Upload", value: 30, showLabel: true },
        { id: "avatar", component: "Avatar", name: "Nadia Putri", status: "online" },
        { id: "table", component: "Table", caption: "Orders", columns: [{ key: "order", label: "Order" }, { key: "paid", label: "Paid", align: "right" }], rows: [{ order: "#1041", paid: true }, { order: "#1042" }] },
      ],
      "all",
    ),
  ]);
  assert.deepEqual(refused, []);
  assert.equal(element.querySelector("img"), null);
  assert.equal(element.querySelector("h2").textContent, "<img src=x onerror=alert(1)>");
  for (const selector of [".ml-grid[data-columns='2']", ".ml-alert[role=alert] .ml-alert-icon svg", ".ml-empty h3.ml-empty-title", ".ml-tabs[data-ml=tabs]", ".ml-accordion[data-ml=accordion] h3 .ml-accordion-trigger", "input.ml-input[type=date][min='2026-10-01']", "textarea.ml-textarea[rows='3']", ".ml-badge[data-tone=info]", ".ml-progress-track[aria-valuenow='30']", ".ml-avatar-fallback[aria-label='Nadia Putri']", ".ml-table caption"]) {
    assert.ok(element.querySelector(selector), `nothing drew ${selector}`);
  }
  assert.equal(element.querySelector(".ml-avatar-fallback").textContent, "NP");
  assert.deepEqual([...element.querySelectorAll("tbody td")].map((cell) => cell.textContent), ["#1041", "Yes", "#1042", "—"]);
  done();
});

test("a refused update changes nothing on screen and reaches the agent in A2UI's error", () => {
  const { element, view, refused, done } = mount();
  view.receive([create(), update([{ id: "root", component: "Badge", text: "Deployed", tone: "success" }])]);
  view.receive(update([{ id: "root", component: "Badge", text: "Broken", tone: "green" }]));
  assert.equal(element.querySelector(".ml-badge").textContent, "Deployed");
  assert.deepEqual(refused.map((message) => message.error.path), ["/components/0/tone"]);
  view.receive({ version: V, deleteSurface: { surfaceId: "s" } });
  assert.equal(element.querySelector(".ml-render-surface"), null);
  done();
});
