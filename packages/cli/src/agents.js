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
- Compose from Mlola components first: \`npx mlola-ui list\`,
  \`npx mlola-ui add <name>\`. Write new CSS only for what they do not cover.
- Never write a color, spacing, radius, shadow or duration by hand: read the
  \`--ml-*\` tokens. There is no Tailwind or other styling framework here.
- State and variants go in \`data-*\` and \`aria-*\` with the shared words
  (\`data-tone\`, \`data-variant\`, \`data-size\`, \`data-status\`), never in extra
  classes. \`data-theme\` and \`data-mode\` belong to the engine.
- The \`mlola\` MCP server (\`npx mlola-ui mcp\`) searches components, explains
  tokens and checks markup against the contract. Check new markup with its
  \`check_markup\` tool before finishing.`;

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

export function writeAgentFiles(cwd) {
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
