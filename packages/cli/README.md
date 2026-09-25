# mlola-ui

The Mlola UI source-copy CLI. It writes components, blocks, pages, and templates
into your project, rewrites their imports to your aliases, and installs nothing
else. Framework-free: the copied markup works in any language that can emit
HTML, and React sources use only React.

The library's contract is generated from its own stylesheet, so a model reading
it cannot invent a class or attribute that does not exist.

## Install

```bash
npx mlola-ui init
npx mlola-ui add button sheet hero-split landing
npx mlola-ui doctor
```

`init` writes `mlola.config.json` and the engine stylesheet. `add` resolves the
dependency graph (a page pulls its blocks, a block pulls its components) and
copies only what you asked for. `doctor` checks the project against the registry:
missing engine imports, legacy attributes, modified generated files, and
forbidden dependencies.

## Commands

| Command | What it does |
| --- | --- |
| `init` | create `mlola.config.json` and the stylesheet entry |
| `add <items…>` | copy items and their dependencies into the project |
| `list [--json]` | print every installable item |
| `doctor` | report project and registry problems |
| `login <token>` | save a Mlola Pro token (from /account) for this user |
| `logout` | forget the saved token |

## Mlola Pro

Pro components, blocks, pages and templates are not in this package. With a
licence, create a token at https://ui.mlola.com/account, then:

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
