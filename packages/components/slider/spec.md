# Slider Component Contract

## Purpose

An accessible single-value slider with keyboard support and pointer dragging

## Source

`packages/components/slider/slider.tsx`

## Anatomy and composition

This source owns its semantic DOM, state machine, keyboard behavior, focus lifecycle, and stable `data-state` hooks. Shared interaction decisions come from `@mlola-ui/behavior/logic`, so the React and framework-free renderers cannot drift. Expression comes from semantic `ml-*` recipes.

The whole control row takes the pointer (at least 24 px tall), not only the thin track. A mouse or pen sets the value where it presses and drags it; a finger sets it only when it moves sideways or taps, so a finger scrolling the page past a slider leaves it alone (`isSidewaysDrag`, shared with the framework-free runtime).

## Public API

The exported TypeScript source is authoritative. Named interface contracts:

- `SliderProps`

Additional public types:

- `SliderSize`

## Theme contract

The component consumes semantic roles for typography, geometry, density, depth, motion, texture, rhythm, and icon expression. It must not contain theme-specific colors or duplicate profile values. Theme may alter expression but never semantics, target size, focus visibility, content hierarchy, or interaction behavior.

## Dependencies

- `@mlola-ui/behavior`
- `@mlola-ui/behavior/logic`

Tailwind utilities, class-merging runtimes, third-party primitive libraries, third-party icons, and external motion runtimes are forbidden.

## Required verification

Every claim below is enforced by a gate in `npm run check`, the browser suite,
or the registry audit:

- Semantic elements, names, descriptions, and state relationships are valid.
- Keyboard, pointer, and touch paths are operable.
- Controlled and uncontrolled behavior is tested where the component owns state.
- Light and dark modes pass in all 5 canonical themes.
- Reduced motion and forced colors preserve meaning and operation.
- The layout survives a compact container and 200% zoom.
- Registry dependencies and copied source compile without external UI runtimes.
