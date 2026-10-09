# Mlola Render

Mlola Render lets an agent show interface instead of writing code for it: a
form inside a chat, a status card in an agent's own app, a table of results a
tool just fetched. The agent describes the surface as
[A2UI](https://a2ui.org) messages (version 0.9.1), Mlola checks them against
its catalog, and a renderer draws them with Mlola components in the surface's
theme.

The agent never writes a color, a size or a class. It picks components and
named values (`tone`, `variant`, `size`) from the catalog, so what it composes
is accessible and on brand by construction, and the check tells it, in A2UI's
own error shape, exactly what to fix when it is not.

Three renderers draw what passed the check, and all three draw from one host,
so a binding, a template, an action or a refused update means the same in
each:

- **Render Surface**, a free React component (`npx mlola-ui add render-surface`).
- **`@mlola-ui/behavior/render`**, for a page without a framework.
- **`render_ui`**, an MCP App: the surface shows inside a chat that supports
  MCP Apps, and what the person presses comes back to the agent as their next
  message.

| Piece | Where |
| --- | --- |
| The catalog, written by hand | `packages/registry/render/definition.json` |
| The catalog, resolved from the components | `packages/registry/generated/render-rules.json` (the check reads it), and `packages/behavior/src/render/rules.js` for a page |
| The A2UI catalog (JSON Schema) | `packages/registry/generated/render-catalog.json`, served at `https://ui.mlola.com/a2ui/catalog/v1` |
| The check | `packages/behavior/src/render/check.js` (copied to `packages/cli/registry/render.js` at codegen) |
| The host both renderers draw from | `packages/behavior/src/render/core.js` |
| The renderer without a framework | `packages/behavior/src/render/dom.js` |
| The React renderer | `packages/components/render-surface/` |
| The MCP App | `packages/behavior/src/render/app.js`, bundled by `scripts/build-render-app.mjs` into `packages/cli/registry/render-app.html` |
| The generators | `scripts/build-render-catalog.mjs` and `scripts/build-render-app.mjs`, run by `npm run codegen` |
| Tests | `tests/render.test.mjs` (the check), `tests/render-core.test.mjs` (the host), `tests/render-dom.test.mjs`, `tests/render-surface.test.tsx`, `tests/a2ui/render-conformance.test.mjs` (A2UI's own schemas), and the browser journeys in `tests/e2e/render.spec.ts` |
| Site page | `/docs/render` |

## For an agent

With the Mlola MCP server connected (`npx mlola-ui mcp` in a project, or
`https://ui.mlola.com/mcp` from anywhere):

1. Call `get_render_catalog` once. It returns every component, each prop and
   the values it takes, how binding and actions work, and complete examples.
2. Compose the surface as A2UI messages.
3. Call `check_render` with all of the surface's messages. Fix every error it
   reports (each names a JSON Pointer path into what you sent) and check
   again.
4. Send the messages only when the check says `Valid`.

In a chat that shows MCP Apps, call `render_ui` with the same messages: it
checks them and the person sees the surface. When they press a button, their
next message is A2UI's action, with the button's event name and what they
entered. Where the host shows no apps, `render_ui` answers with the check's
report, like `check_render`.

Advice (`advice` lines) does not stop a surface rendering, but it is worth
taking: a component outside the tree is never shown, two primary buttons
compete, and two fields with one label cannot be told apart.

## For a developer

### Drawing a surface in React

```bash
npx mlola-ui add render-surface
```

```tsx
import { RenderSurface } from "@/components/render-surface";

<RenderSurface
  messages={messagesFromTheAgent}
  streaming={stillArriving}
  onAction={(message) => sendToTheAgent(message)}
  onError={(refused) => sendToTheAgent(refused)}
/>
```

Pass the same array with more messages at its end as they arrive, and a
different array for a different conversation. While `streaming`, a tree that
arrives in pieces waits for the stream to pause before it is drawn. The first
messages draw in the first render, so a surface rendered on the server
arrives whole. `theme="inherit"` keeps the page's theme instead of the one the
agent named, and `host` takes a host you keep yourself
(`createRenderHost` from `@mlola-ui/behavior/render/core`).

### Drawing a surface without a framework

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mlola-ui/engine@1/generated/mlola.css" />
<div id="agent-ui"></div>
<script type="module">
  import { mountRender } from "https://cdn.jsdelivr.net/npm/@mlola-ui/behavior@1/src/render/dom.js";
  import rules from "https://cdn.jsdelivr.net/npm/@mlola-ui/behavior@1/src/render/rules.js";

  const view = mountRender(document.querySelector("#agent-ui"), {
    rules,
    onAction: (message) => sendToTheAgent(message),
    onError: (refused) => sendToTheAgent(refused),
  });
  view.receive(messagesFromTheAgent);
</script>
```

It draws the markup of the same Mlola components and lets the runtime's
tabs, accordion, select, slider and switch attach to it. Data changes update
in place, so typing keeps its field; a new tree or a longer list rebuilds and
keeps focus, the caret, the open tab and the open sections. A date is the
browser's own date field, as a Mlola input. It is 26 KiB gzip with the check,
loaded only where a page draws surfaces (`check:perf` holds it to 28).

### What both renderers do

- **Nothing unchecked is drawn.** A surface shows its last state that passed.
  An update with an error is refused, changes nothing on screen, and reaches
  `onError` as A2UI's error message (`{"version", "error": {"code",
  "surfaceId", "path", "message"}}`, with the path inside the one message
  that was refused), ready to send to the agent.
- **Fields write to the data model**, where they are bound. A pressed Button
  sends A2UI's action (`{"version", "action": {"name", "surfaceId",
  "sourceComponentId", "timestamp", "context"}}`), each binding in its
  context replaced by its value at that moment. A surface created with
  `sendDataModel` also passes its data model to `onAction`.
- **A required field holds back** the actions that would send its value: one
  bound at or under a path the action's context reads. The field shows its
  error, the first one takes focus, and a status region names them. Cancel,
  which sends nothing of the form, still goes.
- **Headings keep the agent's levels**, and an Empty State or an Accordion
  takes the level under the heading before it.
- **A surface in its own theme lays its own ground**, so its ink is solved
  against its own background inside a page of another theme. A surface whose
  mode is `system` follows the reader, or, in the MCP App, the host.
- **What the agent wrote is only ever text or an attribute.** Nothing it
  sends is parsed as markup.

### Checking without drawing

From a terminal:

```bash
npx mlola-ui render check ui.json      # a file of messages: an array, one object, or JSON Lines
cat ui.jsonl | npx mlola-ui render check -
npx mlola-ui render check ui.json --json   # the result as data
npx mlola-ui render catalog            # the guide an agent reads, as Markdown
npx mlola-ui render catalog --schema   # the A2UI catalog
```

`render check` exits with 1 when the messages have an error, so it can gate CI
or a test of the prompts that produce them.

In code, where an agent's output passes through your server before it reaches
a client:

```js
import { validateRender } from "mlola-ui/render";
import rules from "mlola-ui/render/rules" with { type: "json" };

const result = validateRender(messagesFromTheModel, rules);
if (!result.valid) {
  // Hand the errors back to the model: each is { code, surfaceId, path, message }.
  return retryWith(result.errors);
}
```

`mlola-ui/render` and `mlola-ui/render/rules` carry their TypeScript types, so
the rules type-check as `RenderRules` without a cast. The same JSON ships in
`@mlola-ui/registry` as `@mlola-ui/registry/render/rules` and
`@mlola-ui/registry/render/catalog`, without types. The check uses no Node or
DOM API, so it runs in a server, an edge function or a browser.

For a stream, check each message as it arrives and the whole tree before
drawing:

```js
import { applyRenderMessages, checkSurfaces, createRenderState } from "mlola-ui/render";

const state = createRenderState(rules);
for await (const message of stream) {
  const { errors } = applyRenderMessages(state, message);
  if (errors.length) return reject(errors);
}
const { errors, advice } = checkSurfaces(state);
```

Checking message by message and checking all at once give the same answer.
A state can live as long as its stream: the limits count what one call brings
and what is open at once, never a running total, and a deleted surface's
components and data are let go.

Every call answers with `errors`, which stop a surface rendering, and
`advice`, which does not. `validateRender` adds `valid` and `surfaces` (each
surface's id, theme and component count).

## The messages

Mlola Render reads A2UI v0.9 and v0.9.1 messages. Each message is an object
with `"version"` and exactly one of four kinds:

```json
[
  {"version": "v0.9.1", "createSurface": {"surfaceId": "signup", "catalogId": "https://ui.mlola.com/a2ui/catalog/v1", "theme": {"name": "graphite", "mode": "system"}}},
  {"version": "v0.9.1", "updateComponents": {"surfaceId": "signup", "components": [
    {"id": "root", "component": "Card", "children": ["title", "email", "submit"]},
    {"id": "title", "component": "Heading", "level": 2, "text": "Join the beta"},
    {"id": "email", "component": "Input", "type": "email", "label": "Work email", "value": {"path": "/form/email"}, "required": true},
    {"id": "submit", "component": "Button", "variant": "primary", "text": "Join", "action": {"event": {"name": "join_beta", "context": {"email": {"path": "/form/email"}}}}}
  ]}},
  {"version": "v0.9.1", "updateDataModel": {"surfaceId": "signup", "path": "/form", "value": {"email": ""}}}
]
```

- **createSurface** opens a surface. `catalogId` is always
  `https://ui.mlola.com/a2ui/catalog/v1`. `theme` takes a `name` (graphite,
  atelier, machined, aerogel or nordic; graphite when left out) and a `mode`
  (`light`, `dark`, or `system`, which follows the reader). Nothing else:
  colors, fonts and radii come from the theme.
- **updateComponents** sends components as a flat list. Each has a unique
  `id` and a `component` type. Exactly one has the id `"root"`; containers
  name their children by id. A later update replaces a component with the
  same id.
- **updateDataModel** writes a value at a JSON Pointer (`"/form"`, or `"/"`
  for everything), or removes it when `value` is left out. Inside an array a
  segment is an index up to the array's length (the length appends). Inputs
  bind to it with `{"path": "/form/email"}`.
- **deleteSurface** removes a surface.

`children` is an array of ids, or a template that repeats one component for
each item of an array in the data model:
`{"componentId": "row", "path": "/people"}`. Inside the repeated component,
relative paths (`{"path": "name"}`) read the current item, and a template
inside it reads the item's own list the same way (`"path": "items"`).

A Button's `action` sends an event back to the agent:
`{"event": {"name": "join_beta", "context": {"email": {"path": "/form/email"}}}}`.
When it is pressed, the agent receives A2UI's action message, with each
binding in the context resolved to its value at that moment:

```js
{"version": "v0.9.1", "action": {"name": "join_beta", "surfaceId": "signup", "sourceComponentId": "submit",
  "timestamp": "2026-10-09T09:30:00Z", "context": {"email": "lena@company.com"}}}
```

The context is what a person typed: check it on the server like any form
post before the agent acts on it.

### What Mlola does not take (yet)

- **Client-side functions and checks** (`functionCall`, `checks`,
  `{"call": …}` values) are refused with a clear error. Mark a field
  `required`, and check the values when the action arrives.
- **Icon-only buttons** (`size: "icon"`) are not in the catalog: every Button
  has words.
- **Mlola Pro components** are not in the catalog.

### Coming from A2UI's basic catalog

Agents that know A2UI often write its basic catalog's names. The check
answers each with what to use instead, and the guide lists them up front, so
an agent can avoid them on its first try:

- A basic name with a Mlola equivalent is pointed at it (`aliases`): a
  `Column` gets "use Stack", a `TextField` "use Input", a `DateTimeInput`
  "use DatePicker".
- A basic component Mlola does not offer (`Image`, `Icon`, `Video`,
  `Modal`, `Divider`) and a basic prop or value it does not take
  (`weight`, `justify`, a Button's `child`, Text's `variant: "h1"`, an
  Input's `variant: "longText"`…) gets a hint (`borrowed`), like "For a
  heading use a Heading with "level"".

Both lists live in the definition. `npm run codegen` fails on a hint that
could never show: a name the catalog has, or a prop or value the component
already takes.

## The catalog

25 components in six groups. `npx mlola-ui render catalog` (or
`get_render_catalog`) prints every prop and value, generated from the
components, so this list is a map and the guide is the reference.

| Group | Components |
| --- | --- |
| Layout | Stack, Row, Grid |
| Text | Heading, Text |
| Containers | Card, Alert, EmptyState, Tabs, Tab, Accordion, AccordionItem |
| Forms | Input, Textarea, Select, RadioGroup, Checkbox, Switch, Slider, DatePicker |
| Actions | Button |
| Data | Badge, Progress, Avatar, Table |

The groups and their titles are `groups` in the definition: the guide, the
table on `/docs/render` and the check's messages all read them, and the tests
hold this table to them.

The catalog is an A2UI catalog in the form of A2UI's own basic catalog.
`tests/a2ui/render-conformance.test.mjs` proves it the way A2UI tests its own:
A2UI's v0.9.1 message schema, with the Mlola catalog registered as the
surface's catalog, accepts every example, every surface this file shows and
every component with each value it offers, and refuses what the check refuses
for its shape. An error from the check passes A2UI's schema for the error a
renderer sends back. The schemas are A2UI's, unchanged, in `tests/a2ui/`.

## What the check holds

A schema can say a prop is a string. The check also holds what makes a surface
usable, and stops it rendering until it is fixed:

- Every component and prop is in the catalog, and every value is one the
  component offers (`"Primary"` gets "values are case-sensitive").
- Nothing sets a color, style, class or theme token by hand.
- Every field, control, table, tab group and avatar has a name a screen reader
  reads, and none of those names is empty.
- The tree has one root; every child exists; a component appears in one place;
  there are no loops; parts sit in their own container (a Tab in Tabs).
- Headings do not skip a level going deeper.
- A Slider's, Progress's or DatePicker's value sits in its range, and a
  date is a day that exists; a Select's or RadioGroup's value is one of its
  options; options and column keys are unique.
- Data paths are JSON Pointers that cannot reach an object's prototype;
  relative paths appear only inside a template.
- Actions are named events with plain values or bindings, never code or URLs.

Every error has A2UI's `VALIDATION_FAILED` shape:

```json
{
  "code": "VALIDATION_FAILED",
  "surfaceId": "signup",
  "path": "/1/updateComponents/components/2/variant",
  "message": "Button \"variant\" is \"primary\", not \"Primary\": values are case-sensitive."
}
```

`path` points into the input as given: with an array of messages it starts at
the message's index; with one message it starts at its kind. That is what an
agent needs when it checks a whole batch. A2UI's own error message, which a
renderer sends back to the agent, carries the same four fields with a `path`
inside the one message it refuses (`/components/2/variant`); the renderer
(stage 2) sends that form.

## Limits

Messages come from a model, so the check reads them in time that grows with
their length and stops at these limits (`limits` in the rules). The tests hold
every hostile input at the size limit to under 1.5 s.

| Limit | Value |
| --- | --- |
| Input, as text | 1048576 characters |
| Messages in one call | 200 |
| Surfaces open at once | 20 |
| Components per surface | 300 |
| Tree depth | 24 |
| An id | 128 characters |
| Text | 4000 characters |
| A label, title or option | 120 characters |
| Options in a Select or RadioGroup | 100 |
| Table columns | 12 |
| Table rows | 500 |
| Values in an action's context | 32 |
| A data path | 512 characters |
| A surface's data model, as it stands after each update | 262144 bytes of JSON |

The remote MCP server takes requests up to 256 KB.

## Changing the catalog

`packages/registry/render/definition.json` is the one place to edit. A prop
with fixed values never lists them: `"from": "Button.variant"` reads them from
the component's manifest, `"contract"` from the engine's element contract, so
the catalog cannot offer a value a component no longer has. Then:

1. `npm run codegen` resolves the definition into the two generated files and
   copies them into the CLI. It fails on a prop with no description, a value
   that does not exist, a Pro component, a group with no title, a hint that
   could never show, or an example that does not pass the check.
2. Add a case to `tests/render.test.mjs` for any rule the change adds. A new
   kind of prop also needs its schema in the generator and a sample in the
   conformance test, which fails until it has one.
3. Draw a new component in both renderers (`render-surface.tsx` and
   `dom.js`) with the Mlola component it names. Their tests build one of each
   component from the catalog, so a component neither draws shows up there.
4. Name a new component in the catalog table above (the tests hold this file
   to the catalog), and add an example to the definition when it shows
   something the others do not.

A component joins the catalog when agents need it often and every value it
takes can be chosen by name. A component that needs a callback, a color or
free-form markup stays out.
