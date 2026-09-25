# @mlola-ui/registry

Validated Registry v2 metadata and the deterministic source snapshot that the
Mlola CLI installs. This is the source of truth for component files, targets,
dependencies, checksums, and preview loaders.

This package ships the **open-source components only**. Blocks, pages, and
templates are the commercial catalog and are not part of this tarball. Every
manifest is generated and checked: dependency closure, checksums, and snapshot
integrity are verified in CI, so the registry cannot describe an item the
library does not ship.

## Install

```bash
npm install @mlola-ui/registry
```

## Use

```js
import index from "@mlola-ui/registry/index.json" with { type: "json" };
import button from "@mlola-ui/registry/items/components/button" with { type: "json" };

console.log(index.components, button.files);
```

## Exports

| Path | What it is |
| --- | --- |
| `@mlola-ui/registry` | the snapshot index |
| `@mlola-ui/registry/index.json` | the v2 index: themes, components, items |
| `@mlola-ui/registry/items/components/*` | one manifest per component |
| `@mlola-ui/registry/schema/*` | JSON schemas for the index, items, and project config |
| `@mlola-ui/registry/generated/catalog` | a flat TypeScript catalog for tools |

MIT licensed. Part of [Mlola UI](https://ui.mlola.com).
