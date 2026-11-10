import fs from "node:fs";
import path from "node:path";
import { designGuide } from "./knowledge.js";

/**
 * Tells the project's coding agents that the UI is Mlola, where the design
 * language is written down, and how to ask about it, so an assistant builds
 * with Mlola without being reminded:
 *
 * - `mlola.agents.md`   the design guide: classes, tokens, rules (refreshed)
 * - `AGENTS.md`         a short section, between markers, read by most agents
 * - `CLAUDE.md`         imports AGENTS.md for Claude Code
 * - `.mcp.json`         the Mlola MCP server, for Claude Code and others
 * - `.claude/settings.json`  a hook that checks each file Claude Code edits
 * - `.github/workflows/mlola-check.yml`  the check on pull requests, with `--ci`
 * - `.cursor/…`         a rule and the MCP server, when the project uses Cursor
 * - `.vscode/mcp.json`  the MCP server, when the project uses VS Code
 *
 * Every write merges: anything else in these files is left as it was.
 */

export const GUIDE_FILE = "mlola.agents.md";
const START = "<!-- mlola-ui:start -->";
const END = "<!-- mlola-ui:end -->";
const SERVER = { command: "npx", args: ["-y", "mlola-ui", "mcp"] };

const BRIEF = `## UI: Mlola UI

This project's interface is built with Mlola UI. Before writing or changing UI:

- Read \`${GUIDE_FILE}\` (and \`mlola-pro.agents.md\` when it exists): every
  class, attribute and token, and the rules for new UI.
- Set up the root once, as "Project setup" in \`${GUIDE_FILE}\` shows: the
  stylesheet imported in the root layout, \`data-theme\` and \`data-mode\` on
  \`<html>\`, and every theme's fonts loaded. \`npx mlola-ui doctor\` says what
  is missing.
- Compose from Mlola components first: \`npx mlola-ui list\`,
  \`npx mlola-ui add <name>\`. Lay the page out with the
  composition primitives (\`ml-section\`, \`ml-stack\`, \`ml-grid\`…), which
  the guide describes, and write new CSS only for what neither covers.
- Never write a color, spacing, radius, shadow or duration by hand: read the
  \`--ml-*\` tokens. There is no Tailwind or other styling framework here.
- State and variants go in \`data-*\` and \`aria-*\` with the shared words
  (\`data-tone\`, \`data-variant\`, \`data-size\`, \`data-status\`), never in extra
  classes. \`data-theme\` and \`data-mode\` belong to the engine.
- The \`mlola\` MCP server (\`npx mlola-ui mcp\`) searches components, explains
  tokens and checks markup against the contract. Check new markup with its
  \`check_markup\` tool before finishing; without the server, run
  \`npx mlola-ui check <files>\`. It finds classes and tokens that do not
  exist, values typed by hand, controls on elements that cannot be operated,
  and buttons, fields and images with no name.
- When the app runs, \`npx mlola-ui audit <url>\` opens the page on a desktop
  and a phone, light and dark, and reports what only shows once it is drawn:
  text that is cut off, controls that overlap, sideways scroll, low contrast.`;

/** The check after each edit, for Claude Code: what it finds goes back to the agent, which fixes it before going on. */
const HOOK_COMMAND = "npx -y mlola-ui check --hook";
const HOOK = { matcher: "Edit|Write|MultiEdit", hooks: [{ type: "command", command: HOOK_COMMAND }] };

const WORKFLOW_FILE = ".github/workflows/mlola-check.yml";
const WORKFLOW = `name: Mlola check

on:
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      # Classes and tokens that do not exist, values typed by hand, controls with no name.
      # Errors fail the job and show on the lines of the pull request; add --strict to fail on warnings too.
      - run: npx -y mlola-ui check
`;

/** Replaces the marked section, or appends it; returns what happened. */
function mergeSection(filename, body) {
  const block = `${START}\n${body}\n${END}`;
  if (!fs.existsSync(filename)) {
    fs.writeFileSync(filename, `${block}\n`);
    return "created";
  }
  const current = fs.readFileSync(filename, "utf8");
  const start = current.indexOf(START);
  const end = current.indexOf(END);
  const next = start >= 0 && end > start ? `${current.slice(0, start)}${block}${current.slice(end + END.length)}` : `${current.replace(/\s*$/, "")}\n\n${block}\n`;
  if (next === current) return "unchanged";
  fs.writeFileSync(filename, next);
  return "updated";
}

function mergeJson(filename, update) {
  let data = {};
  if (fs.existsSync(filename)) {
    try {
      data = JSON.parse(fs.readFileSync(filename, "utf8"));
    } catch {
      return "skipped (not valid JSON; add the server by hand)";
    }
  }
  const next = update(structuredClone(data));
  if (JSON.stringify(next) === JSON.stringify(data)) return "unchanged";
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const existed = fs.existsSync(filename);
  fs.writeFileSync(filename, `${JSON.stringify(next, null, 2)}\n`);
  return existed ? "updated" : "created";
}

export function writeAgentFiles(cwd, { hooks = true, ci = false } = {}) {
  const results = [];
  const record = (file, status) => results.push({ file, status });

  const guide = designGuide();
  if (guide) {
    const filename = path.join(cwd, GUIDE_FILE);
    const before = fs.existsSync(filename) ? fs.readFileSync(filename, "utf8") : null;
    if (before !== guide) fs.writeFileSync(filename, guide);
    record(GUIDE_FILE, before === null ? "created" : before === guide ? "unchanged" : "updated");
  }

  record("AGENTS.md", mergeSection(path.join(cwd, "AGENTS.md"), BRIEF));

  // Claude Code reads CLAUDE.md, which can import AGENTS.md rather than repeat it.
  const claude = path.join(cwd, "CLAUDE.md");
  const claudeText = fs.existsSync(claude) ? fs.readFileSync(claude, "utf8") : null;
  if (claudeText === null) {
    fs.writeFileSync(claude, "@AGENTS.md\n");
    record("CLAUDE.md", "created");
  } else if (!/^@AGENTS\.md\s*$/m.test(claudeText)) {
    record("CLAUDE.md", mergeSection(claude, "@AGENTS.md"));
  } else {
    record("CLAUDE.md", "unchanged");
  }

  record(".mcp.json", mergeJson(path.join(cwd, ".mcp.json"), (data) => ({ ...data, mcpServers: { ...(data.mcpServers ?? {}), mlola: SERVER } })));

  // An agent told to run the check forgets; one whose edit is checked for it does not.
  if (hooks) {
    record(
      ".claude/settings.json",
      mergeJson(path.join(cwd, ".claude", "settings.json"), (data) => {
        const after = Array.isArray(data.hooks?.PostToolUse) ? data.hooks.PostToolUse : [];
        if (after.some((entry) => (entry?.hooks ?? []).some((hook) => String(hook?.command ?? "").includes("mlola-ui check --hook")))) return data;
        return { ...data, hooks: { ...(data.hooks ?? {}), PostToolUse: [...after, HOOK] } };
      }),
    );
  }

  if (ci) {
    const workflow = path.join(cwd, WORKFLOW_FILE);
    if (fs.existsSync(workflow)) record(WORKFLOW_FILE, "unchanged");
    else {
      fs.mkdirSync(path.dirname(workflow), { recursive: true });
      fs.writeFileSync(workflow, WORKFLOW);
      record(WORKFLOW_FILE, "created");
    }
  }

  if (fs.existsSync(path.join(cwd, ".cursor"))) {
    record(".cursor/mcp.json", mergeJson(path.join(cwd, ".cursor", "mcp.json"), (data) => ({ ...data, mcpServers: { ...(data.mcpServers ?? {}), mlola: SERVER } })));
    const rule = path.join(cwd, ".cursor", "rules", "mlola.mdc");
    const text = `---\ndescription: Mlola UI, how interface code is built and styled in this project\nalwaysApply: true\n---\n\n${BRIEF.replace(/^## .*\n\n/, "")}\n`;
    const before = fs.existsSync(rule) ? fs.readFileSync(rule, "utf8") : null;
    if (before !== text) {
      fs.mkdirSync(path.dirname(rule), { recursive: true });
      fs.writeFileSync(rule, text);
    }
    record(".cursor/rules/mlola.mdc", before === null ? "created" : before === text ? "unchanged" : "updated");
  }

  if (fs.existsSync(path.join(cwd, ".vscode"))) {
    record(".vscode/mcp.json", mergeJson(path.join(cwd, ".vscode", "mcp.json"), (data) => ({ ...data, servers: { ...(data.servers ?? {}), mlola: { type: "stdio", ...SERVER } } })));
  }
  return results;
}
