import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { checkMarkup, describeItem, designData, designGuide, searchItems, themes, tokens } from "./knowledge.js";

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

const INSTRUCTIONS = `This project's UI is Mlola UI: native CSS classes (ml-*), data-* attributes for state and variant, and --ml-* tokens. There is no Tailwind.
Before writing UI: call get_design_rules once, then search_components for what you need and get_component for how to use it. Read tokens with get_tokens instead of writing colors, sizes, shadows or durations. After writing markup, run check_markup on it and fix what it reports.`;

const text = (value) => ({ content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }] });

function tools({ cwd, run }) {
  const capture = async (argv) => {
    const lines = [];
    const output = { log: (...parts) => lines.push(parts.join(" ")), error: (...parts) => lines.push(parts.join(" ")) };
    const code = await run(argv, { cwd, output });
    return { code, output: lines.join("\n") };
  };
  return [
    {
      name: "get_design_rules",
      title: "Mlola design rules",
      description: "The rules for building UI with Mlola: compose first, color by role, measure with the scales, shared state words, touch and focus. Read once before writing UI.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      handler: () => {
        const data = designData();
        return text(`${data?.rules ?? ""}\nThemes: ${themes().map((theme) => theme.id).join(", ")} (data-theme on any ancestor, data-mode light|dark).\nComposition primitives: ${(data?.primitives ?? []).map((entry) => entry.name).join(" ")}`);
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
      description: "Everything needed to use one item: import, variants, sizes, the classes it styles and the data-* values each reacts to, dependencies and the install command. Set include_source to read a free component's source.",
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
      description: "Checks HTML or JSX: classes that do not exist, variant classes, data-* values a class does not react to, utility classes, hand-written colors, and misuse of data-theme or data-mode. Run it on markup you wrote before finishing.",
      inputSchema: { type: "object", properties: { markup: { type: "string" } }, required: ["markup"], additionalProperties: false },
      annotations: { readOnlyHint: true },
      handler: ({ markup }) => {
        const issues = checkMarkup(markup);
        return text(issues.length ? issues : "No issues: every Mlola class exists and every data-* value is one its element reacts to.");
      },
    },
    {
      name: "add_components",
      title: "Install Mlola components",
      description: "Copies components into the project with the Mlola CLI (npx mlola-ui add), with their dependencies and styles. Pro items need a login first.",
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
      description: "Runs npx mlola-ui init: writes mlola.config.json, the stylesheet entry and the agent instructions (AGENTS.md, the design guide, MCP config).",
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
  const list = [{ uri: "mlola://guide", name: "Mlola UI design guide", description: "Classes, attributes, tokens and rules, generated from the stylesheet.", mimeType: "text/markdown" }];
  if (fs.existsSync(path.join(cwd, "mlola-pro.agents.md"))) {
    list.push({ uri: "mlola://guide/pro", name: "Mlola Pro design guide", description: "The classes and attributes of the Pro items installed here.", mimeType: "text/markdown" });
  }
  return list;
}

function readResource(uri, cwd) {
  if (uri === "mlola://guide") return designGuide() ?? "";
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

export async function serveMcp({ cwd, run, version, input = process.stdin, output = process.stdout }) {
  const available = tools({ cwd, run });
  const send = (message) => output.write(`${JSON.stringify(message)}\n`);
  const reply = (id, result) => send({ jsonrpc: "2.0", id, result });
  const fail = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } });

  async function handle(message) {
    const { id, method, params } = message ?? {};
    const isRequest = id !== undefined && id !== null;
    try {
      switch (method) {
        case "initialize": {
          const requested = params?.protocolVersion;
          reply(id, {
            protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
            capabilities: { tools: { listChanged: false }, resources: { listChanged: false }, prompts: { listChanged: false } },
            serverInfo: { name: "mlola-ui", title: "Mlola UI", version },
            instructions: INSTRUCTIONS,
          });
          return;
        }
        case "ping":
          return reply(id, {});
        case "tools/list":
          return reply(id, { tools: available.map(({ handler, ...tool }) => tool) });
        case "tools/call": {
          const tool = available.find((entry) => entry.name === params?.name);
          if (!tool) return fail(id, -32602, `Unknown tool ${params?.name}`);
          try {
            return reply(id, await tool.handler(params?.arguments ?? {}));
          } catch (error) {
            // A tool that fails answers with the reason, so the agent can correct course.
            return reply(id, { ...text(error.message), isError: true });
          }
        }
        case "resources/list":
          return reply(id, { resources: resources(cwd) });
        case "resources/templates/list":
          return reply(id, { resourceTemplates: [] });
        case "resources/read":
          return reply(id, { contents: [{ uri: params?.uri, mimeType: "text/markdown", text: readResource(params?.uri, cwd) }] });
        case "prompts/list":
          return reply(id, { prompts: PROMPTS });
        case "prompts/get":
          return reply(id, prompt(params?.name, params?.arguments));
        default:
          if (method?.startsWith("notifications/")) return;
          if (isRequest) fail(id, -32601, `Method not found: ${method}`);
      }
    } catch (error) {
      if (isRequest) fail(id, error.code ?? -32603, error.message);
    }
  }

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
      const task = handle(entry).finally(() => pending.delete(task));
      pending.add(task);
    }
  }
  await Promise.all(pending);
}
