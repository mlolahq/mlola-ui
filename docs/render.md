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
| What goes around a model you call yourself | `packages/behavior/src/render/ai.js` (copied to `packages/cli/registry/render-ai.js` at codegen) |
| The host both renderers draw from | `packages/behavior/src/render/core.js` |
| The renderer without a framework | `packages/behavior/src/render/dom.js` |
| The React renderer | `packages/components/render-surface/` |
| The Pro catalog, written by hand | `packages/registry/catalog/render/definition.json`, laid over the catalog above |
| The Pro catalog, resolved | `packages/registry/catalog/generated/render-rules.json` and `render-catalog.json` (served at `https://ui.mlola.com/a2ui/catalog/pro/v1`), and `packages/components/render-pro/rules.ts`, which a project receives |
| The Pro renderer (Mlola Pro) | `packages/components/render-pro/` |
| The MCP App | `packages/behavior/src/render/app.js`, bundled by `scripts/build-render-app.mjs` into `packages/cli/registry/render-app.html` |
| The generators | `scripts/build-render-catalog.mjs` and `scripts/build-render-app.mjs`, run by `npm run codegen` |
| Tests | `tests/render.test.mjs` (the check), `tests/render-ai.test.mjs` (your own model, and the examples below), `tests/render-core.test.mjs` (the host), `tests/render-dom.test.mjs`, `tests/render-surface.test.tsx`, `tests/render-pro-check.test.mjs` and `tests/render-pro.test.tsx` (the Pro catalog and its renderer), `tests/a2ui/render-conformance.test.mjs` (A2UI's own schemas, over both catalogs), and the browser journeys in `tests/e2e/render.spec.ts` and `tests/e2e/render-pro.spec.ts` |
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
report, like `check_render`. The app is one page that loads nothing and
connects nowhere, and its resource says so: its content security policy
(`_meta.ui.csp`) names no domain, so the host can hold it to the strictest
policy.

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

`rules` takes a catalog that adds to Mlola's, and `components` what draws
each type it adds: a React component that receives the instance's `props`,
`read` and `write` for the ones bound to the data model, its `children`
drawn, and an `id`. Mlola's own components are always drawn by Render
Surface. Render Pro, below, is built this way.

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

## With your own model

Mlola never calls a model. Your server calls yours, with your key, and
`mlola-ui/render/ai` (also `@mlola-ui/behavior/render/ai`) is what goes around
that call: what to tell the model, how to read what it answers, and what to
answer when the check refuses it. Nothing a person types and nothing a model
writes passes through Mlola.

```js
import { composeRender } from "mlola-ui/render/ai";
import rules from "mlola-ui/render/rules" with { type: "json" };

const { valid, messages, result, turns } = await composeRender({
  rules,
  request: "A form to book a table for tonight",
  generate, // your function: ({ system, messages }) => the model's reply as text
});

if (valid) sendToTheClient(messages); // draw them with Render Surface or mountRender
else log(result.errors); // the model did not get there in three tries
```

`composeRender` asks the model, reads its reply, checks it, and hands a
refused reply back with the errors as the next turn, up to `attempts` times
(3 when left out, 10 at most). An empty reply is asked for again. It answers
with `valid`, the `messages` to draw (none unless valid), the check's
`result`, how many `attempts` it took, and `turns`: the conversation with
the model's replies in it.

When the person presses a Button, your `onAction` receives A2UI's action.
Continue from `turns` with it as the person's next turn, and the model
answers with the next surface:

```js
const next = await composeRender({
  rules,
  request: [...turns, { role: "user", content: JSON.stringify(action) }],
  generate,
});
```

Every answer is one whole surface (`createSurface`, `updateComponents`,
`updateDataModel`), so each is checked on its own and drawn in place of the
one before: pass the new `messages` to the renderer as a new array. The
action's context is what a person typed. Check it on your server before
anything acts on it, and the prompt tells the model the same.

### The one function you write

`generate` takes `{ system, messages, attempt }`, where `messages` are turns
of `{ role: "user" | "assistant", content }`, and answers with the model's
text. These three are run by `tests/render-ai.test.mjs` against a stand-in
for each service, so their requests keep the shape shown. Name the model you
use where they say `MODEL`; each reads its key from the environment, where
your server keeps it.

A server that speaks chat completions, which most hosted and local models do:

<!-- example: generate-chat-completions -->
```js
async function generate({ system, messages }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: system }, ...messages] }),
  });
  if (!response.ok) throw new Error(`The model's server answered ${response.status}.`);
  const reply = await response.json();
  return reply.choices?.[0]?.message?.content ?? "";
}
```

Anthropic's Messages API:

<!-- example: generate-anthropic -->
```js
async function generate({ system, messages }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: MODEL, max_tokens: 8192, system, messages }),
  });
  if (!response.ok) throw new Error(`The model's server answered ${response.status}.`);
  const reply = await response.json();
  return (reply.content ?? []).map((block) => (block.type === "text" ? block.text : "")).join("");
}
```

Google's Gemini API:

<!-- example: generate-gemini -->
```js
async function generate({ system, messages }) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((turn) => ({ role: turn.role === "assistant" ? "model" : "user", parts: [{ text: turn.content }] })),
    }),
  });
  if (!response.ok) throw new Error(`The model's server answered ${response.status}.`);
  const reply = await response.json();
  return (reply.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? "").join("");
}
```

A reply that stops inside a message is refused, with a message that says
where: give the model enough output room to finish a surface.

### The prompt

`composeRender` sends `renderSystemPrompt(rules)`: how to answer, then the
catalog's guide. It is the same text for every request, so a model's prompt
cache holds it. To add your product's own instructions, pass
`system` with the prompt in it:

```js
import { renderSystemPrompt } from "mlola-ui/render/ai";

const system = `You help people manage their orders at Northwind.\n\n${renderSystemPrompt(rules)}`;
```

A server that is not JavaScript reads the same prompt from the CLI, and
checks replies with `mlola-ui render check`:

```bash
npx mlola-ui render prompt > render-prompt.txt
npx mlola-ui render prompt --tool --page-theme
```

### Your brand's theme

A surface drawn with `theme="inherit"` (`theme: "inherit"` for `mountRender`)
takes the theme of the page around it, so it wears your own theme, from
`mlola.theme.json` or the Theme Studio, with the contrast that theme was
solved for. Tell the model to leave themes alone, so it spends nothing on
choosing one:

```js
await composeRender({ rules, request, generate, theme: "page" });
// or: renderSystemPrompt(rules, { theme: "page" })
```

### A model that also answers in words

In a chat, most answers are words and some are better as a surface. Give the
model a tool, and it decides:

```js
import { checkRenderReply, renderSystemPrompt, renderTool } from "mlola-ui/render/ai";

const system = renderSystemPrompt(rules, { output: "tool" });
const tool = renderTool(); // { name: "render_ui", description, inputSchema }

// When the model calls the tool:
const { valid, messages, repair } = checkRenderReply(call.arguments, rules);
if (valid) sendToTheClient(messages);
answerTheCall(valid ? "Shown to the person." : repair);
```

`renderTool` answers with a name, a description and a JSON Schema, the three
parts every provider's tool calling is built from: `inputSchema` is
`parameters` for chat completions and Gemini, and `input_schema` for
Anthropic. The messages travel as one string, which every provider's schema
dialect takes. `checkRenderReply` reads the arguments whether your SDK parsed
them or not.

### As it streams

`createRenderReader` reads messages out of the model's text as it arrives,
whatever the model wrapped them in: JSON Lines, an array, a code fence, or
`{"messages": […]}`.

```js
import { createRenderReader, renderRepairPrompt } from "mlola-ui/render/ai";
import { validateRender } from "mlola-ui/render";

const reader = createRenderReader(rules);
for await (const chunk of textFromTheModel) {
  for (const message of reader.push(chunk)) sendToTheClient(message);
}
const { messages, error } = reader.end();
const result = error ? null : validateRender(messages, rules);
if (error || !result.valid) retryWith(error ?? renderRepairPrompt(result));
```

On the client, pass the messages to Render Surface with `streaming` while
they arrive. A renderer draws nothing that fails the check, so a reply that
turns out wrong halfway leaves the last good state on screen while your
server asks again.

`end()` answers with an error, and no messages, for a reply it could only
read in part: a piece that is not JSON, a message still open at the end, more
text than the input limit, or no message at all.

One mistake it reads through. At the end of a long line of nested JSON a
model miscounts its closing braces more often than it gets anything else
wrong, and writes the same miscount again when asked to. Where a closer can
only mean one thing, it is read as that: a `]` met while objects inside its
array are still open closes them first, a closer nothing opened is left out,
and a new message on a line of its own ends the one before it. `mended`
(on `end()` and on `checkRenderReply`) counts the closers added or left out,
0 for a reply that was JSON as written. What was mended is still checked like
any other reply, and nothing is guessed at the end of one: a reply that stops
with a message open may have been cut off, so it is refused.

`checkRenderReply` also refuses a reply that passes the check and shows
nothing (a surface with no components).

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
- **Mlola Pro components** are not in this catalog. Charts and the data grid
  are in the Pro catalog (see "The Pro catalog").

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

## The Pro catalog

Mlola Pro adds charts and a data grid. The Pro catalog is the whole catalog
above with five more components, under its own id,
`https://ui.mlola.com/a2ui/catalog/pro/v1`, which serves its A2UI catalog. A
surface names one catalog, so one that uses a chart names this one.

| Group | Components |
| --- | --- |
| Charts | BarChart, LineChart, DonutChart, Sparkline |
| Data | DataGrid |

Render Pro draws it. It comes with a Mlola Pro license, like every Pro
component, and takes the props of Render Surface:

```bash
npx mlola-ui add render-pro
```

```tsx
import { RenderPro } from "@/components/render-pro";

<RenderPro messages={messagesFromTheAgent} onAction={(message) => sendToTheAgent(message)} onError={(refused) => sendToTheAgent(refused)} />
```

The catalog arrives in your project beside it, as plain data a server can
import. It is what you pass wherever this document says `rules`: to
`composeRender` and `renderSystemPrompt` for a model you call yourself, to
`validateRender` for a check, to `createRenderHost` for a host you keep.

```js
import { composeRender } from "mlola-ui/render/ai";
import { renderProRules } from "@/components/render-pro/rules";

const { valid, messages } = await composeRender({ rules: renderProRules, request: "How did orders go this quarter?", generate });
```

A chart reads rows: one object for each category, with its name in one field
and a number in each field a series draws. Rows sit in the component or in
the data model, and a chart bound to the data model draws again when an
update changes them.

```json
[
  {"version": "v0.9.1", "createSurface": {"surfaceId": "orders", "catalogId": "https://ui.mlola.com/a2ui/catalog/pro/v1"}},
  {"version": "v0.9.1", "updateComponents": {"surfaceId": "orders", "components": [
    {"id": "root", "component": "Stack", "children": ["title", "chart"]},
    {"id": "title", "component": "Heading", "level": 2, "text": "Orders by month"},
    {"id": "chart", "component": "BarChart", "label": "Orders by month, new and returning customers", "data": {"path": "/months"}, "x": "month",
      "series": [{"key": "new", "label": "New customers"}, {"key": "returning", "label": "Returning customers"}], "stacked": true}
  ]}},
  {"version": "v0.9.1", "updateDataModel": {"surfaceId": "orders", "path": "/months", "value": [
    {"month": "July", "new": 148, "returning": 231},
    {"month": "August", "new": 163, "returning": 254},
    {"month": "September", "new": 197, "returning": 291}
  ]}}
]
```

- **BarChart** and **LineChart** take `data`, `x` (the field that names each
  row) and `series` (each `{"key", "label"}`, six at most; a line may be
  `dashed` for a plan or a projection).
- **DonutChart** takes `data` of six rows at most, `name` and `value`.
- **Sparkline** takes `values`, two or more numbers.
- **DataGrid** takes `columns` (each with a `type`, and optionally `pinned`
  and `editable`) and `rows`. A person sorts it, selects and copies cells,
  and edits the columns marked `editable`. What they change is written to the
  data model where `rows` is bound, so a Button whose action sends that path
  sends the rows as they stand.

A chart's `label` is its name for a screen reader, with its numbers in a
table beside it. It is not drawn, so a Heading goes before the chart.

The check holds what a chart draws, beyond the shape of its props: every row
written into the component has its name, and a number (or nothing, for a
gap) wherever a series draws one, so `"163"` in place of `163` is refused
with the row it is in. An editable column over rows written into the
component is refused: an edit needs somewhere to be written. Rows in the
data model arrive after the check, so Render Pro reads them with care: a row
that is not an object is passed over, and a value that is not a number is a
gap.

The MCP tools (`get_render_catalog`, `check_render`, `render_ui`), the CLI's
`render` commands and `mountRender` hold the free catalog. Check a Pro
surface in code, with the rules in your project.

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

The Pro catalog is changed the same way, in
`packages/registry/catalog/render/definition.json`. It holds only what Pro
adds; codegen lays it over the catalog above and drops an alias that names a
Pro component. A new component is drawn in `render-pro.tsx`, shown in one of
the definition's examples and named in the table under "The Pro catalog"
(`tests/render-pro-check.test.mjs` and `tests/render-pro.test.tsx` hold all
three). A prop that reads rows names them with `"rows"`, and `"numeric"`
where it draws their values, so the check holds rows written into the
component.

A component joins the catalog when agents need it often and every value it
takes can be chosen by name. A component that needs a callback, a color or
free-form markup stays out.
