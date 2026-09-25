# Engine contract (1.0)

The engine turns a theme spec into CSS. Everything a page renders — palettes in
both modes, radius, density, depth, motion, material and type — is derived from
a handful of decisions, and contrast is solved rather than hoped for.

## Consumption

```css
@import "@mlola-ui/engine";
```

That loads ordered cascade layers: `mlola.tokens`, `mlola.foundations`,
`mlola.materials`, `mlola.recipes`, `mlola.motion`. Each layer is also exported on
its own (`@mlola-ui/engine/tokens.css`, `…/recipes.css`, and so on). The engine
is React-independent and has no runtime dependency.

## Selection

```html
<html data-theme="graphite" data-mode="dark">
<section data-theme="atelier" data-mode="light">…</section>
```

`graphite` is the default and also owns `:root`. Canonical themes are
`graphite`, `atelier`, `machined`, `aerogel` and `nordic`. A project theme from
`mlola.theme.json`, or one generated in the Studio, selects the same way with
its own id. Light is the default mode.

## One styling contract

- **A class names what an element is.** `ml-button`, `ml-card`, `ml-input`.
  There is exactly one class per element role and no variant classes.
- **`data-*` and `aria-*` say what state or variant it is in.**
  `data-tone="danger"`, `data-variant="primary"`, `data-size="sm"`,
  `data-state="open"`, `aria-selected="true"`. The words are shared by every
  component; see the prop vocabulary in `docs/component-anatomy.md`.
- **Tokens are one namespace, `--ml-*`.** There are no shadcn aliases, no
  `--ml-bg` shorthand and no second spelling of anything.

The generated `contract.json` lists every class and the attributes and values
its styles react to, derived from the stylesheet itself.

## The theme spec

See `packages/engine/src/spec.mjs` and the published
`theme-spec.schema.json`. A spec is:

| Field | Decision |
|---|---|
| `vector` | Eight channels from 0 to 1: type, geometry, density, depth, motion, texture, rhythm, icon. |
| `color.primary` | The brand seed, `oklch()` or hex. Hue and chroma are kept. |
| `color.primaryDark` | Optional different seed for dark mode. |
| `color.neutral` | Hue and chroma of the page and surfaces. |
| `color.ink` | Optional tint of text and dark surfaces. Defaults to neutral. |
| `material` | `solid`, `glass`, `paper` or `anodized`, applied to every surface. |
| `fonts` | A named set (`neutral`, `editorial`, `technical`, `humanist`, `geometric`) or explicit stacks. |

`normalizeSpec` never throws and fills gaps from a base theme. `validateSpec`
is the strict gate for machine-authored themes.

## Derived palettes and the contrast guarantee

`derivePalette(spec, mode)` builds every colour token. Each pairing is solved
to a WCAG target, so the guarantee holds for any seed — tested on thousands of
random specs in `tests/palette.test.mjs`:

| Pairing | Minimum |
|---|---|
| `text` on background, surface, elevated surface | 7:1 |
| `text-muted` on background, surface, subtle background | 4.5:1 (solved to ~6:1) |
| `text-faint` on background, surface, subtle background | 4.5:1 |
| `primary-text` and every `*-text` on background, surface, subtle background | 4.5:1 |
| every `*-foreground` on its fill | 4.5:1 |
| `chart-1` … `chart-6` on surface | 3:1 (WCAG 1.4.11, graphics) |

Every text role is readable text: there is no decorative text colour. The
three levels (`text`, `text-muted`, `text-faint`) are a hierarchy of
emphasis, and even the quietest clears WCAG AA wherever the library puts it.
Text on a tint (a soft badge, a soft alert) leans toward `text` just enough
to keep that guarantee on the tint.

Roles keep a token from doing two jobs:

- `primary`, `success`, `warning`, `danger`, `info` are **fills**; their
  `-foreground` sits on them. A vivid yellow stays a yellow button.
- `primary-text`, `success-text`, … are the same colours solved for **text on
  the page**: links, errors, badge labels, focus rings.

## Token groups

- Palette: `--ml-background`, `--ml-background-subtle`, `--ml-surface`,
  `--ml-surface-elevated`, `--ml-text`, `--ml-text-muted`, `--ml-text-faint`,
  `--ml-border`, `--ml-border-subtle`, `--ml-primary(-foreground|-text|-subtle)`
  and `--ml-{success,warning,danger,info}(-foreground|-text)`.
- Charts: `--ml-chart-1` … `--ml-chart-6`, a categorical palette solved per
  theme and mode. The first follows the brand's hue (blue for a monochrome
  brand); the others are the hues furthest from those already taken. They are
  separate from the status roles so a series never reads as good or bad by
  accident. Override any of them on an ancestor, or give a series its own
  `color`.
- Derived in CSS from the palette: `--ml-focus`, `--ml-primary-hover`,
  `--ml-fill-hover`, `--ml-fill-active`, `--ml-track`, `--ml-control-border`,
  `--ml-ring`.
- Geometry and density: `--ml-radius-*`, `--ml-border-width`,
  `--ml-control-{sm,md,lg}`, `--ml-panel-padding`, `--ml-target-min`.
- Material: `--ml-surface-alpha`, `--ml-surface-blur`, `--ml-surface-grain`,
  `--ml-surface-highlight`.
- Depth: `--ml-shadow-{xs,sm,md,lg,xl}`, denser in dark mode.
- Motion: `--ml-duration-{fast,normal,slow,reveal}`, `--ml-ease-standard`,
  `--ml-ease-spring`, `--ml-ease-bounce`. All four durations derive from the
  theme's motion channel; `reveal` is for entrances that draw something in (a
  chart, a filling bar). Components never write a raw duration for UI motion;
  ambient loops (a spinner's period) are the only exception.
- Type: `--ml-font-{sans,display,mono}`, `--ml-display-weight`,
  `--ml-body-leading`, `--ml-tracking`.
- Scale (theme-invariant): `--ml-space-*`, `--ml-type-*`, `--ml-leading-*`.
- Layers (theme-invariant): `--ml-layer-{raised,sticky,header,dropdown,
  overlay,modal,popover,toast,tooltip,top}`, the one stacking order. A
  component never writes a raw `z-index` above 9.
- Source coordinates: `--ml-theme-*`.

Recipes read only tokens, never a theme's name, which is why a theme nobody has
seen yet still looks finished.

## Where styles live

- `packages/engine/css/` — foundations, materials, motion and `base.css`, the
  composition primitives (section, grid, heading, form layout, stat, …).
- `packages/components/<name>/<name>.css` — each component's styles, next to
  its source. The engine concatenates them into `recipes.css`.
- `packages/{blocks,pages,templates}/<name>/<name>.css` — the commercial
  catalog. Assembled into `packages/registry/catalog/generated/catalog.css`,
  never published with the engine.

## Regeneration

```bash
node packages/engine/build.mjs
node packages/engine/build.mjs --check
```

Output is deterministic.

## Accessibility projection

The foundation layer guarantees a visible two-pixel focus outline, 44px
targets on coarse pointers, reduced-motion and reduced-transparency branches,
and forced-colors fallbacks. Contrast is guaranteed by derivation, above.
