# @mlola-ui/tokens

The stable, compatibility CSS entry for Mlola UI. Importing it loads the ordered
cascade layers for tokens, foundations, materials, recipes, and motion, so a
consumer only needs one line.

`@mlola-ui/engine` is the source of truth; this package is the durable entry
point that does not move when the engine's file layout changes.

## Install

```bash
npm install @mlola-ui/tokens
```

## Use

```css
@import "@mlola-ui/tokens/tokens.css";
```

```html
<html data-theme="atelier" data-mode="light">
```

## Exports

| Path | What it is |
| --- | --- |
| `@mlola-ui/tokens` | the default stylesheet |
| `@mlola-ui/tokens/tokens.json` | DTCG token document |
| `@mlola-ui/tokens/<layer>.css` | a single layer when you want narrower boundaries |

MIT licensed. Part of [Mlola UI](https://ui.mlola.com).
