import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { run } from "../packages/cli/src/cli.js";
import { remoteMcpHandler } from "../packages/cli/src/mcp.js";
import { applyRenderMessages, checkSurfaces, createRenderState, formatRenderReport, parseRenderInput, renderCatalogGuide, validateRender } from "../packages/behavior/src/render/check.js";

// Mlola Render: A2UI messages an agent composes, checked against the catalog
// the components generate (docs/render.md).

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const rules = read("packages/registry/generated/render-rules.json");
const catalog = read("packages/registry/generated/render-catalog.json");
const { catalogId } = rules;
const V = "v0.9.1";

const create = (surfaceId = "s", extra = {}) => ({ version: V, createSurface: { surfaceId, catalogId, ...extra } });
const update = (components, surfaceId = "s") => ({ version: V, updateComponents: { surfaceId, components } });
const data = (path, value, surfaceId = "s") => ({ version: V, updateDataModel: { surfaceId, path, value } });
const surface = (...components) => [create(), update(components)];
const stack = (...children) => ({ id: "root", component: "Stack", children });
const check = (messages) => validateRender(messages, rules);

/** The one error a payload should produce, by path, and the words its message should carry. */
function only(result, path, words) {
  assert.equal(result.valid, false, "expected an error");
  const found = result.errors.find((error) => error.path === path);
  assert.ok(found, `no error at ${path}; got:\n${formatRenderReport(result)}`);
  assert.equal(found.code, "VALIDATION_FAILED");
  assert.match(found.message, words);
  return found;
}

test("every example in the catalog is valid and draws something", () => {
  assert.ok(rules.examples.length >= 2);
  for (const example of rules.examples) {
    const result = check(example.messages);
    assert.deepEqual([...result.errors, ...result.advice], [], `${example.name}:\n${formatRenderReport(result)}`);
    assert.ok(result.surfaces[0].components > 3);
  }
});

test("the catalog offers exactly the values its components have", () => {
  for (const [type, component] of Object.entries(rules.components)) {
    const { item } = component.mlola;
    if (item) assert.ok(read("packages/registry/index.json").components.includes(item), `${type} draws ${item}, which is not a free component`);
    for (const [name, prop] of Object.entries(component.props)) {
      assert.ok(prop.description, `${type}.${name} has no description`);
      if (prop.kind !== "enum") continue;
      assert.ok(prop.values.length, `${type}.${name} has no values`);
      if (prop.default !== undefined) assert.ok(prop.values.includes(prop.default), `${type}.${name} default`);
    }
  }
  // Values come from the manifests: a Button's sizes are the component's, less the icon-only size the catalog cannot fill.
  const button = read("packages/registry/components/button.json").options.find((option) => option.component === "Button" && option.prop === "size");
  assert.deepEqual(rules.components.Button.props.size.values, button.values.filter((value) => value !== "icon"));
  assert.deepEqual(rules.components.Grid.props.columns.values, read("packages/engine/generated/contract.json").styling.elements["ml-grid"]["data-columns"]);
  assert.deepEqual(rules.themes, ["graphite", "atelier", "machined", "aerogel", "nordic"]);
});

test("the A2UI catalog describes the same components and props as the rules", () => {
  assert.equal(catalog.catalogId, catalogId);
  assert.equal(catalog.$id, catalogId);
  assert.deepEqual(Object.keys(catalog.components), Object.keys(rules.components));
  assert.deepEqual(catalog.$defs.anyComponent.oneOf.map((entry) => entry.$ref), Object.keys(rules.components).map((type) => `#/components/${type}`));
  for (const [type, component] of Object.entries(rules.components)) {
    const schema = catalog.components[type];
    assert.equal(schema.unevaluatedProperties, false);
    const own = schema.allOf[1];
    assert.deepEqual(own.properties.component, { const: type });
    assert.deepEqual(Object.keys(own.properties).slice(1), Object.keys(component.props), type);
    assert.deepEqual(own.required, ["component", ...Object.entries(component.props).filter(([, prop]) => prop.required).map(([name]) => name)], type);
    for (const [name, prop] of Object.entries(component.props)) {
      if (prop.kind === "enum") assert.deepEqual(own.properties[name].enum, prop.values, `${type}.${name}`);
    }
  }
  assert.deepEqual(catalog.$defs.theme.properties.name.enum, rules.themes);
});

test("the guide lists the components under their group's title, every group once", () => {
  const guide = renderCatalogGuide(rules);
  for (const [group, title] of Object.entries(rules.groups)) {
    const heading = guide.indexOf(`\n## ${title}\n`);
    assert.ok(heading > 0, `no heading for ${group}`);
    for (const [name, component] of Object.entries(rules.components)) {
      if (component.group !== group) continue;
      const at = guide.indexOf(`\n### ${name}\n`);
      const next = guide.indexOf("\n## ", heading + 1);
      assert.ok(at > heading && at < next, `${name} is not under ${title}`);
    }
  }
});

test("the guide an agent reads names every component, prop and value", () => {
  const guide = renderCatalogGuide(rules);
  for (const [type, component] of Object.entries(rules.components)) {
    assert.match(guide, new RegExp(`### ${type}\\n`));
    for (const [name, prop] of Object.entries(component.props)) {
      assert.ok(guide.includes(`\`${name}\``), `${type}.${name}`);
      for (const value of prop.values ?? []) assert.ok(guide.includes(`"${value}"`), `${type}.${name} ${value}`);
    }
  }
  assert.ok(guide.includes(catalogId));
  for (const example of rules.examples) assert.ok(guide.includes(example.title));
});

test("input arrives as one message, an array, JSON text or JSON Lines", () => {
  const messages = surface(stack("t"), { id: "t", component: "Text", text: "Hello" });
  assert.equal(check(messages).valid, true);
  assert.equal(check(JSON.stringify(messages)).valid, true);
  assert.equal(check(messages.map((message) => JSON.stringify(message)).join("\n")).valid, true);
  assert.equal(check(create()).valid, true);
  assert.match(check("").errors[0].message, /empty/);
  assert.match(check("{nope").errors[0].message, /not JSON/);
  assert.match(check(`${JSON.stringify(create())}\n{nope`).errors[0].message, /Line 2 is not JSON/);
  assert.match(check(42).errors[0].message, /Expected A2UI messages/);
  assert.match(check([]).errors[0].message, /no messages/);
  assert.equal(parseRenderInput("x".repeat(rules.limits.inputBytes + 1), rules.limits).messages, null);
});

test("a message carries a supported version and exactly one kind", () => {
  only(check([{ createSurface: { surfaceId: "s", catalogId } }]), "/0/version", /Add "version"/);
  only(check([{ version: "v0.8", createSurface: { surfaceId: "s", catalogId } }]), "/0/version", /not supported/);
  assert.equal(check([{ version: "v0.9", createSurface: { surfaceId: "s", catalogId } }]).valid, true);
  only(check([{ version: V, createSurface: { surfaceId: "s", catalogId }, deleteSurface: { surfaceId: "s" } }]), "/0", /separate messages/);
  only(check([{ version: V, createSurface: { surfaceId: "s", catalogId }, extra: 1 }]), "/0/extra", /remove "extra"/);
  only(check([create(""), update([stack()], "")]), "/0/createSurface/surfaceId", /needs a "surfaceId"/);
});

test("a surface uses the Mlola catalog and a theme by name, never colors", () => {
  only(check([{ version: V, createSurface: { surfaceId: "s", catalogId: "https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json" } }]), "/0/createSurface/catalogId", /Set "catalogId"/);
  only(check([create("s", { theme: { name: "midnight" } })]), "/0/createSurface/theme/name", /does not exist/);
  only(check([create("s", { theme: { mode: "dim" } })]), "/0/createSurface/theme/mode", /does not exist/);
  only(check([create("s", { theme: { primaryColor: "#00BFFF" } })]), "/0/createSurface/theme/primaryColor", /pick one by name/);
  const themed = check([create("s", { theme: { name: "nordic", mode: "dark" } })]);
  assert.deepEqual(themed.surfaces[0].theme, { name: "nordic", mode: "dark" });
  assert.deepEqual(check([create()]).surfaces[0].theme, { name: "graphite", mode: "system" });
});

test("surfaces are created once, before they are used, and gone once deleted", () => {
  only(check([update([stack()])]), "/0/updateComponents/surfaceId", /Send createSurface for it first/);
  only(check([create(), create()]), "/1/createSurface/surfaceId", /already exists/);
  only(check([create(), { version: V, deleteSurface: { surfaceId: "s" } }, update([stack()])]), "/2/updateComponents/surfaceId", /was deleted/);
  assert.equal(check([create(), { version: V, deleteSurface: { surfaceId: "s" } }, create()]).valid, true);
  const many = Array.from({ length: rules.limits.surfaces + 1 }, (_, index) => create(`s${index}`));
  only(check(many), `/${rules.limits.surfaces}/createSurface`, /surfaces are open at once/);
});

test("a state lives as long as its stream: the limits count a call and what is open, never a total", () => {
  const state = createRenderState(rules);
  const remove = (surfaceId) => ({ version: V, deleteSurface: { surfaceId } });
  // Far more messages and surfaces than one call may bring, a few at a time.
  for (let round = 0; round < rules.limits.messages * 3; round += 1) {
    const id = `card-${round}`;
    assert.deepEqual(applyRenderMessages(state, [create(id), update([{ id: "root", component: "Text", text: "Ready" }], id), data("/tick", round, id)]).errors, [], `round ${round}`);
    assert.deepEqual(checkSurfaces(state).errors, []);
    assert.deepEqual(applyRenderMessages(state, remove(id)).errors, []);
  }
  // What it remembers stays bounded, and a late update to a surface just deleted is still told why.
  assert.ok(state.surfaces.size <= rules.limits.surfaces);
  const last = `card-${rules.limits.messages * 3 - 1}`;
  assert.match(applyRenderMessages(state, update([stack()], last)).errors[0].message, /was deleted/);
  // One call is still held to the limit.
  assert.match(applyRenderMessages(state, Array.from({ length: rules.limits.messages + 1 }, () => create("x"))).errors[0].message, /At most 200 messages/);
});

test("names an object already has are not components or props", () => {
  for (const name of ["toString", "constructor", "__proto__", "hasOwnProperty"]) {
    only(check(surface({ id: "root", component: name })), "/1/updateComponents/components/0/component", /is not in the Mlola catalog/);
    only(check(JSON.parse(JSON.stringify(surface({ id: "root", component: "Text", text: "x", [name]: 1 })))), `/1/updateComponents/components/0/${name}`, /does not take/);
  }
});

test("components and props come from the catalog, with a way to the right one", () => {
  only(check(surface({ id: "root", component: "Column", children: [] })), "/1/updateComponents/components/0/component", /use "Stack"/);
  only(check(surface({ id: "root", component: "stack", children: [] })), "/1/updateComponents/components/0/component", /use "Stack"/);
  only(check(surface({ id: "root", component: "Marquee" })), "/1/updateComponents/components/0/component", /It has: Layout \(Stack, Row, Grid\);.*Actions \(Button\)/);
  only(check(surface(stack(), { id: "b", component: "Button", text: "Go", action: { event: { name: "go" } }, style: { color: "red" } })), "/1/updateComponents/components/1/style", /draws with the surface's theme/);
  only(check(surface(stack(), { id: "b", component: "Button", text: "Go", action: { event: { name: "go" } }, onClick: "go()" })), "/1/updateComponents/components/1/onClick", /sends an event/);
  only(check(surface({ id: "root", component: "Card", child: "x" })), "/1/updateComponents/components/0/child", /takes "children"/);
  only(check(surface(stack(), { id: "i", component: "Input", label: "Email", checks: [] })), "/1/updateComponents/components/1/checks", /not in the Mlola catalog yet/);
  only(check(surface(stack(), { id: "b", component: "Button", text: "Go", action: { event: { name: "go" } }, variant: "Primary" })), "/1/updateComponents/components/1/variant", /case-sensitive/);
  only(check(surface(stack(), { id: "b", component: "Button", text: "Go", action: { event: { name: "go" } }, size: "icon" })), "/1/updateComponents/components/1/size", /not in the catalog/);
  only(check(surface(stack(), { id: "b", component: "Badge", text: "New", tone: "red" })), "/1/updateComponents/components/1/tone", /use "neutral"/);
  only(check(surface(stack(), { id: "h", component: "Heading", text: "Hi", level: 7 })), "/1/updateComponents/components/1/level", /1 to 6/);
});

test("what agents bring from A2UI's basic catalog is answered with what to use instead", () => {
  const go = { event: { name: "go" } };
  only(check(surface({ id: "root", component: "Image", url: "https://example.com/a.png" })), "/1/updateComponents/components/0/component", /Say what matters in Text/);
  only(check(surface({ id: "root", component: "Text", text: "Hi", variant: "h1" })), "/1/updateComponents/components/0/variant", /use a Heading with "level"/);
  only(check(surface({ id: "root", component: "Button", text: "Go", child: "label", action: go })), "/1/updateComponents/components/0/child", /holds its words in "text"/);
  only(check(surface({ id: "root", component: "Row", justify: "spaceBetween", children: [] })), "/1/updateComponents/components/0/justify", /use a Grid/);
  only(check(surface(stack("t"), { id: "t", component: "Text", text: "x", weight: 1 })), "/1/updateComponents/components/1/weight", /use a Grid/);
  only(check(surface({ id: "root", component: "Input", label: "Bio", variant: "longText" })), "/1/updateComponents/components/0/variant", /use a Textarea/);
  only(check(surface({ id: "root", component: "Checkbox", label: "Agree", value: true })), "/1/updateComponents/components/0/value", /"checked"/);
  // A component's own prop of the same name is never shadowed by a hint: a Card's child still says "children".
  only(check(surface({ id: "root", component: "Card", child: "x" })), "/1/updateComponents/components/0/child", /takes "children"/);
  // The guide lists every hint before an agent composes anything.
  const guide = renderCatalogGuide(rules);
  for (const name of Object.keys(rules.borrowed.components)) assert.ok(guide.includes(`- ${name} is not in the catalog.`), name);
  for (const hint of Object.values(rules.borrowed.props)) assert.ok(guide.includes(hint), hint);
});

test("every field, control and table has a name a screen reader reads", () => {
  only(check(surface(stack("i"), { id: "i", component: "Input", value: { path: "/email" } })), "/1/updateComponents/components/1", /Input needs "label"/);
  only(check(surface(stack("b"), { id: "b", component: "Button", text: "  ", action: { event: { name: "go" } } })), "/1/updateComponents/components/1/text", /empty/);
  only(check(surface(stack("t"), { id: "t", component: "Table", columns: [{ key: "a", label: "A" }], rows: [] })), "/1/updateComponents/components/1", /Table needs "caption"/);
  only(check(surface({ id: "root", component: "Tabs", children: ["a"] }, { id: "a", component: "Tab", label: "A", children: [] })), "/1/updateComponents/components/0", /Tabs needs "label"/);
  only(check(surface(stack("a"), { id: "a", component: "Avatar" })), "/1/updateComponents/components/1", /Avatar needs "name"/);
  only(check(surface(stack("x"), { id: "x", component: "Text", text: "Hi", accessibility: { role: "button" } })), "/1/updateComponents/components/1/accessibility/role", /takes "label" and "description"/);
});

test("values bind to the data model through JSON Pointers that cannot reach a prototype", () => {
  assert.equal(check([...surface(stack("i"), { id: "i", component: "Input", label: "Email", value: { path: "/form/email" } }), data("/form", { email: "" })]).valid, true);
  only(check(surface(stack("i"), { id: "i", component: "Input", label: "Email", value: { path: "/__proto__/polluted" } })), "/1/updateComponents/components/1/value/path", /not a data path/);
  only(check(surface(stack("i"), { id: "i", component: "Input", label: "Email", value: { path: "/a~2b" } })), "/1/updateComponents/components/1/value/path", /not a data path/);
  only(check(surface(stack("i"), { id: "i", component: "Input", label: "Email", value: { path: "/x", default: "" } })), "/1/updateComponents/components/1/value", /holds only "path"/);
  only(check(surface(stack("i"), { id: "i", component: "Input", label: "Email", value: { call: "formatString" } })), "/1/updateComponents/components/1/value", /Functions are not in the Mlola catalog/);
  only(check(surface(stack("i"), { id: "i", component: "Input", label: "Email", value: { path: "email" } })), "/1/updateComponents/components/1/value/path", /only works inside a template/);
  // Bindings nested in an action's context or the accessibility words are held to the same scope.
  only(check(surface(stack("b"), { id: "b", component: "Button", text: "Save", action: { event: { name: "save", context: { email: { path: "email" } } } } })), "/1/updateComponents/components/1/action/event/context/email/path", /only works inside a template/);
  only(check(surface(stack("b"), { id: "b", component: "Button", text: "Save", accessibility: { description: { path: "hint" } }, action: { event: { name: "save" } } })), "/1/updateComponents/components/1/accessibility/description/path", /only works inside a template/);
  only(check([create(), data("/constructor/prototype/x", 1)]), "/1/updateDataModel/path", /JSON Pointer/);
  only(check([create(), data("/list", [1, 2]), data("/list/length", 0)]), "/2/updateDataModel/path", /holds an array/);
  assert.equal(check([create(), data("/list", [1, 2]), data("/list/1", 3)]).valid, true);
  only(check([create(), data("/big", "x".repeat(rules.limits.dataBytes))]), "/1/updateDataModel/value", /at most/);
  // The limit is what the model holds: a stream that keeps replacing one value never reaches it.
  const half = "x".repeat(rules.limits.dataBytes / 2);
  assert.deepEqual(check([create(), data("/status", half), data("/status", half), data("/status", half)]).errors, []);
  assert.deepEqual(check([create(), data("/", { a: half }), data("/", { b: half })]).errors, []);
  only(check([create(), data("/a", half), data("/b", half)]), "/2/updateDataModel/value", /at most/);
  // An index past an array's end would leave a gap a template walks through.
  only(check([create(), data("/list", [1, 2]), data("/list/999999", 3)]), "/2/updateDataModel/path", /at most 2/);
  only(check([create(), data("/list", []), data("/list/5/name", "x")]), "/2/updateDataModel/path", /at most 0/);
  assert.equal(check([create(), data("/list", [1, 2]), data("/list/2", 3)]).valid, true);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.x, undefined);
});

test("a template repeats a component for each item, with paths relative to it", () => {
  const messages = [
    ...surface(
      { id: "root", component: "Stack", children: { componentId: "row", path: "/people" } },
      { id: "row", component: "Text", text: { path: "name" } },
    ),
    data("/people", [{ name: "Ayu" }, { name: "Raka" }]),
  ];
  assert.deepEqual(check(messages).errors, []);
  only(check(surface({ id: "root", component: "Stack", children: { componentId: "row", path: "people" } }, { id: "row", component: "Text", text: "x" })), "/1/updateComponents/components/0/children/path", /points at an array/);
  // Inside a template, a template's path is relative to the item: each group's own list.
  const nested = [
    ...surface(
      { id: "root", component: "Stack", children: { componentId: "group", path: "/groups" } },
      { id: "group", component: "Stack", children: { componentId: "item", path: "items" } },
      { id: "item", component: "Text", text: { path: "name" } },
    ),
    data("/groups", [{ items: [{ name: "Ayu" }] }]),
  ];
  assert.deepEqual(check(nested).errors, []);
  only(check(surface({ id: "root", component: "Stack", children: { componentId: "missing", path: "/people" } })), "/1/updateComponents/components/0/children/componentId", /No component has the id "missing"/);
});

test("actions send a named event with bound values, never code", () => {
  const button = (action) => surface(stack("b"), { id: "b", component: "Button", text: "Save", action });
  assert.equal(check(button({ event: { name: "save_note", context: { note: { path: "/note" }, draft: true } } })).valid, true);
  only(check(button({ functionCall: { call: "openUrl" } })), "/1/updateComponents/components/1/action/functionCall", /send an event/);
  only(check(button({ event: { name: "save note!" } })), "/1/updateComponents/components/1/action/event/name", /starts with a letter/);
  only(check(button({ event: { name: "save", context: { note: { value: 1 } } } })), "/1/updateComponents/components/1/action/event/context/note", /needs a binding/);
  assert.equal(check(button({ event: { name: "save", context: { tags: ["a", 2, true, null] } } })).valid, true);
  only(check(button({ event: { name: "save", context: { tags: [{ path: "/a" }] } } })), "/1/updateComponents/components/1/action/event/context/tags", /An array in the context/);
  only(check(button({ event: { name: "save" }, href: "javascript:alert(1)" })), "/1/updateComponents/components/1/action/href", /does not take "href"/);
  only(check(button("save")), "/1/updateComponents/components/1/action", /"action" is/);
  only(check(surface(stack("b"), { id: "b", component: "Button", text: "Save" })), "/1/updateComponents/components/1", /Button needs "action"/);
  only(check(JSON.parse(`[${JSON.stringify(create())},{"version":"${V}","updateComponents":{"surfaceId":"s","components":[{"id":"root","component":"Button","text":"Go","action":{"event":{"name":"go","context":{"__proto__":{"path":"/x"}}}}}]}}]`)), "/1/updateComponents/components/0/action/event/context/__proto__", /cannot be a context key/);
});

test("options, columns and rows hold what their component can show", () => {
  const select = (extra) => surface(stack("s1"), { id: "s1", component: "Select", label: "City", options: [{ label: "Jakarta", value: "jkt" }, { label: "Bandung", value: "bdg" }], ...extra });
  assert.equal(check(select({ value: "bdg" })).valid, true);
  only(check(select({ value: "sby" })), "/1/updateComponents/components/1/value", /not one of its options/);
  only(check(select({ options: [{ label: "A", value: "a" }, { label: "B", value: "a" }] })), "/1/updateComponents/components/1/options/1/value", /Two options/);
  only(check(select({ options: [] })), "/1/updateComponents/components/1/options", /at least 1/);
  only(check(surface(stack("r"), { id: "r", component: "RadioGroup", label: "Agree", options: [{ label: "Yes", value: "y" }] })), "/1/updateComponents/components/1/options", /use a Checkbox/);
  const table = (extra) => surface(stack("t"), { id: "t", component: "Table", caption: "Orders", columns: [{ key: "id", label: "Order" }], rows: [], ...extra });
  only(check(table({ columns: [{ key: "id", label: "Order" }, { key: "id", label: "Again" }] })), "/1/updateComponents/components/1/columns/1/key", /Two columns/);
  only(check(table({ columns: [{ key: "id", label: "Order", align: "middle" }] })), "/1/updateComponents/components/1/columns/0/align", /"left"/);
  only(check(table({ columns: Array.from({ length: rules.limits.columns + 1 }, (_, index) => ({ key: `c${index}`, label: `C${index}` })) })), "/1/updateComponents/components/1/columns", /at most/);
  only(check(table({ rows: [{ id: { nested: true } }] })), "/1/updateComponents/components/1/rows/0/id", /A cell holds/);
  only(check(table({ rows: Array.from({ length: rules.limits.rows + 1 }, () => ({})) })), "/1/updateComponents/components/1/rows", /page through/);
});

test("a date is a day that exists, inside its range", () => {
  const picker = (props) => surface({ id: "root", component: "DatePicker", label: "Arrival", ...props });
  assert.deepEqual(check([...picker({ value: { path: "/arrival" }, min: "2026-10-01", max: "2026-10-31" }), data("/arrival", "2026-10-12")]).errors, []);
  assert.deepEqual(check(picker({ value: "2028-02-29" })).errors, []);
  only(check(picker({ value: "2026-02-30" })), "/1/updateComponents/components/0/value", /ISO date/);
  only(check(picker({ value: "12 October 2026" })), "/1/updateComponents/components/0/value", /ISO date/);
  only(check(picker({ min: { path: "/earliest" } })), "/1/updateComponents/components/0/min", /ISO date/);
  only(check(picker({ min: "2026-10-31", max: "2026-10-01" })), "/1/updateComponents/components/0/max", /comes before "min"/);
  only(check(picker({ value: "2026-11-02", max: "2026-10-31" })), "/1/updateComponents/components/0/value", /outside any day to 2026-10-31/);
  // A2UI's own date field is pointed here, and its time is said to be missing.
  only(check(surface({ id: "root", component: "DateTimeInput", label: "Arrival" })), "/1/updateComponents/components/0/component", /use "DatePicker"/);
  only(check(picker({ enableTime: true })), "/1/updateComponents/components/0/enableTime", /picks a day/);
});

test("numbers stay in their range", () => {
  const slider = (extra) => surface(stack("v"), { id: "v", component: "Slider", label: "Volume", ...extra });
  assert.equal(check(slider({ value: 40, min: 0, max: 100, step: 5 })).valid, true);
  only(check(slider({ value: 140 })), "/1/updateComponents/components/1/value", /outside 0 to 100/);
  only(check(slider({ min: 10, max: 10 })), "/1/updateComponents/components/1/max", /greater than "min"/);
  only(check(slider({ step: 0 })), "/1/updateComponents/components/1/step", /greater than 0/);
  only(check(slider({ min: { path: "/min" } })), "/1/updateComponents/components/1/min", /is a number;/);
  only(check(surface(stack("p"), { id: "p", component: "Progress", label: "Upload", value: 120 })), "/1/updateComponents/components/1/value", /outside 0 to 100/);
  only(check(surface(stack("x"), { id: "x", component: "Textarea", label: "Note", rows: 40 })), "/1/updateComponents/components/1/rows", /2 to 12/);
});

test("the tree has one root, real children, one place for each, and no loops", () => {
  only(check(surface({ id: "main", component: "Stack", children: [] })), "/0/createSurface", /No component has the id "root"/);
  only(check(surface(stack("ghost"))), "/1/updateComponents/components/0/children/0", /No component has the id "ghost"/);
  only(check(surface(stack("a", "a"), { id: "a", component: "Text", text: "x" })), "/1/updateComponents/components/0/children/1", /listed twice/);
  only(check(surface(stack("a", "b"), { id: "a", component: "Stack", children: ["t"] }, { id: "b", component: "Stack", children: ["t"] }, { id: "t", component: "Text", text: "x" })), "/1/updateComponents/components/2/children/0", /already a child of "a"/);
  only(check(surface(stack("a"), { id: "a", component: "Stack", children: ["root"] })), "/1/updateComponents/components/1/children/0", /cannot be a child/);
  only(check(surface(stack("a"), { id: "a", component: "Stack", children: ["a"] })), "/1/updateComponents/components/1/children/0", /lists itself/);
  // Named before its parent, a component that lists itself still reads as a loop, not as a second parent.
  only(check([create(), update([{ id: "a", component: "Stack", children: ["a"] }, stack("a")])]), "/1/updateComponents/components/0/children/0", /lists itself/);
  // A loop that hangs off nothing never renders: advice, and the walk ends.
  const loop = check(surface(stack(), { id: "a", component: "Stack", children: ["b"] }, { id: "b", component: "Stack", children: ["a"] }));
  assert.equal(loop.advice.length, 2);
  only(check(surface(stack("a"), { id: "a", component: "Stack", children: ["b"] }, { id: "b", component: "Stack", children: ["a"] })), "/1/updateComponents/components/2/children/0", /already a child of "root"/);
  only(check(surface(stack(), { id: "x", component: "Text", text: "1" }, { id: "x", component: "Text", text: "2" })), "/1/updateComponents/components/2/id", /Two components/);
  const orphan = check(surface(stack(), { id: "lost", component: "Text", text: "x" }));
  assert.equal(orphan.valid, true);
  assert.match(orphan.advice[0].message, /not inside "root"/);
  // Deeper than the limit: reported once, and the walk ends.
  const chain = Array.from({ length: rules.limits.depth + 5 }, (_, index) => ({ id: index ? `n${index}` : "root", component: "Stack", children: [`n${index + 1}`] }));
  chain.push({ id: `n${chain.length}`, component: "Text", text: "deep" });
  const deep = check([create(), update(chain)]);
  assert.equal(deep.errors.filter((error) => /levels deep/.test(error.message)).length, 1);
});

test("parts go inside their own container", () => {
  only(check(surface(stack("t"), { id: "t", component: "Tab", label: "One", children: [] })), "/1/updateComponents/components/0/children/0", /goes directly inside Tabs/);
  only(check(surface({ id: "root", component: "Tabs", label: "Views", children: ["x"] }, { id: "x", component: "Text", text: "x" })), "/1/updateComponents/components/0/children/0", /holds only Tab/);
  only(check(surface(stack(), { id: "i", component: "AccordionItem", title: "One", children: [] })), "/1/updateComponents/components/1", /list "i" in one's children/);
  const tabs = surface({ id: "root", component: "Tabs", label: "Views", children: ["a", "b"] }, { id: "a", component: "Tab", label: "List", children: ["at"] }, { id: "b", component: "Tab", label: "Board", children: [] }, { id: "at", component: "Text", text: "Rows" });
  assert.deepEqual(check(tabs).errors, []);
});

test("what a reader meets: headings in order, one primary action, fields told apart", () => {
  const heading = (id, level) => ({ id, component: "Heading", text: id, level });
  assert.equal(check(surface(stack("a", "b", "c"), heading("a", 2), heading("b", 3), heading("c", 2))).valid, true);
  only(check(surface(stack("a", "b"), heading("a", 2), heading("b", 4))), "/1/updateComponents/components/2/level", /jumps from level 2 to 4/);
  const button = (id) => ({ id, component: "Button", text: id, variant: "primary", action: { event: { name: id } } });
  const two = check(surface(stack("save", "send"), button("save"), button("send")));
  assert.equal(two.valid, true);
  assert.match(two.advice[0].message, /already the primary action/);
  // A Button with no variant takes the catalog's default, primary, and counts as one.
  const plain = (id) => ({ id, component: "Button", text: id, action: { event: { name: id } } });
  assert.match(check(surface(stack("save", "send"), plain("save"), plain("send"))).advice[0]?.message ?? "", /already the primary action/);
  // A heading with no level is at the default, 2, so a 4 after it skips one.
  only(check(surface(stack("a", "b"), { id: "a", component: "Heading", text: "a" }, heading("b", 4))), "/1/updateComponents/components/2/level", /jumps from level 2 to 4/);
  const input = (id) => ({ id, component: "Input", label: "Email" });
  assert.match(check(surface(stack("a", "b"), input("a"), input("b"))).advice[0].message, /same label/);
});

test("a stream checked message by message gives the same answer as all at once", () => {
  const messages = [create(), update([stack("t")]), update([{ id: "t", component: "Text", text: "Ready" }])];
  const state = createRenderState(rules);
  for (const message of messages) assert.deepEqual(applyRenderMessages(state, message).errors, []);
  assert.deepEqual(checkSurfaces(state).errors, []);
  assert.equal(check(messages).valid, true);
  // A later update replaces a component by id.
  const replaced = check([...messages, update([{ id: "t", component: "Badge", text: "Done", tone: "success" }])]);
  assert.equal(replaced.valid, true);
  assert.equal(replaced.surfaces[0].components, 2);
});

test("limits hold, and hostile input is read in linear time", () => {
  const many = Array.from({ length: rules.limits.components + 1 }, (_, index) => ({ id: `t${index}`, component: "Text", text: "x" }));
  only(check([create(), update([stack(), ...many])]), "/1/updateComponents/components", /at most 300/);
  const split = check([create(), update([stack(), ...many.slice(0, 200)]), update(many.slice(200))]);
  only(split, `/2/updateComponents/components/${rules.limits.components - 201}`, /at most 300 components/);
  // Hundreds of mistakes come back as the first hundred and a count.
  const sloppy = check([create(), update(Array.from({ length: 250 }, (_, index) => ({ id: `b${index}`, component: "Badge" })))]);
  assert.equal(sloppy.errors.length, 101);
  assert.match(sloppy.errors.at(-1).message, /more errors not shown/);
  only(check(Array.from({ length: rules.limits.messages + 1 }, () => create())), "", /At most 200 messages/);
  only(check(surface(stack("x"), { id: "x", component: "Text", text: "y".repeat(rules.limits.textLength + 1) })), "/1/updateComponents/components/1/text", /keep it to/);
  only(check(surface({ id: "x".repeat(rules.limits.idLength + 1), component: "Stack", children: [] })), "/1/updateComponents/components/0/id", /1 to 128/);

  const hostile = [
    // Nesting as deep as the input allows.
    "[".repeat(rules.limits.inputBytes / 2) + "]".repeat(rules.limits.inputBytes / 2),
    // Every component at the limit, each with the longest children list and a long id.
    JSON.stringify([create(), update(Array.from({ length: rules.limits.components }, (_, index) => ({ id: `${"n".repeat(100)}${index}`, component: "Stack", children: Array.from({ length: 10 }, (_, child) => `${"n".repeat(100)}${(index + child + 1) % rules.limits.components}`) })))]),
    // A path made of escapes, a long string of tildes, a wide data model.
    JSON.stringify([create(), ...Array.from({ length: 150 }, () => data(`/${"~0".repeat(250)}`, "x".repeat(1000)))]),
    // The whole model replaced again and again: each write measures only what it replaces.
    JSON.stringify([create(), ...Array.from({ length: 190 }, () => data("/", { value: "x".repeat(5000) }))]),
    // Messages repeated to the input limit as JSON Lines.
    Array.from({ length: 20_000 }, () => JSON.stringify(create("s".repeat(30)))).join("\n").slice(0, rules.limits.inputBytes),
  ];
  for (const input of hostile) {
    const started = performance.now();
    const result = check(input);
    const elapsed = performance.now() - started;
    assert.ok(elapsed < 1500, `took ${Math.round(elapsed)} ms`);
    assert.equal(typeof result.valid, "boolean");
    assert.ok(result.errors.length < 2000, "errors stay bounded");
  }
});

test("errors use A2UI's shape and the report says what renders", () => {
  const result = check(surface(stack("x"), { id: "x", component: "Badge" }));
  assert.deepEqual(Object.keys(result.errors[0]).sort(), ["code", "message", "path", "surfaceId"]);
  assert.equal(result.errors[0].surfaceId, "s");
  assert.match(formatRenderReport(result), /^1 error: nothing renders/);
  assert.match(formatRenderReport(check(rules.examples[0].messages)), /^Valid: "signup" \(8 components, graphite system\)/);
});

test("the CLI checks a file and prints the catalog", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-render-"));
  const lines = [];
  const output = { log: (...parts) => lines.push(parts.join(" ")), error: (...parts) => lines.push(parts.join(" ")) };
  fs.writeFileSync(path.join(directory, "good.jsonl"), rules.examples[0].messages.map((message) => JSON.stringify(message)).join("\n"));
  fs.writeFileSync(path.join(directory, "bad.json"), JSON.stringify(surface(stack("x"), { id: "x", component: "Badge" })));
  assert.equal(await run(["render", "check", "good.jsonl"], { cwd: directory, output }), 0);
  assert.match(lines.pop(), /^Valid/);
  assert.equal(await run(["render", "check", "bad.json", "--json"], { cwd: directory, output }), 1);
  assert.equal(JSON.parse(lines.pop()).errors[0].path, "/1/updateComponents/components/1");
  assert.equal(await run(["render", "check", "-"], { cwd: directory, output, stdin: JSON.stringify(create()) }), 0);
  assert.equal(await run(["render", "catalog"], { cwd: directory, output }), 0);
  assert.match(lines.pop(), /# Mlola Render catalog/);
  assert.equal(await run(["render", "catalog", "--schema"], { cwd: directory, output }), 0);
  assert.equal(JSON.parse(lines.pop()).catalogId, catalogId);
  assert.equal(await run(["render", "check"], { cwd: directory, output }), 1);
  assert.match(lines.pop(), /Name the file/);
  fs.rmSync(directory, { recursive: true, force: true });
});

test("the CLI package exports the check, and the rules and catalog with their types", () => {
  const cli = read("packages/cli/package.json");
  for (const [entry, target] of [["./render", cli.exports["./render"]], ["./render/rules", cli.exports["./render/rules"]]]) {
    assert.ok(fs.existsSync(path.join(root, "packages/cli", target.types)), `${entry} types`);
    assert.ok(fs.existsSync(path.join(root, "packages/cli", target.default)), `${entry} file`);
  }
  assert.ok(fs.existsSync(path.join(root, "packages/cli", cli.exports["./render/catalog"])));
});

test("both MCP servers offer the catalog and the check", async () => {
  const handle = remoteMcpHandler({ version: "test" });
  const call = async (name, args) => (await handle({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } })).result;
  const listed = (await handle({ jsonrpc: "2.0", id: 1, method: "tools/list" })).result.tools.map((tool) => tool.name);
  assert.ok(listed.includes("get_render_catalog") && listed.includes("check_render"));
  assert.match((await call("get_render_catalog", {})).content[0].text, /### Stack/);
  assert.equal(JSON.parse((await call("get_render_catalog", { format: "schema" })).content[0].text).catalogId, catalogId);
  assert.match((await call("check_render", { messages: rules.examples[1].messages })).content[0].text, /^Valid/);
  assert.match((await call("check_render", { messages: JSON.stringify(surface(stack("x"))) })).content[0].text, /No component has the id "x"/);
  assert.equal((await call("check_render", {})).isError, true);
  const initialized = (await handle({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} })).result;
  assert.match(initialized.instructions, /check_render/);
  assert.match(initialized.instructions, /render_ui/);
});

test("render_ui shows a checked surface as an MCP App, and answers in text where a host shows none", async () => {
  const handle = remoteMcpHandler({ version: "test" });
  const rpc = async (method, params) => (await handle({ jsonrpc: "2.0", id: 1, method, params })).result;
  const tool = (await rpc("tools/list")).tools.find((entry) => entry.name === "render_ui");
  assert.deepEqual(tool._meta, { ui: { resourceUri: "ui://mlola/render" } });
  // The view it names is listed and read as an MCP App: one page, no outside resource.
  const listed = (await rpc("resources/list")).resources.find((resource) => resource.uri === "ui://mlola/render");
  assert.equal(listed.mimeType, "text/html;profile=mcp-app");
  const [page] = (await rpc("resources/read", { uri: "ui://mlola/render" })).contents;
  assert.equal(page.mimeType, "text/html;profile=mcp-app");
  assert.deepEqual(page._meta, { ui: { prefersBorder: false } });
  assert.match(page.text, /^<!doctype html>/);
  assert.match(page.text, /ui\/initialize/);
  assert.doesNotMatch(page.text, /<script[^>]+src=|<link[^>]+href=/);
  // The guide still reads as Markdown.
  assert.equal((await rpc("resources/read", { uri: "mlola://guide" })).contents[0].mimeType, "text/markdown");
  // A valid call says it was shown, with the check's result as data; an invalid one says what to fix.
  const shown = await rpc("tools/call", { name: "render_ui", arguments: { messages: rules.examples[0].messages } });
  assert.match(shown.content[0].text, /^Valid[\s\S]*Shown to the person/);
  assert.equal(shown.structuredContent.valid, true);
  assert.equal(shown.structuredContent.surfaces[0].surfaceId, "signup");
  const refused = await rpc("tools/call", { name: "render_ui", arguments: { messages: surface(stack("ghost")) } });
  assert.match(refused.content[0].text, /No component has the id "ghost"[\s\S]*Nothing was shown/);
  assert.equal(refused.structuredContent.valid, false);
});

test("docs/render.md names every component and states the limits the check holds", () => {
  const doc = fs.readFileSync(path.join(root, "docs/render.md"), "utf8");
  const listed = doc.slice(doc.indexOf("| Group | Components |"), doc.indexOf("The groups and their titles"));
  const rows = listed.split("\n").slice(2).filter((line) => line.startsWith("| ")).map((line) => line.split("|").slice(1, 3).map((cell) => cell.trim()));
  // One row a group, titled and filled as the catalog has it.
  const expected = Object.entries(rules.groups).map(([group, title]) => [title, Object.keys(rules.components).filter((name) => rules.components[name].group === group).join(", ")]);
  assert.deepEqual(rows, expected);
  assert.ok(doc.includes(`${Object.keys(rules.components).length} components`));
  // Every surface the doc shows passes the check it documents.
  const surfaces = [...doc.matchAll(/```json\n(\[[\s\S]*?\])\n```/g)].map((match) => JSON.parse(match[1]));
  assert.ok(surfaces.length >= 1);
  for (const messages of surfaces) assert.deepEqual(check(messages).errors, []);
  const limits = doc.slice(doc.indexOf("| Limit | Value |"), doc.indexOf("The remote MCP server"));
  for (const value of Object.values(rules.limits)) assert.ok(limits.includes(`| ${value} `), `docs/render.md does not state the limit ${value}`);
});
