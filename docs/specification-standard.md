# Source Specification Standard

Every component, block, and template keeps a `spec.md` beside its source.
Specifications describe contracts, not a one-time implementation prompt.

## Required sections

1. Purpose
2. Anatomy or composition
3. Public API
4. Semantic states
5. Keyboard and accessibility behavior
6. Theme channels used
7. Responsive and container behavior
8. Registry and engine dependencies
9. Verification checklist

## Language rules

Specifications must use semantic Mlola recipes and token roles. They must not
prescribe utility classes, HSL token fragments, class-merging libraries, Radix
Slot, external icons, or model-specific output folders.

Concrete CSS values belong in engine foundations or recipes. A specification
names intent such as action, surface, muted content, danger, compact density, or
spatial enter motion.

## Composition boundaries

Source is four ordered layers. A **component** owns behavior. A **block**
composes components. A **page** composes blocks into one route. A **template**
composes pages into a multi-page flow. A higher layer may arrange or configure a
lower layer but must not restate its focus, keyboard, validation, or dismissal
implementation, and a lower layer never imports a higher one.

## Verification

Specification verification lists are requirements, not a checklist that is ticked
by hand: the same claims are enforced by `npm run check`, the browser suite, or
the registry audit. A specification earns its keep by naming behavior a gate can
observe.

Required coverage:

- semantic element and accessible name
- keyboard, pointer, and touch interaction
- controlled and uncontrolled state where applicable
- light and dark themes
- all canonical themes
- compact container and zoom
- reduced motion and forced colors
- registry dependency closure

“Looks correct” or “uses the requested classes” is not a sufficient criterion.
