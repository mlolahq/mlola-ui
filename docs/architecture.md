# Mlola Architecture

Mlola is a theme-driven UI system, framework-free at the core. The engine
emits plain CSS and JSON; interaction behavior is a standard DOM module; React
is one supported consumption path. Styling, interaction behavior, motion
physics, scene effects, iconography, registry resolution, and source
distribution are owned by Mlola.

## Composition layers

Source is organized in four ordered layers, each built from the one below:

- `packages/components/` — a single primitive with one job and one contract.
- `packages/blocks/` — one section of a page, composing components.
- `packages/pages/` — one complete route, composing blocks.
- `packages/templates/` — a multi-page flow with route data and cross-page
  state, composing pages and blocks.

A lower layer never imports a higher one, and interaction behavior is only ever
owned by a component. The registry dependency graph records the edges.

The open-source distribution is the first layer and the runtime packages. Blocks,
pages, and templates are the commercial catalog; `@mlola-ui/registry` and the CLI
ship components only, and the catalog is excluded from those tarballs. See
[LICENSE-COMMERCIAL.md](../LICENSE-COMMERCIAL.md).

## Package graph

```text
@mlola-ui/engine    generated static CSS, spring easings, theme metadata
@mlola-ui/behavior  framework-free interaction runtime and shared decision logic
@mlola-ui/motion    kinetic components and spring integration
@mlola-ui/scene     optional lightweight spatial presentation
@mlola-ui/icons     Mlola Glyph DNA icon catalog
@mlola-ui/registry  validated metadata and source snapshot
@mlola-ui/cli       init, add, list, and doctor
```

Components, blocks, and templates remain source-owned. The CLI copies them into
the consumer application while engine packages provide stable shared behavior
and expression.

## Two execution paths, one contract

React components and the framework-free runtime render the same markup contract,
so they must agree. They share the pure decisions — which index a key moves to,
where focus goes, what a value snaps to — in `@mlola-ui/behavior/logic`. React
implements the DOM and state in React; the runtime in `@mlola-ui/behavior`
implements it over `data-ml` markup with no framework. Both satisfy
`packages/engine/src/behavior-spec.mjs`, and the contract audit fails if the
spec and the runtime disagree.

## Dependency rule

Published runtime code may import:

- `react`
- `react-dom`
- another `@mlola-ui/*` package
- browser and ECMAScript platform APIs

It may not import Tailwind, clsx, tailwind-merge, CVA, Lucide, Radix, Motion,
transitions.dev, CSS-in-JS runtimes, or equivalent UI runtime dependencies. The
engine and the framework-free behavior runtime have no runtime peers at all.

Build and verification tools are not part of the consumer runtime. TypeScript,
Next.js, Playwright, and accessibility analyzers may be used to prove output
quality.

## Stable anatomy, variable expression

Component anatomy is invariant:

- semantic element and role
- slots and relationships
- accessible name and description
- state machine
- keyboard and pointer behavior
- focus lifecycle

Theme may tune:

- typography
- geometry
- density
- depth and material
- motion character
- texture
- spatial and temporal rhythm
- icon expression

Theme may never weaken semantics, accessibility, target size, contrast,
forced-colors behavior, reduced-motion behavior, or performance constraints.

## Cascade contract

The engine is ordered from least to most authoritative:

1. baseline primitives
2. semantic roles
3. component recipes
4. theme
5. local context
6. user accessibility preferences
7. forced colors

Public classes name intent, not individual declarations. Use `ml-button`,
`ml-dialog`, `ml-stack`, and `ml-cluster`; there is no shorthand property
language and no generated utility framework.

## Native platform policy

Mlola progressively enhances with native capabilities:

- CSS custom properties, cascade layers, OKLCH, `color-mix()`, and `@property`
- container queries and `:has()`
- `<dialog>`, Popover API, `inert`, and top-layer behavior
- CSS Anchor Positioning
- Web Animations API and generated `linear()` easing
- View Transitions when they preserve user preferences

Every enhancement needs a tested fallback where browser or assistive-technology
support is incomplete.

## Source ownership

The registry is the sole source for component metadata, file targets,
dependencies, checksums, and preview loaders. A packed CLI must work without a
repository checkout. Generated outputs are checked in only when they are needed
by consumers and CI verifies they are current.
