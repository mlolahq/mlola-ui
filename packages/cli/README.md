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
| `check [path…] [--json] [--strict] [--all]` | check every file's markup and CSS against the contract, and count the colors and spacing typed by hand |
| `migrate [path…] [--write] [--json]` | move a shadcn/ui project's props, toasts and icons to Mlola, and list what needs a person |
| `render check <file \| -> [--json]` | check A2UI messages an agent composed against the Mlola Render catalog; exits 1 on an error |
| `render catalog [--schema]` | print the Mlola Render catalog as the guide an agent reads, or as the A2UI catalog |
| `login <token>` | save a Mlola Pro token (from /account) for this user |
| `logout` | forget the saved token |

## Checking a project

`check` runs the same check as the MCP server's `check_markup` over every
HTML, JSX, TSX, Vue, Svelte, Astro and CSS file in the project (or the paths
you name), and reports each issue with its line and fix:

```bash
npx mlola-ui check            # the whole project
npx mlola-ui check src --json # one folder, every issue as data
```

It ends with the drift: how many different colors and spacing values were
typed by hand instead of read from the tokens, and which ones most. It works
in any project, so it can measure one before it uses Mlola. In a Mlola
project it leaves out what the CLI installed (`--all` takes the copied markup
in; Mlola's own stylesheets, the built theme among them, are held by the
library's gates and never checked); where
Tailwind, UnoCSS or Windi is installed it leaves utility classes alone and
counts only the values typed into them (`bg-[#fafafa]`, `p-[13px]`).

It exits 1 when it finds an error (with `--strict`, a warning too), and on
GitHub Actions each issue is also an annotation on the pull request:

```yaml
# .github/workflows/ui.yml
name: UI
on: pull_request
jobs:
  mlola:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx -y mlola-ui@latest check src
```

## Moving from shadcn/ui

`migrate` makes the changes a machine can make without guessing, and lists
the rest with the line and what to do. Mlola installs a component at the
same file shadcn/ui did (`components/ui/button.tsx`), so imports stay as
they are. It reads by default; `--write` makes the changes.

```bash
npx mlola-ui migrate            # what would change, and what needs a person
npx mlola-ui migrate --write    # make the changes
npx mlola-ui add button badge toast --overwrite   # the command it prints
```

It rewrites props written out as literals (`variant="destructive"` becomes
`variant="danger"`, a Badge's variant becomes its `tone`), moves `sonner`
and the older `use-toast` to Mlola's toast (`toast.error` becomes
`toast.danger`), `switch` to `toggle`, and the lucide-react glyphs Mlola
has to `@mlola-ui/icons`, in the file's own import style. It leaves a value
computed at runtime, a `cva()` helper and a component whose API differs
(Dialog, Select, Dropdown Menu…) to you, naming the attributes or the
component that replace each one.

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
classes, and hand-written colors, spacing off the `--ml-space-*` scale or
faded text in `style` attributes, `<style>` blocks and utility classes, each
with its line), `get_render_catalog`, `check_render` and `render_ui` (Mlola
Render, below),
`add_components` and `init_project`. For Claude Code
without init:

```sh
claude mcp add mlola --scope project -- npx -y mlola-ui mcp
```

It is started by your agent and talks over stdio, so run by hand it prints one
line and waits. The same tools, minus the two that write, answer at
`https://ui.mlola.com/mcp` for agents that cannot run a command (with
`get_install_command`, which also gives the CDN link and script for a page with
no build step), and the server
is listed in the MCP Registry as `io.github.mlolahq/mlola-ui`. See
https://ui.mlola.com/docs/agents for Cursor, VS Code, Codex and chat apps.

## Mlola Render

When an agent should show interface instead of writing code for it (a form
in a chat, a status card in an agent's app), it composes
[A2UI](https://a2ui.org) v0.9 messages from the Mlola Render catalog: free
components and named values, never a color or a class. The check holds them
to the catalog and to what makes a surface usable (a name on every field, one
root, no loops, headings in order, values in range) and answers in A2UI's
`VALIDATION_FAILED` shape, so the agent fixes its own messages:

```sh
npx mlola-ui render catalog          # what an agent may compose
npx mlola-ui render check ui.json    # an array, one message, or JSON Lines
```

```js
import { validateRender } from "mlola-ui/render";
import rules from "mlola-ui/render/rules" with { type: "json" };

const { valid, errors } = validateRender(messages, rules);
```

The MCP tools are `get_render_catalog`, `check_render` and `render_ui`. In a
chat that shows MCP Apps, `render_ui` draws the surface in the conversation
(its view is the resource `ui://mlola/render`), and what the person presses
comes back to the agent as their next message, with A2UI's action. The A2UI
catalog is `mlola-ui/render/catalog` and
https://ui.mlola.com/a2ui/catalog/v1.

To draw surfaces yourself: `npx mlola-ui add render-surface` in React, or
`@mlola-ui/behavior/render` on a page without a framework. See
https://ui.mlola.com/docs/render.

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
