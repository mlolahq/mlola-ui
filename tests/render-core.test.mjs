import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { absolutePath, createRenderHost, toErrorMessage } from "../packages/behavior/src/render/core.js";

// Mlola Render's core: what both renderers draw from (docs/render.md).

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rules = JSON.parse(fs.readFileSync(path.join(root, "packages/registry/generated/render-rules.json"), "utf8"));
const { catalogId } = rules;
const V = "v0.9.1";
const example = (name) => rules.examples.find((entry) => entry.name === name).messages;
const create = (surfaceId = "s", extra = {}) => ({ version: V, createSurface: { surfaceId, catalogId, ...extra } });
const update = (components, surfaceId = "s") => ({ version: V, updateComponents: { surfaceId, components } });
const data = (pointer, value, surfaceId = "s") => ({ version: V, updateDataModel: { surfaceId, path: pointer, value } });
const at = new Date("2026-10-09T09:30:00Z");

function host(options = {}) {
  const sent = [];
  const refused = [];
  const made = createRenderHost(rules, { now: () => at, onAction: (message, extra) => sent.push({ message, extra }), onError: (messages) => refused.push(...messages), ...options });
  return { host: made, sent, refused };
}

test("a surface is drawn once it passes: its theme, its components, its children in order", () => {
  const { host: made } = host();
  assert.deepEqual(made.receive(example("workspace-signup")).errors, []);
  assert.deepEqual(made.surfaces(), ["signup"]);
  assert.deepEqual(made.surface("signup"), { id: "signup", theme: { name: "graphite", mode: "system" } });
  assert.equal(made.component("signup", "root").type, "Card");
  assert.deepEqual(made.children("signup", "form").map((child) => child.id), ["name", "email", "plan", "actions"]);
  assert.equal(made.surface("nothing"), null);
});

test("a template draws its component once for each item, and relative paths read the item", () => {
  const { host: made } = host();
  made.receive(example("task-list"));
  const rows = made.children("tasks", "list");
  assert.deepEqual(rows.map((row) => [row.id, row.scope]), [["task", "/tasks/0"], ["task", "/tasks/1"]]);
  assert.equal(new Set(rows.map((row) => row.key)).size, 2);
  const [first, second] = rows;
  const checkbox = made.component("tasks", "done").props;
  assert.equal(made.read("tasks", checkbox.label, first.scope), "Send the March invoice");
  assert.equal(made.read("tasks", checkbox.checked, second.scope), true);
  // A list that grows draws another row; one that is not a list draws none.
  made.receive(data("/tasks/2", { title: "Book the room", done: false, due: "3 pm" }, "tasks"));
  assert.equal(made.children("tasks", "list").length, 3);
  made.receive(data("/tasks", "none", "tasks"));
  assert.deepEqual(made.children("tasks", "list"), []);
  assert.equal(absolutePath("name", "/tasks/0"), "/tasks/0/name");
  assert.equal(absolutePath("/form/name", "/tasks/0"), "/form/name");
});

test("a template inside a template reads its item's own list", () => {
  const { host: made } = host();
  made.receive([
    create(),
    update([
      { id: "root", component: "Stack", children: { componentId: "group", path: "/groups" } },
      { id: "group", component: "Stack", children: { componentId: "item", path: "items" } },
      { id: "item", component: "Text", text: { path: "name" } },
    ]),
    data("/groups", [{ items: [{ name: "Ayu" }, { name: "Raka" }] }, { items: [{ name: "Lena" }] }]),
  ]);
  const groups = made.children("s", "root");
  const names = groups.flatMap((group) => made.children("s", "group", group.scope).map((item) => made.read("s", made.component("s", "item").props.text, item.scope)));
  assert.deepEqual(names, ["Ayu", "Raka", "Lena"]);
});

test("what a person enters is written where the field is bound, and comes back with the action", () => {
  const { host: made, sent } = host();
  made.receive(example("workspace-signup"));
  const name = made.component("signup", "name").props;
  assert.equal(made.write("signup", name.value, "Atlas Studio"), true);
  assert.equal(made.write("signup", made.component("signup", "email").props.value, "lena@company.com"), true);
  assert.equal(made.read("signup", name.value), "Atlas Studio");
  assert.equal(made.write("signup", "a literal", "x"), false);
  const pressed = made.press("signup", "submit");
  assert.deepEqual(pressed.missing, []);
  assert.deepEqual(sent[0].message, {
    version: V,
    action: { name: "create_workspace", surfaceId: "signup", sourceComponentId: "submit", timestamp: "2026-10-09T09:30:00.000Z", context: { form: { name: "Atlas Studio", email: "lena@company.com", plan: "free" } } },
  });
  // What was sent is a copy: a later edit does not reach it.
  made.write("signup", name.value, "Changed");
  assert.equal(sent[0].message.action.context.form.name, "Atlas Studio");
  assert.deepEqual(sent[0].extra, {});
});

test("the data model is the host's own: writing to it never changes the messages it came from", () => {
  const { host: made } = host();
  const messages = [create(), update([{ id: "root", component: "Input", label: "Name", value: { path: "/form/name" } }]), data("/form", { name: "" })];
  made.receive(messages);
  made.write("s", made.component("s", "root").props.value, "Atlas Studio");
  assert.equal(messages[2].updateDataModel.value.name, "");
  assert.equal(made.dataModel("s").form.name, "Atlas Studio");
  // No messages closes a stream without an error.
  assert.deepEqual(made.receive([]), { errors: [], advice: [] });
});

test("a required field holds back the actions that would send its value, and only those", () => {
  const { host: made, sent } = host();
  made.receive([
    create(),
    update([
      { id: "root", component: "Stack", children: ["email", "agree", "send", "cancel"] },
      { id: "email", component: "Input", label: "Work email", value: { path: "/form/email" }, required: true },
      { id: "agree", component: "Checkbox", label: "I accept the terms", checked: { path: "/form/agree" }, required: true },
      { id: "send", component: "Button", text: "Join", action: { event: { name: "join", context: { form: { path: "/form" } } } } },
      { id: "cancel", component: "Button", variant: "secondary", text: "Cancel", action: { event: { name: "cancel" } } },
    ]),
    data("/form", { email: "  ", agree: false }),
  ]);
  const held = made.press("s", "send");
  assert.equal(held.sent, null);
  assert.deepEqual(held.missing.map((field) => [field.id, field.label]), [["email", "Work email"], ["agree", "I accept the terms"]]);
  assert.equal(sent.length, 0);
  assert.equal(made.missing("s", "email"), true);
  // Cancel sends nothing of the form, so nothing holds it back.
  assert.equal(made.press("s", "cancel").sent.action.name, "cancel");
  // Filling a field in clears its mark; the action goes once all are filled.
  made.write("s", made.component("s", "email").props.value, "lena@company.com");
  assert.equal(made.missing("s", "email"), false);
  assert.equal(made.missing("s", "agree"), true);
  made.write("s", made.component("s", "agree").props.checked, true);
  assert.deepEqual(made.press("s", "send").sent.action.context, { form: { email: "lena@company.com", agree: true } });
});

test("a surface that asked for its data model gets it with each action", () => {
  const { host: made, sent } = host();
  made.receive([create("s", { sendDataModel: true }), update([{ id: "root", component: "Button", text: "Go", action: { event: { name: "go", context: { step: 2, missing: { path: "/nothing" } } } } }]), data("/seen", true)]);
  made.press("s", "root");
  assert.deepEqual(sent[0].message.action.context, { step: 2, missing: null });
  assert.deepEqual(sent[0].extra, { dataModel: { seen: true } });
});

test("an update with an error is refused in A2UI's own message, and what is drawn stays", () => {
  const { host: made, refused } = host();
  made.receive([create(), update([{ id: "root", component: "Stack", children: ["note"] }, { id: "note", component: "Text", text: "First" }])]);
  const issues = made.receive(update([{ id: "note", component: "Text", text: "Second", color: "red" }]));
  assert.equal(issues.errors.length, 1);
  assert.deepEqual(refused, [{ version: V, error: { code: "VALIDATION_FAILED", surfaceId: "s", path: "/components/0/color", message: issues.errors[0].message } }]);
  assert.equal(made.component("s", "note").props.text, "First");
  // The correction draws.
  assert.deepEqual(made.receive(update([{ id: "note", component: "Text", text: "Second" }])).errors, []);
  assert.equal(made.component("s", "note").props.text, "Second");
  // A surface made for another catalog never draws, whatever follows.
  made.receive([{ version: V, createSurface: { surfaceId: "other", catalogId: "basic" } }, update([{ id: "root", component: "Text", text: "Hi" }], "other")]);
  assert.equal(made.surface("other"), null);
  assert.deepEqual(toErrorMessage({ code: "VALIDATION_FAILED", surfaceId: "s", path: "/3/updateDataModel/path", message: "m" }).error.path, "/path");
  assert.deepEqual(toErrorMessage({ code: "VALIDATION_FAILED", surfaceId: "", path: "", message: "m" }).error.path, "/");
});

test("a stream's updates wait for its pause: nothing half-built is drawn or reported", () => {
  const { host: made, refused } = host();
  assert.deepEqual(made.receive(create(), { streaming: true }).errors, []);
  assert.deepEqual(made.receive(update([{ id: "root", component: "Stack", children: ["later"] }]), { streaming: true }).errors, []);
  assert.equal(made.surface("s"), null);
  assert.deepEqual(made.receive(update([{ id: "later", component: "Text", text: "Here" }])).errors, []);
  assert.deepEqual(made.children("s", "root").map((child) => child.id), ["later"]);
  assert.deepEqual(refused, []);
});

test("titled components take their level from the heading before them", () => {
  const { host: made } = host();
  made.receive([
    create(),
    update([
      { id: "root", component: "Stack", children: ["first", "h", "faq", "empty"] },
      { id: "first", component: "EmptyState", title: "Nothing yet" },
      { id: "h", component: "Heading", level: 3, text: "Questions" },
      { id: "faq", component: "Accordion", children: ["q"] },
      { id: "q", component: "AccordionItem", title: "When?", children: [] },
      { id: "empty", component: "EmptyState", title: "No more" },
    ]),
  ]);
  assert.deepEqual(["first", "faq", "empty"].map((id) => made.headingLevel("s", id)), [2, 4, 4]);
});

test("listeners hear every change, and a deleted surface is gone", () => {
  const { host: made } = host();
  let heard = 0;
  const stop = made.subscribe(() => (heard += 1));
  made.receive(example("order-status"));
  const before = made.revision();
  assert.ok(heard >= 1 && before >= 1);
  made.receive({ version: V, deleteSurface: { surfaceId: "orders" } });
  assert.deepEqual(made.surfaces(), []);
  assert.ok(made.revision() > before);
  stop();
  made.receive(create("again"));
  assert.equal(heard, 2);
});
