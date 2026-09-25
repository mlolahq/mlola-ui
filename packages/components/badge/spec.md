# Badge Component Contract

## Purpose

A small status or label badge with color variants, dot indicator, and removal

## Source

`packages/components/badge/badge.tsx`

## Anatomy and composition

This source owns its semantic DOM, state machine, keyboard behavior, focus lifecycle, and stable `data-state` hooks. The React source implements those decisions directly, and they still satisfy `behavior-spec.mjs` wherever a behaviour applies. Expression comes from semantic `ml-*` recipes.

## Public API

The exported TypeScript source is authoritative. Named interface contracts:

- `BadgeProps`

Additional public types:

- `BadgeSize`
- `BadgeTone`
- `BadgeVariant`

## Theme contract

The component consumes semantic roles for typography, geometry, density, depth, motion, texture, rhythm, and icon expression. It must not contain theme-specific colors or duplicate profile values. Theme may alter expression but never semantics, target size, focus visibility, content hierarchy, or interaction behavior.

## Dependencies

- `@mlola-ui/icons`

Tailwind utilities, class-merging runtimes, third-party primitive libraries, third-party icons, and external motion runtimes are forbidden.

## Required verification

Every claim below is enforced by a gate in `npm run check`, the browser suite,
or the registry audit:

- Semantic elements, names, descriptions, and state relationships are valid.
- Keyboard, pointer, and touch paths are operable.
- Controlled and uncontrolled behavior is tested where the component owns state.
- Light and dark themes pass in all four canonical themes.
- Reduced motion and forced colors preserve meaning and operation.
- The layout survives a compact container and 200% zoom.
- Registry dependencies and copied source compile without external UI runtimes.
