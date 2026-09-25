# @mlola-ui/scene

Optional, lightweight spatial presentation for Mlola UI: perspective stages,
depth layers, card stacks, and mesh gradients. WebGL is not required, and a
scene effect always has a static fallback for reduced motion, reduced data, and
assistive technology.

## Install

```bash
npm install @mlola-ui/scene
```

## Use

```tsx
import { CardStack3D, MeshGradient, Stage } from "@mlola-ui/scene";

<Stage depth={2}><CardStack3D cards={cards} /></Stage>;
```

## Exports

| Path | What it is |
| --- | --- |
| `@mlola-ui/scene` | `Stage`, `CardStack3D`, `MeshGradient`, `SpatialToggle` |
| `@mlola-ui/scene/scene.css` | the scene layer |

Requires React and ReactDOM 18 or newer as peers. Scene effects are
non-semantic and never the only way to reach content.

MIT licensed. Part of [Mlola UI](https://ui.mlola.com).
