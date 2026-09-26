# mlola-ui

The Mlola UI source-copy CLI. It writes components, blocks, pages, and templates
into your project, rewrites their imports to fit it, and installs the Mlola
packages they import with your package manager. Framework-free: the copied
markup works in any language that can emit HTML, and React sources use only
React.

The library's contract is generated from its own stylesheet, so a model reading
it cannot invent a class or attribute that does not exist.

## Install

```bash
npx mlola-ui init
npx mlola-ui add button sheet hero-split landing
npx mlola-ui doctor
```

`init` writes `mlola.config.json`, the engine stylesheet, and the instructions
your coding agents read (see below), and installs `@mlola-ui/engine`. It fits
the project it finds: files go where the `@/` alias in `tsconfig.json` points,
or into `src/` when there is one. Without an alias, as in a new Vite app, it
sets `"imports": "relative"` and the copied files import each other by
relative path, so nothing needs setting up first.

`add` resolves the dependency graph (a page pulls its blocks, a block pulls its
components), copies only what you asked for, and installs the packages the
copied code imports that `package.json` does not declare yet. Pass
`--no-install` to only print the command. `doctor` checks the project against
the registry: packages the installed items import, the engine import, the
theme attribute, and files changed since they were added.

Tailwind can stay in the project. The engine places Mlola's layers above
Tailwind's preflight in either import order.

## Commands

| Command | What it does |
| --- | --- |
| `init [--no-agents] [--no-install]` | create `mlola.config.json`, the stylesheet entry and the agent instructions, and install the engine |
| `agents` | write or refresh the agent instructions in an existing project |
| `mcp` | run the Mlola MCP server over stdio, for coding agents |
| `add <items…> [--no-install]` | copy items and their dependencies into the project, and install the packages they import |
| `list [--json]` | print every installable item |
| `doctor` | report project and registry problems |
| `login <token>` | save a Mlola Pro token (from /account) for this user |
| `logout` | forget the saved token |

## Coding agents

`init` (or `agents`, in an existing project) tells the project's coding agents
that its UI is Mlola:

- `mlola.agents.md`: the design guide, with every class, `data-*` value and
  token, and the rules for new UI;
- `AGENTS.md`: a short section between markers pointing at the guide (merged,
  never overwritten), and `CLAUDE.md` importing it for Claude Code;
- `.mcp.json` (and `.cursor/` or `.vscode/` when the project uses them): the
  Mlola MCP server.

`npx mlola-ui mcp` is that server. It answers from the registry bundled with
this CLI, offline: `get_design_rules`, `search_components`, `get_component`,
`get_tokens`, `check_markup` (invented classes, wrong `data-*` values, utility
classes, hand-written colors), `add_components` and `init_project`. For
Claude Code without init:

```sh
claude mcp add mlola --scope project -- npx -y mlola-ui mcp
```

See https://ui.mlola.com/docs/agents for Cursor, VS Code and Codex.

## Mlola Pro

Pro components, blocks, pages and templates are not in this package. With a
license, create a token at https://ui.mlola.com/account, then:

```sh
npx mlola-ui login mlp_…
npx mlola-ui add conversation bot
```

`add` fetches Pro items and their Pro dependencies from the service, checks
every file against its integrity hash, and writes them like any other item.
Free dependencies still come from this package. Pro stylesheets land in
`styles/mlola-pro/`, gathered by `styles/mlola-pro.css`: import it once, after
the engine stylesheet. `mlola-pro.agents.md` at the project root lists every
Pro class and attribute for coding agents; point your `AGENTS.md` at it. In CI, set `MLOLA_PRO_TOKEN` instead of logging in. The
token is stored in `~/.config/mlola-ui/credentials.json`, readable by you only.

## Configuration

Aliases and targets live in `mlola.config.json`:

```json
{
  "aliases": {
    "components": "@/components/ui",
    "blocks": "@/components/blocks",
    "pages": "@/app/pages",
    "templates": "@/app/templates"
  }
}
```

The CLI works from an npm tarball with no repository checkout; the packed
installation is tested in CI.

MIT licensed. Part of [Mlola UI](https://ui.mlola.com).
