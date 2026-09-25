# Mlola assets

Where 2D and 3D assets live, and the rules they follow.

Icons already ship from `packages/icons` and appear in the asset library at
`/assets`. This package is the home for the two kinds that come next. Nothing
here is wired up yet; the shape below is the contract, so that adding the first
asset is a drop-in rather than a redesign.

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
      <name>.svg        the source
      <name>-dark.svg   optional, when the asset cannot theme itself
  3d/
    <name>/
      asset.json
      <name>.glb        the source, Draco-compressed
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
1.5 MB with Draco compression, with the poster under 40 KB. Anything larger
needs a reason written in its manifest.

**Accessibility.** Decorative assets take `aria-hidden="true"`. Meaningful ones
take a real accessible name. An illustration that carries information the text
does not is an accessibility bug, so prefer making the text carry it.

## Adding an asset

1. Create the directory and `asset.json`.
2. Run `npm run codegen`. The asset manifest at
   `packages/engine/generated/assets.json` picks it up, and it appears at
   `/assets` under its kind.
3. Check it in both themes and all four canonical themes before committing.

The gallery reads that generated manifest rather than a list kept in the page,
so no code changes to make an asset visible.
