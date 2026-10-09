import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { projectContract, projectThemes } from "./check.js";
import { checkMarkup, describeItem, designData, designGuide, renderApp, renderCatalog, renderRules, searchItems, suggest, themes, tokens } from "./knowledge.js";
import { formatRenderReport, renderCatalogGuide, validateRender } from "../registry/render.js";

/**
 * `mlola-ui mcp` — a Model Context Protocol server over stdio.
 *
 * A coding agent (Claude Code, Cursor, Codex, VS Code, …) starts it in the
 * project and asks it about Mlola instead of recalling Tailwind from its
 * training: which component fits, what it is called, which token to read,
 * whether the markup it just wrote is right. It can also install components
 * and set a project up. Answers come from the registry bundled with this
 * CLI, so they match what `add` installs, offline.
 *
 * The protocol is newline-delimited JSON-RPC 2.0, small enough to speak
 * without a dependency. Nothing but protocol messages is written to stdout;
 * diagnostics go to stderr.
 */

const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const RENDER_INSTRUCTIONS = "To show UI at runtime instead of writing code (a form or a status card inside a chat or an agent's app), compose A2UI messages with Mlola Render: read get_render_catalog once, then run check_render on the messages and fix every error before sending them. In a host that shows MCP Apps, render_ui shows the surface in the conversation, and what the person presses comes back to you as their next message.";

/** Mlola Render's MCP App: the view render_ui names (scripts/build-render-app.mjs). */
const RENDER_APP = { uri: "ui://mlola/render", name: "Mlola Render", description: "Shows the A2UI surfaces render_ui is called with, drawn with Mlola components; a pressed button comes back as a message.", mimeType: "text/html;profile=mcp-app" };

/** The resources both servers serve, with what reading each answers: its text, type and metadata. */
const SHARED_RESOURCES = {
  "mlola://guide": { listed: { uri: "mlola://guide", name: "Mlola UI design guide", description: "Classes, attributes, tokens and rules, generated from the stylesheet.", mimeType: "text/markdown" }, read: () => designGuide() ?? "" },
  [RENDER_APP.uri]: {
    listed: RENDER_APP,
    // No connection, no outside resource: the page holds everything it draws with. No border: a surface lays its own ground.
    read: () => ({ text: renderApp() ?? "", mimeType: RENDER_APP.mimeType, _meta: { ui: { prefersBorder: false } } }),
  },
};

const INSTRUCTIONS = `This project's UI is Mlola UI: native CSS classes (ml-*), data-* attributes for state and variant, and --ml-* tokens. There is no Tailwind.
Before writing UI: call get_design_rules once, then search_components for what you need and get_component for how to use it. Read tokens with get_tokens instead of writing colors, sizes, shadows or durations. After writing markup, run check_markup on it and fix what it reports.
${RENDER_INSTRUCTIONS}`;

const REMOTE_INSTRUCTIONS = `Mlola UI is a component system on native CSS classes (ml-*), data-* attributes for state and variant, and --ml-* tokens. There is no Tailwind.
Before writing UI: call get_design_rules once, then search_components for what you need and get_component for how to use it. Read tokens with get_tokens. After writing markup, run check_markup and fix what it reports. This server cannot write files: get_install_command gives the commands to run in the project, and Mlola Pro items need a license token (npx mlola-ui login). For a page with no build step (one HTML file), get_design_rules gives the stylesheet link and the script to paste.
${RENDER_INSTRUCTIONS}`;

const text = (value) => ({ content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] });

/**
 * How to load Mlola in a page with no build step: the engine's stylesheet and
 * the behavior runtime from a CDN, at this release's version.
 */
export function noBuildSetup(version) {
  const cdn = (pkg, file) => `https://cdn.jsdelivr.net/npm/@mlola-ui/${pkg}@${version}/${file}`;
  return [
    "Without a build step (one HTML file), load Mlola from a CDN:",
    `<link rel="stylesheet" href="${cdn("engine", "generated/mlola.css")}">`,
    `<html data-theme="graphite" data-mode="system">   (data-mode system follows the reader's light or dark setting)`,
    "For menus, dialogs, tabs, selects, sliders, switches, tooltips and toasts, mark each root with data-ml=\"<behavior>\" as get_component's html example shows, and load the runtime once:",
    `<script type="module">import { observe } from "${cdn("behavior", "src/index.js")}"; observe();</script>`,
    "The free components work this way. Mlola Pro items need a project, the CLI and a license.",
  ].join("\n");
}

/** Tools that only read the registry: the local and the remote server share them. */
function readTools({ cwd, version, project = false }) {
  return [
    {
      name: "get_design_rules",
      title: "Mlola design rules",
      description: "The rules for building UI with Mlola: compose first, color by role, measure with the scales, shared state words, touch and focus. Read once before writing UI.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      handler: () => {
        const data = designData();
        return text(`${data?.rules ?? ""}\nThemes: ${themes().map((theme) => theme.id).join(", ")} (data-theme on any ancestor, data-mode light|dark|system).\nComposition primitives: ${(data?.primitives ?? []).map((entry) => entry.name).join(" ")}\n\n${noBuildSetup(version)}`);
      },
    },
    {
      name: "search_components",
      title: "Search Mlola components",
      description: "Find components, blocks, pages and templates by what they do (for example 'date range', 'chat input', 'pricing'). Returns name, tier (free or Mlola Pro) and a one-line description.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Words describing what you need. Empty lists everything." },
          kind: { type: "string", enum: ["component", "block", "page", "template"] },
          tier: { type: "string", enum: ["free", "pro"] },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      handler: ({ query = "", kind, tier }) => {
        const found = searchItems({ query, kind, tier });
        return text(found.length ? found.slice(0, 40).map((item) => `${item.name} (${item.kind}, ${item.tier}) — ${item.description}`).join("\n") : `Nothing matches "${query}". Try other words, or search with an empty query to list everything.`);
      },
    },
    {
      name: "get_component",
      title: "How to use a Mlola component",
      description: "Everything needed to use one item: import, every prop with fixed values (variant, tone, size, side…) and its default, the classes it styles and the data-* values each reacts to, dependencies and the install command. Set include_source to read a free component's source.",
      inputSchema: {
        type: "object",
        properties: { name: { type: "string" }, include_source: { type: "boolean", default: false } },
        required: ["name"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      handler: ({ name, include_source = false }) => text(describeItem(name, { cwd, includeSource: include_source })),
    },
    {
      name: "get_tokens",
      title: "Mlola design tokens",
      description: "The --ml-* tokens grouped by purpose (planes and ink, color roles, spacing, type, density, shape, depth, motion, layers…). Filter with a group name or part of a token name.",
      inputSchema: { type: "object", properties: { group: { type: "string", description: "For example 'spacing', 'color', 'shadow', 'radius'." } }, additionalProperties: false },
      annotations: { readOnlyHint: true },
      handler: ({ group }) => {
        const found = tokens(group);
        return text(found.length ? found.map((entry) => `${entry.group}: ${entry.purpose}\n  ${entry.names.join(" ")}`).join("\n\n") : `No token group matches "${group}".`);
      },
    },
    {
      name: "check_markup",
      title: "Check markup against the Mlola contract",
      description: "Checks HTML or JSX: classes that do not exist, variant classes, data-* values a class does not react to, utility classes, misuse of data-theme or data-mode, and in style attributes, <style> blocks and utility classes (bg-[#fafafa]) hand-written colors, spacing written by hand instead of the --ml-space-* scale, overridden theme tokens and text faded with opacity. Each issue names its line. Run it on markup you wrote before finishing: pass the whole page or file, <style> blocks included, not an excerpt, since it only checks what it is given.",
      inputSchema: { type: "object", properties: { markup: { type: "string" } }, required: ["markup"], additionalProperties: false },
      annotations: { readOnlyHint: true },
      handler: ({ markup }) => {
        // The local server knows the project: its own theme is a theme, and the Pro items it installed exist.
        const issues = checkMarkup(markup, project ? { themes: projectThemes(cwd), contract: projectContract(cwd) } : {});
        return text(issues.length ? issues : "No issues: every Mlola class exists and every data-* value is one its element reacts to.");
      },
    },
    {
      name: "get_render_catalog",
      title: "Mlola Render catalog",
      description: "The components an agent may compose at runtime with Mlola Render, as A2UI v0.9 messages: each component's props and allowed values, how surfaces, data binding and actions work, and complete examples. Read once before composing a surface. format \"schema\" returns the A2UI catalog (JSON Schema) instead.",
      inputSchema: { type: "object", properties: { format: { type: "string", enum: ["guide", "schema"], default: "guide" } }, additionalProperties: false },
      annotations: { readOnlyHint: true },
      handler: ({ format = "guide" }) => {
        const rules = renderRules();
        if (!rules) throw new Error("This build of mlola-ui carries no Mlola Render catalog.");
        return text(format === "schema" ? renderCatalog() : renderCatalogGuide(rules));
      },
    },
    {
      name: "check_render",
      title: "Check Mlola Render messages",
      description: "Checks A2UI messages (createSurface, updateComponents, updateDataModel, deleteSurface) against the Mlola Render catalog before they render: components and props that do not exist, values a component does not offer, colors or styles set by hand, fields and controls without a name, a missing root, children that do not exist or form a loop, headings that skip a level, values outside a range. Each error names its JSON Pointer path and the fix. Pass every message of the surface: one object, an array, or JSON Lines.",
      inputSchema: {
        type: "object",
        properties: {
          messages: {
            anyOf: [{ type: "array", items: { type: "object" } }, { type: "object" }, { type: "string" }],
            description: "The A2UI messages: an array of message objects, one message, or their JSON text (JSON Lines works too).",
          },
        },
        required: ["messages"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      handler: ({ messages }) => {
        const rules = renderRules();
        if (!rules) throw new Error("This build of mlola-ui carries no Mlola Render catalog.");
        return text(formatRenderReport(validateRender(messages, rules)));
      },
    },
    {
      name: "render_ui",
      title: "Show Mlola Render UI",
      description: "Shows an interface in the conversation: a form, a status card, a table of results. Pass A2UI messages composed from the Mlola Render catalog (read get_render_catalog first); they are checked, and drawn with Mlola components where the host shows MCP Apps. When the person presses a button, their next message carries the A2UI action with what they entered. Where the host shows no apps, this answers with the check's report.",
      inputSchema: {
        type: "object",
        properties: {
          messages: {
            anyOf: [{ type: "array", items: { type: "object" } }, { type: "object" }, { type: "string" }],
            description: "The A2UI messages of the surface: createSurface, updateComponents, updateDataModel.",
          },
        },
        required: ["messages"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      _meta: { ui: { resourceUri: RENDER_APP.uri } },
      handler: ({ messages }) => {
        const rules = renderRules();
        if (!rules) throw new Error("This build of mlola-ui carries no Mlola Render catalog.");
        const result = validateRender(messages, rules);
        const report = formatRenderReport(result);
        return {
          ...text(result.valid ? `${report}\nShown to the person. What they press comes back as their next message, with the A2UI action.` : `${report}\nNothing was shown. Fix the errors and call render_ui again.`),
          structuredContent: { valid: result.valid, surfaces: result.surfaces, errors: result.errors },
        };
      },
    },
  ];
}

function tools({ cwd, run, version }) {
  const capture = async (argv) => {
    const lines = [];
    const output = { log: (...parts) => lines.push(parts.join(" ")), error: (...parts) => lines.push(parts.join(" ")) };
    // stdout is this server's protocol channel: a package manager started by
    // init or add writes to stderr and reads nothing.
    const code = await run(argv, { cwd, output, installStdio: ["ignore", 2, 2] });
    return { code, output: lines.join("\n") };
  };
  return [
    ...readTools({ cwd, version, project: true }),
    {
      name: "add_components",
      title: "Install Mlola components",
      description: "Copies components into the project with the Mlola CLI (npx mlola-ui add), with their dependencies and styles, and installs the npm packages they import. Pro items need a login first.",
      inputSchema: {
        type: "object",
        properties: { names: { type: "array", items: { type: "string" }, minItems: 1 }, overwrite: { type: "boolean", default: false } },
        required: ["names"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      handler: async ({ names, overwrite = false }) => {
        const result = await capture(["add", ...names, ...(overwrite ? ["--overwrite"] : [])]);
        return { ...text(result.output || "Done."), isError: result.code !== 0 };
      },
    },
    {
      name: "init_project",
      title: "Set a project up for Mlola",
      description: "Runs npx mlola-ui init: writes mlola.config.json, the stylesheet entry and the agent instructions (AGENTS.md, the design guide, MCP config), and installs @mlola-ui/engine.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
      handler: async () => {
        const result = await capture(["init"]);
        return { ...text(result.output), isError: result.code !== 0 };
      },
    },
  ];
}

function resources(cwd) {
  const list = Object.values(SHARED_RESOURCES).map((resource) => resource.listed);
  if (fs.existsSync(path.join(cwd, "mlola-pro.agents.md"))) {
    list.push({ uri: "mlola://guide/pro", name: "Mlola Pro design guide", description: "The classes and attributes of the Pro items installed here.", mimeType: "text/markdown" });
  }
  return list;
}

function readResource(uri, cwd) {
  if (Object.hasOwn(SHARED_RESOURCES, uri)) return SHARED_RESOURCES[uri].read();
  if (uri === "mlola://guide/pro") return fs.readFileSync(path.join(cwd, "mlola-pro.agents.md"), "utf8");
  throw Object.assign(new Error(`Unknown resource ${uri}`), { code: -32002 });
}

const PROMPTS = [
  {
    name: "build_ui",
    title: "Build UI with Mlola",
    description: "Build a screen or component the Mlola way, and check it.",
    arguments: [{ name: "goal", description: "What to build.", required: true }],
  },
];

function prompt(name, args) {
  if (name !== "build_ui") throw Object.assign(new Error(`Unknown prompt ${name}`), { code: -32602 });
  return {
    description: "Build UI with Mlola",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Build this with Mlola UI: ${args?.goal ?? ""}\n\n1. Read the rules (get_design_rules).\n2. Find the components that cover it (search_components, get_component) and install what is missing (add_components).\n3. Compose with them and the composition primitives; write CSS only for what they do not cover, reading --ml-* tokens (get_tokens).\n4. Check the markup (check_markup) and fix every issue before you finish.`,
        },
      },
    ],
  };
}

/**
 * Arguments that do not fit a tool's input schema, described so an agent can
 * correct the call: a missing required argument, one of the wrong type, one
 * the tool does not take. Null when they fit.
 */
function invalidArguments(tool, args) {
  const schema = tool.inputSchema ?? {};
  const properties = schema.properties ?? {};
  const example = (name) => (properties[name]?.type === "array" ? `["…"]` : properties[name]?.type === "boolean" ? "true" : `"…"`);
  const typeOf = (value) => (Array.isArray(value) ? "array" : typeof value);
  if (typeOf(args) !== "object" || args === null) return `${tool.name} takes an object of arguments.`;
  for (const name of schema.required ?? []) {
    if (args[name] === undefined) return `${tool.name} needs "${name}" (${properties[name]?.type ?? "a value"}), for example {"${name}": ${example(name)}}.`;
  }
  for (const [name, value] of Object.entries(args)) {
    const expected = properties[name];
    if (!expected) {
      if (schema.additionalProperties === false) return `${tool.name} does not take "${name}". It takes: ${Object.keys(properties).join(", ") || "no arguments"}.`;
      continue;
    }
    if (expected.type && typeOf(value) !== expected.type) return `"${name}" should be ${expected.type === "array" ? "an array" : `a ${expected.type}`}, not ${typeOf(value) === "array" ? "an array" : `a ${typeOf(value)}`}.`;
    if (expected.enum && !expected.enum.includes(value)) return `"${name}" is one of: ${expected.enum.join(", ")}.`;
  }
  return null;
}

/**
 * The protocol, apart from any transport: takes one JSON-RPC message and
 * resolves to the reply, or to null for a notification. The stdio server
 * here and the site's HTTP endpoint both answer through it.
 */
export function createMcpHandler({ tools: available, listResources, readResource: read, version, instructions }) {
  const reply = (id, result) => ({ jsonrpc: "2.0", id, result });
  const fail = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });
  return async function handle(message) {
    const { id, method, params } = message ?? {};
    const isRequest = id !== undefined && id !== null;
    try {
      switch (method) {
        case "initialize": {
          const requested = params?.protocolVersion;
          return reply(id, {
            protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
            capabilities: { tools: { listChanged: false }, resources: { listChanged: false }, prompts: { listChanged: false } },
            serverInfo: { name: "mlola-ui", title: "Mlola UI", version },
            instructions,
          });
        }
        case "ping":
          return reply(id, {});
        case "tools/list":
          return reply(id, { tools: available.map(({ handler, ...tool }) => tool) });
        case "tools/call": {
          const tool = available.find((entry) => entry.name === params?.name);
          if (!tool) return fail(id, -32602, `Unknown tool ${params?.name}`);
          const problem = invalidArguments(tool, params?.arguments ?? {});
          if (problem) return reply(id, { ...text(problem), isError: true });
          try {
            return reply(id, await tool.handler(params?.arguments ?? {}));
          } catch (error) {
            // A tool that fails answers with the reason, so the agent can correct course.
            return reply(id, { ...text(error.message), isError: true });
          }
        }
        case "resources/list":
          return reply(id, { resources: listResources() });
        case "resources/templates/list":
          return reply(id, { resourceTemplates: [] });
        case "resources/read": {
          // A resource answers with its text, or with its text, type and metadata (the MCP App).
          const content = read(params?.uri);
          return reply(id, { contents: [typeof content === "string" ? { uri: params?.uri, mimeType: "text/markdown", text: content } : { uri: params?.uri, ...content }] });
        }
        case "prompts/list":
          return reply(id, { prompts: PROMPTS });
        case "prompts/get":
          return reply(id, prompt(params?.name, params?.arguments));
        default:
          if (method?.startsWith("notifications/")) return null;
          return isRequest ? fail(id, -32601, `Method not found: ${method}`) : null;
      }
    } catch (error) {
      return isRequest ? fail(id, error.code ?? -32603, error.message) : null;
    }
  };
}

/**
 * The server ui.mlola.com/mcp runs: the read-only tools, and install
 * commands instead of installs, since a remote server cannot write to the
 * project. Mlola Pro items are described; their source needs a license and
 * arrives through `npx mlola-ui add`.
 */
export function remoteMcpHandler({ version }) {
  const cwd = process.cwd();
  const install = {
    name: "get_install_command",
    title: "How to install Mlola components",
    description: "How to set Mlola up: the commands to run in a project to add components, blocks, pages or templates (with the license step for Mlola Pro items), and the stylesheet link and script for a page with no build step. Leave names out for the setup alone.",
    inputSchema: { type: "object", properties: { names: { type: "array", items: { type: "string" }, description: "Item names from search_components, for example [\"button\", \"date-picker\"]." } }, additionalProperties: false },
    annotations: { readOnlyHint: true },
    handler: ({ names = [] }) => {
      if (!names.length) return text(["In a project:", "", "npx mlola-ui init   # once: config, stylesheet, the engine, and agent instructions", "npx mlola-ui add <names>", "", noBuildSetup(version)].join("\n"));
      const found = names.map((name) => searchItems({ query: name }).find((item) => item.name === name));
      const unknown = names.filter((_, index) => !found[index]);
      if (unknown.length) return { ...text(unknown.map((name) => `No Mlola item is called ${name}.${suggest(name)}`).join("\n") + " Find names with search_components."), isError: true };
      const pro = found.filter((item) => item.tier === "pro").map((item) => item.name);
      return text([
        "Run in the project:",
        "",
        "npx mlola-ui init   # once: config, stylesheet, the engine, and agent instructions",
        ...(pro.length ? [`npx mlola-ui login <token>   # ${pro.join(", ")} ${pro.length === 1 ? "is" : "are"} Mlola Pro: create a token at https://ui.mlola.com/account`] : []),
        `npx mlola-ui add ${names.join(" ")}`,
        "",
        'Then import styles/mlola/index.css once and set data-theme="graphite" (or atelier, machined, aerogel, nordic) on the root element.',
        "",
        noBuildSetup(version),
      ].join("\n"));
    },
  };
  return createMcpHandler({
    tools: [...readTools({ cwd, version }), install],
    listResources: () => Object.values(SHARED_RESOURCES).map((resource) => resource.listed),
    readResource: (uri) => {
      if (Object.hasOwn(SHARED_RESOURCES, uri)) return SHARED_RESOURCES[uri].read();
      throw Object.assign(new Error(`Unknown resource ${uri}`), { code: -32002 });
    },
    version,
    instructions: REMOTE_INSTRUCTIONS,
  });
}

export async function serveMcp({ cwd, run, version, input = process.stdin, output = process.stdout }) {
  const handle = createMcpHandler({
    tools: tools({ cwd, run, version }),
    listResources: () => resources(cwd),
    readResource: (uri) => readResource(uri, cwd),
    version,
    instructions: INSTRUCTIONS,
  });
  const send = (message) => output.write(`${JSON.stringify(message)}\n`);

  const lines = readline.createInterface({ input, crlfDelay: Infinity });
  const pending = new Set();
  for await (const line of lines) {
    if (!line.trim()) continue;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } });
      continue;
    }
    for (const entry of Array.isArray(message) ? message : [message]) {
      const task = handle(entry)
        .then((response) => {
          if (response) send(response);
        })
        .finally(() => pending.delete(task));
      pending.add(task);
    }
  }
  await Promise.all(pending);
}
