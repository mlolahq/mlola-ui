# Mlola assets

Where 2D and 3D assets live, and the rules they follow.

Icons ship from `packages/icons`. This package holds the other two kinds:
theme-aware illustrations (2D) and glTF models (3D). All three appear in the
asset library at `/assets`, and all of it is MIT.

```bash
npx mlola-ui list --kind asset
npx mlola-ui add asset empty-inbox orb
```

## Why a separate package

Icons are code: they are React components, tiny, and every project wants all of
them. 2D and 3D assets are not. They are files, some of them large, and a
project wants three of them, not three hundred. Shipping them the same way
would put megabytes into every install for the sake of one illustration.

So assets are **referenced by the registry and copied on demand**, the same way
blocks are. `npx mlola-ui add asset <name>` copies the files you asked for and
nothing else.

## Layout

```
packages/assets/
  2d/
    <name>/
      asset.json        the manifest, described below
      <name>.svg        the source, painted with theme tokens
      <name>.tsx        a React component that inlines it (generated)
      <name>-dark.svg   optional, when the asset cannot theme itself
  3d/
    <name>/
      asset.json
      <name>.glb        the source
      <name>-poster.webp a still, shown before the model loads
```

One directory per asset. The directory name is the asset id, lowercase with
dashes, matching how components and blocks are named.

## The manifest

```json
{
  "id": "empty-inbox",
  "kind": "2d",
  "title": "Empty inbox",
  "summary": "Placeholder for an inbox with no messages.",
  "tags": ["empty-state", "mail"],
  "files": [{ "path": "empty-inbox.svg", "role": "source" }],
  "themeable": true,
  "license": "MIT",
  "author": "Mlola"
}
```

`themeable: true` means the asset paints itself with `currentColor` and the
theme's custom properties, so it follows `data-theme` and `data-mode` without
a second file. Prefer this. Ship a `-dark` variant only when an asset genuinely
cannot be expressed that way, such as a photograph.

A 2D asset sets each colour as `style="fill: var(--ml-primary, #5b5bd6)"`:
inline (the React component) it follows the theme; as an `<img>` it falls back
to the colour after the comma.

A 3D asset is themeable through its **material names**. Each material is a
role: `primary`, `accent`, `surface`, `ink`, `neutral` or `metal`, and lists
them in `materials`. A Mlola viewer paints each role from the theme
(`--ml-primary`, `--ml-chart-2`, `--ml-surface`, `--ml-text`, `--ml-border`;
metal keeps its own colour). Any other viewer shows the fallback colour stored
in the material.

## Rules

**Theme first.** A 2D asset should use `currentColor` and the token custom
properties, never a hardcoded hex. An asset that ignores the theme looks
pasted on, and it is the first thing that breaks when a brand supplies its own
`mlola.theme.json`.

**No runtime dependency.** A 2D asset is an `<svg>` or an `<img>`. A 3D asset
loads through whatever viewer the consuming project already has. This package
will not add a 3D engine as a dependency, because a library that pins a
renderer version ages at the speed of that renderer.

**Every 3D asset needs a poster.** A model that has not downloaded yet must
still render something, and a still image is what a slow connection, a reduced
data preference, and a search crawler all get.

**Budgets.** A 2D asset should be under 30 KB. A 3D asset should be under
1.5 MB, with the poster under 40 KB; compress a large model with Draco (the
procedural ones here are a few dozen kilobytes and need none). The builders
refuse anything over budget.

**Objects only.** Assets draw inanimate things: no people, animals, faces or
figures, no symbols of worship.

**Accessibility.** Decorative assets take `aria-hidden="true"`. Meaningful ones
take a real accessible name. An illustration that carries information the text
does not is an accessibility bug, so prefer making the text carry it.

## Adding an asset

The shipped assets are generated from code in `scripts/assets/`:

- `illustrations.mjs` draws the 2D set; `npm run assets:2d` writes each SVG,
  its React component and its `asset.json`.
- `models.mjs` builds the 3D set from exact primitives (rounded boxes,
  spheres, tori, lathes, bevelled extrusions); `npm run assets:3d` writes each
  `.glb` and its `asset.json`, and checks every face points outward.
- `npm run assets:posters`, with the site running, photographs each model
  through the site's own viewer for its poster, so a poster never drifts
  from its model.

Then:

1. Run `npm run codegen`. The asset manifest at
   `packages/engine/generated/assets.json` and the CLI's index at
   `packages/cli/registry/assets.json` pick it up, with each file's size and
   integrity, and it appears at `/assets` under its kind.
2. Check it in light and dark and in all five canonical themes before
   committing.

A hand-made asset works the same way: create its directory, its files and
its `asset.json`, and run codegen.

The gallery reads that generated manifest rather than a list kept in the page,
so no code changes to make an asset visible.
