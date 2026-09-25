# @mlola-ui/motion

Native kinetic primitives for Mlola UI. Pointer tilt, magnetic pull, digit
reels, soft text swaps, and a spring integrator — all reduced-motion aware, and
none of them a continuous animation loop while idle.

The engine already samples a damped oscillator into CSS `linear()` easings, so
static transitions carry the theme's motion without any JavaScript. This
package is for the interruptible, pointer-driven cases CSS cannot express.

## Install

```bash
npm install @mlola-ui/motion
```

## Use

```tsx
import { Magnetic, Tilt3D } from "@mlola-ui/motion";

<Magnetic pull={0.2}><button className="ml-button">Join</button></Magnetic>;
```

## Exports

| Path | What it is |
| --- | --- |
| `@mlola-ui/motion` | `Magnetic`, `Tilt3D`, `AnimatedCounter`, `TextSwap`, `ShimmerText` |
| `@mlola-ui/motion/physics` | `integrateSpring`, `createSpringAnimation`, presets |
| `@mlola-ui/motion/raf` | frame batching helpers |

Requires React and ReactDOM 18 or newer as peers. Every spatial effect collapses
under `prefers-reduced-motion: reduce`.

MIT licensed. Part of [Mlola UI](https://ui.mlola.com).
