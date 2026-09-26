# Mlola UI

A framework-free design system with a machine-readable contract.

The engine emits plain CSS and DTCG JSON with no runtime dependency, interaction
behavior ships as a standard DOM module, and React is one supported consumption
path — source-copied components — rather than a requirement. Mlola does not ship
a utility framework or outsource its identity to a styling, animation, primitive,
or icon runtime.

**The contract is generated from the stylesheet and audited, so a model cannot
invent a class or attribute that does not exist.**
[`contract.json`](packages/engine/generated/contract.json) lists every class and
the `data-*` / `aria-*` attributes the CSS reacts to, and
[`agents.md`](packages/engine/generated/agents.md) is generated from the same
source. Both are checked in CI, so the guide can never describe a library that
is not there.

## Mlola Theme

A theme is a coherent transformation across eight expression channels:

```text
type · geometry · density · depth · motion · texture · rhythm · icon
```

Component anatomy, semantics, keyboard behavior, accessible names, and state
contracts remain invariant. Accessibility and user preferences always take
precedence over expression.

Canonical themes:

- **Graphite** (`graphite`, default) — neutral, crisp, quiet, and product-first
- **Atelier Umami** (`atelier`) — editorial, warm, tactile, and measured
- **Machined Titanium** (`machined`) — compact, angular, exact, and damped
- **Aerogel Glass** (`aerogel`) — light, luminous, elastic, and translucent
- **Nordic Earth** (`nordic`) — organic, airy, earthy, and gently rounded

Activate a theme with native attributes:

```html
<html data-theme="graphite" data-mode="light">
```

## Theme methodology

- **Theme** states the intended character as one normalized vector.
- **Anatomy** fixes semantics and interaction contracts.
- **Synthesis** derives tokens, recipes, spring motion curves, and icon
  parameters from the vector and a deliberately sparse set of couplings.
- **Tuning** maps those derived foundations into intent-oriented component
  recipes.
- **Evaluation** enforces accessibility, perceptual distance, browser behavior,
  and performance.

Accessibility is a projection applied at every stage, not a channel the vector
can trade away. See [the architecture](docs/architecture.md),
[the theme methodology](docs/methodology/theme.md), and
[the quality contract](docs/quality.md).

## Layers

Source is four ordered layers, each built from the one below:

- **Components** — a single primitive with one job (`Button`, `Card`, `Tabs`).
- **Blocks** — one section of a page (`Hero`, `Navbar`, `Pricing tiers`).
- **Pages** — one complete route assembled from blocks (`Landing`, `Pricing`,
  `Dashboard`).
- **Templates** — a multi-page flow with routes and cross-page state (the
  storefront: catalog → product → cart → checkout → confirmation).

The open-source core is MIT: the engine, tokens, behavior, motion, scene,
icons, the free components and the CLI. **Mlola Pro** adds the AI, code,
canvas, editor, workflow and chart components, plus blocks, pages and
templates. Pro is a one-time commercial license and is not in this
distribution; see [ui.mlola.com/pricing](https://ui.mlola.com/pricing).

Every item is source-owned through the CLI. See
[component anatomy](docs/component-anatomy.md).

## Packages

- `@mlola-ui/engine` — generated static CSS, spring easings, and theme metadata
- `@mlola-ui/behavior` — framework-free interaction runtime and shared decision logic
- `@mlola-ui/motion` — native kinetic primitives and the spring integrator
- `@mlola-ui/scene` — optional lightweight spatial presentation
- `@mlola-ui/icons` — Mlola Glyph DNA icon catalog
- `@mlola-ui/registry` — validated source metadata and snapshot
- `mlola-ui` — source-copy CLI

Components, blocks, and templates are source-owned through the CLI. React
components vendor their own small runtime helpers and share pure decisions with
the framework-free runtime through `@mlola-ui/behavior/logic`, so the two paths
cannot drift.

## Quick start

```bash
npx mlola-ui init
npx mlola-ui add button card input tabs sheet
npx mlola-ui doctor
```

The CLI installs the open-source components. With a Mlola Pro license, create a
token at [ui.mlola.com/account](https://ui.mlola.com/account), then:

```bash
npx mlola-ui login mlp_…
npx mlola-ui add conversation kanban
```

## Development

```bash
npm install
npm test
```

The public repository, [mlolahq/mlola-ui](https://github.com/mlolahq/mlola-ui),
is exported from the main repository, where code generation and the full audit
suite run; its generated stylesheets, tokens and registry are their output.
See `MIRROR.md` there.

The repository rejects shipped Tailwind, clsx, tailwind-merge, CVA, Lucide,
Radix, transitions.dev, and external motion runtimes. Development-only
verification tools are not shipped to consumers.

See [CONTRIBUTING.md](CONTRIBUTING.md), the [changelog](CHANGELOG.md), and the
[0.3 to 1.0 migration guide](docs/migration/v0.3-to-v1.md).
