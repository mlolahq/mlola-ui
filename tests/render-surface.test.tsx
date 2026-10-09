import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, test } from "node:test";
import { JSDOM } from "jsdom";

// Render Surface: the React renderer of Mlola Render. Every catalog component
// draws from an agent's messages, fields write to the data model, and a
// pressed Button answers with A2UI's action (docs/render.md).

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true, url: "http://localhost/" });
const { window } = dom;
Object.defineProperty(globalThis, "navigator", { configurable: true, value: window.navigator });
Object.assign(globalThis, { window, document: window.document, IS_REACT_ACT_ENVIRONMENT: true });
for (const key of Object.getOwnPropertyNames(window)) {
  if (key in globalThis) continue;
  Object.defineProperty(globalThis, key, { configurable: true, get: () => (window as unknown as Record<string, unknown>)[key] });
}

const React = await import("react");
(globalThis as unknown as { React: typeof React }).React = React;
const { act } = React;
const { createRoot } = await import("react-dom/client");
const { RenderSurface } = await import("../packages/components/render-surface/render-surface");
const { createRenderHost } = await import("../packages/behavior/src/render/core.js");

const ROOT = path.resolve(import.meta.dirname, "..");
const rules = JSON.parse(fs.readFileSync(path.join(ROOT, "packages/registry/generated/render-rules.json"), "utf8"));
const V = "v0.9.1";
const example = (name: string) => rules.examples.find((entry: { name: string }) => entry.name === name).messages as unknown[];
const create = (surfaceId = "s", extra = {}) => ({ version: V, createSurface: { surfaceId, catalogId: rules.catalogId, ...extra } });
const update = (components: unknown[], surfaceId = "s") => ({ version: V, updateComponents: { surfaceId, components } });
const data = (pointer: string, value: unknown, surfaceId = "s") => ({ version: V, updateDataModel: { surfaceId, path: pointer, value } });

const errors: string[] = [];
const original = console.error;
before(() => {
  console.error = (...args: unknown[]) => errors.push(args.map(String).join(" ").split("\n")[0]);
});
after(() => {
  console.error = original;
  assert.deepEqual(errors, [], "React reported an error or a warning");
});

async function mount(element: React.ReactElement) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  return {
    host,
    render: (next: React.ReactElement) => act(async () => root.render(next)),
    unmount: async () => {
      await act(async () => root.unmount());
      host.remove();
    },
  };
}

/** Types into a field the way a person does: the value changes, then the field says so. */
async function type(field: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype = field instanceof window.HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(field, value);
    field.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}
const click = (element: Element) => act(async () => (element as HTMLElement).click());
const labeled = (host: Element, label: string) => {
  const found = [...host.querySelectorAll("label")].find((entry) => entry.textContent?.replace("*", "").trim() === label);
  assert.ok(found, `no field labeled ${label}`);
  return document.getElementById(found.htmlFor) as HTMLInputElement;
};
const button = (host: Element, name: string) => {
  const found = [...host.querySelectorAll("button")].find((entry) => entry.textContent?.trim() === name);
  assert.ok(found, `no button called ${name}`);
  return found;
};

test("a surface draws in its theme, with the fields of the form and the values they are bound to", async () => {
  const view = await mount(<RenderSurface messages={example("workspace-signup")} />);
  const surface = view.host.querySelector(".ml-render-surface")!;
  assert.equal(surface.getAttribute("data-theme"), "graphite");
  assert.equal(surface.getAttribute("data-mode"), "system");
  assert.equal(view.host.querySelector("h2")?.textContent, "Create your workspace");
  assert.equal(labeled(view.host, "Workspace name").value, "");
  assert.equal(labeled(view.host, "Work email").type, "email");
  assert.equal((view.host.querySelector('input[type="radio"]:checked') as HTMLInputElement).value, "free");
  assert.ok(button(view.host, "Create workspace"));
  await view.unmount();
});

test("every component of the catalog draws from an agent's messages", async () => {
  // One of each, built from the catalog alone, so a component added to it must draw here.
  const sample = (prop: { kind: string; values?: string[]; minimum?: number; align?: { values: string[] } }): unknown => {
    switch (prop.kind) {
      case "text": return "Words";
      case "boolean": return true;
      case "number": return 1;
      case "integer": return prop.minimum;
      case "date": return "2026-10-12";
      case "enum": return prop.values![0];
      case "action": return { event: { name: "go" } };
      case "options": return [{ label: "One", value: "one" }, { label: "Two", value: "two" }];
      case "columns": return [{ key: "name", label: "Name" }, { key: "done", label: "Done" }];
      case "rows": return [{ name: "Ayu", done: true }, { name: "Raka", done: null }];
      default: throw new Error(`no sample for ${prop.kind}`);
    }
  };
  type Definition = { parents?: string[]; accepts?: string[]; props: Record<string, { kind: string; required?: boolean }> };
  const definitions = rules.components as Record<string, Definition>;
  const components: Array<Record<string, unknown>> = [];
  const top: string[] = [];
  const ids = (type: string) => `${type.toLowerCase()}-1`;
  for (const [type, definition] of Object.entries(definitions)) {
    const component: Record<string, unknown> = { id: ids(type), component: type };
    for (const [name, prop] of Object.entries(definition.props)) {
      if (prop.kind === "children") component[name] = definition.accepts ? definition.accepts.map(ids) : [];
      else if (prop.required || prop.kind === "enum") component[name] = sample(prop);
    }
    components.push(component);
    if (!definition.parents) top.push(ids(type));
  }
  const messages = [create(), update([{ id: "root", component: "Stack", children: top.filter((id) => id !== "stack-1") }, ...components.filter((component) => component.id !== "stack-1")])];
  const refused: unknown[] = [];
  const view = await mount(<RenderSurface messages={messages} today="2026-10-09" onError={(sent) => refused.push(...sent)} />);
  assert.deepEqual(refused, []);
  const html = view.host.innerHTML;
  for (const expected of ["ml-cluster", "ml-grid", "ml-card", "ml-alert", "ml-empty", "ml-tabs", "ml-accordion", "ml-input", "ml-textarea", "ml-select", "ml-radio-group", "ml-checkbox", "ml-switch", "ml-slider", "ml-date-picker", "ml-button", "ml-badge", "ml-progress", "ml-avatar", "ml-table"]) {
    assert.ok(html.includes(expected), `nothing drew ${expected}`);
  }
  // A Tab and an AccordionItem are drawn by their container: the tab's name, the section's title.
  assert.equal(view.host.querySelector('[role="tab"]')?.textContent, "Words");
  assert.ok(view.host.querySelector(".ml-accordion-heading"));
  // A table says true and nothing in words.
  assert.deepEqual([...view.host.querySelectorAll("tbody td")].map((cell) => cell.textContent), ["Ayu", "Yes", "Raka", "—"]);
  await view.unmount();
});

test("what a person types is written to the data model and comes back with the action", async () => {
  const sent: Array<{ action: { name: string; context: Record<string, unknown> } }> = [];
  const view = await mount(<RenderSurface messages={example("workspace-signup")} onAction={(message) => sent.push(message)} />);
  await type(labeled(view.host, "Workspace name"), "Atlas Studio");
  await type(labeled(view.host, "Work email"), "lena@company.com");
  await click(view.host.querySelector('input[type="radio"][value="team"]')!);
  await click(button(view.host, "Create workspace"));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].action.name, "create_workspace");
  assert.deepEqual(sent[0].action.context, { form: { name: "Atlas Studio", email: "lena@company.com", plan: "team" } });
  await view.unmount();
});

test("a required field left empty keeps the action, says so, and takes focus", async () => {
  const sent: unknown[] = [];
  const view = await mount(<RenderSurface messages={example("workspace-signup")} onAction={(message) => sent.push(message)} />);
  await type(labeled(view.host, "Workspace name"), "Atlas Studio");
  await click(button(view.host, "Create workspace"));
  assert.equal(sent.length, 0);
  const email = labeled(view.host, "Work email");
  assert.equal(document.activeElement, email);
  assert.equal(email.getAttribute("aria-invalid"), "true");
  assert.equal(view.host.querySelector('.ml-input-error')?.textContent, "Fill in this field.");
  assert.equal(view.host.querySelector('.ml-render > [role="status"]')?.textContent, "Fill in Work email first.");
  // Filling it in clears the error, and the action goes.
  await type(email, "lena@company.com");
  assert.equal(email.getAttribute("aria-invalid"), null);
  await click(button(view.host, "Create workspace"));
  assert.equal(sent.length, 1);
  assert.equal(view.host.querySelector('.ml-render > [role="status"]')?.textContent, "");
  await view.unmount();
});

test("a template draws one row for each item, and a new item draws another", async () => {
  const messages = example("task-list");
  const view = await mount(<RenderSurface messages={messages} />);
  const rows = () => [...view.host.querySelectorAll(".ml-checkbox-field")].map((row) => row.textContent);
  assert.deepEqual(rows(), ["Send the March invoice", "Confirm the venue"]);
  assert.deepEqual([...view.host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].map((box) => box.checked), [false, true]);
  await view.render(<RenderSurface messages={[...messages, data("/tasks/2", { title: "Book the room", done: false, due: "3 pm" }, "tasks")]} />);
  assert.deepEqual(rows(), ["Send the March invoice", "Confirm the venue", "Book the room"]);
  // Ticking a row writes to that row's item.
  await click(view.host.querySelectorAll('input[type="checkbox"]')[2]);
  assert.deepEqual([...view.host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].map((box) => box.checked), [false, true, true]);
  await view.unmount();
});

test("a refused update leaves what was drawn and tells the agent in A2UI's error", async () => {
  const refused: Array<{ error: { code: string; path: string } }> = [];
  const first = [create(), update([{ id: "root", component: "Badge", text: "Deployed", tone: "success" }])];
  const view = await mount(<RenderSurface messages={first} onError={(sent) => refused.push(...sent)} />);
  await view.render(<RenderSurface messages={[...first, update([{ id: "root", component: "Badge", text: "Broken", tone: "green" }])]} onError={(sent) => refused.push(...sent)} />);
  assert.equal(view.host.querySelector(".ml-badge")?.textContent, "Deployed");
  assert.deepEqual(refused.map((message) => [message.error.code, message.error.path]), [["VALIDATION_FAILED", "/components/0/tone"]]);
  await view.unmount();
});

test("a stream shows its fallback until the tree is whole; a new conversation starts again", async () => {
  const pieces = [create(), update([{ id: "root", component: "Stack", children: ["note"] }])];
  const fallback = <p>Composing</p>;
  const view = await mount(<RenderSurface messages={pieces} streaming fallback={fallback} />);
  assert.equal(view.host.querySelector(".ml-render")?.getAttribute("aria-busy"), "true");
  assert.equal(view.host.textContent, "Composing");
  await view.render(<RenderSurface messages={[...pieces, update([{ id: "note", component: "Text", text: "Here it is" }])]} fallback={fallback} />);
  assert.equal(view.host.querySelector(".ml-render-text")?.textContent, "Here it is");
  assert.equal(view.host.querySelector(".ml-render")?.getAttribute("aria-busy"), null);
  // Another array is another conversation: the old surface is gone.
  await view.render(<RenderSurface messages={[create("next"), update([{ id: "root", component: "Text", text: "Fresh" }], "next")]} fallback={fallback} />);
  assert.deepEqual([...view.host.querySelectorAll(".ml-render-surface")].map((surface) => surface.getAttribute("data-surface")), ["next"]);
  await view.unmount();
});

test("the page's theme, one surface of several, and a host kept outside", async () => {
  const two = [create("a", { theme: { name: "nordic", mode: "dark" } }), update([{ id: "root", component: "Text", text: "A" }], "a"), create("b"), update([{ id: "root", component: "Text", text: "B" }], "b")];
  const view = await mount(<RenderSurface messages={two} />);
  assert.deepEqual([...view.host.querySelectorAll(".ml-render-surface")].map((surface) => [surface.getAttribute("data-surface"), surface.getAttribute("data-theme"), surface.getAttribute("data-mode")]), [["a", "nordic", "dark"], ["b", "graphite", "system"]]);
  await view.render(<RenderSurface messages={two} surfaceId="b" theme="inherit" />);
  const only = view.host.querySelectorAll(".ml-render-surface");
  assert.equal(only.length, 1);
  assert.equal(only[0].getAttribute("data-theme"), null);
  await view.unmount();

  const sent: unknown[] = [];
  const host = createRenderHost(rules, { onAction: (message: unknown) => sent.push(message) });
  const outside = await mount(<RenderSurface host={host} />);
  await act(async () => void host.receive([create(), update([{ id: "root", component: "Button", text: "Go", action: { event: { name: "go" } } }])]));
  await click(button(outside.host, "Go"));
  assert.equal(sent.length, 1);
  await outside.unmount();
});
