# Calendar Component Contract

## Purpose

A month grid for one date, a range or several, with min and max, blocked days, two-month view and full keyboard paging

## Source

`packages/components/calendar/calendar.tsx`

## Anatomy and composition

This source owns its semantic DOM, state machine, keyboard behavior, focus lifecycle, and stable `data-state` hooks. The React source implements those decisions directly, and they still satisfy `behavior-spec.mjs` wherever a behavior applies. Expression comes from semantic `ml-*` recipes.

## Public API

The exported TypeScript source is authoritative. Named interface contracts:

- `BaseProps`
- `DateRange`
- `MultipleProps`
- `RangeProps`
- `SingleProps`

Additional public types:

- `CalendarProps`
- `Selection`

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
