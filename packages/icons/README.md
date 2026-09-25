# @mlola-ui/icons

The Mlola Glyph DNA icon catalog: currentColor SVG components on a shared
24-unit grid, with stable metaphors and optical weight that follows the active
theme.

## Install

```bash
npm install @mlola-ui/icons
```

## Use

```tsx
import { IconSearch, IconTrash } from "@mlola-ui/icons";

<IconSearch />;
<IconSearch size={20} opticalSize="small" title="Search" />;
```

Named exports keep the set tree-shakeable. A decorative icon is hidden from
assistive technology; an icon-only control still needs its own accessible name.

## Exports

| Path | What it is |
| --- | --- |
| `@mlola-ui/icons` | every `IconPascalName` export |
| `@mlola-ui/icons/glyphs.css` | the `--mlola-glyph-*` custom properties |

Requires React and ReactDOM 18 or newer as peers. Third-party icon packages and
duplicated inline SVGs are not used anywhere in Mlola.

MIT licensed. Part of [Mlola UI](https://ui.mlola.com).
