# Mlola Glyph DNA

Mlola icons share one recognizable geometry system while allowing controlled
optical tuning by theme.

## Invariants

- view box: 24 by 24
- semantic metaphor and path topology remain stable
- `currentColor` is the only default color
- default optical stroke: 1.75
- round joins and caps at the neutral baseline
- decorative icons are hidden from assistive technology
- informative icon-only controls require an accessible name

## Optical expression

Theme may tune:

- stroke weight
- terminal character
- corner softness
- optical scale
- fill balance
- draw or emphasis cadence

It may not change the icon's meaning. A search icon remains search in every
theme; a warning icon may not become an unrelated metaphor.

## Construction

Paths align to a 24-unit grid with optical correction when strict mathematical
centering appears visually wrong. Small-size rendering is reviewed at 16, 18,
20, and 24 CSS pixels.

Stroke icons use non-scaling stroke where transforms could otherwise alter
weight. Filled details use `currentColor` and preserve adequate negative space.

## Public API

Icons use `IconPascalName`, forward SVG attributes, and accept `size`,
`title`, and an optional decorative flag. Named exports keep them tree-shakeable.

Component source imports icons from `@mlola-ui/icons`; duplicated inline SVGs
and third-party icon packages are not allowed.

## Motion

Glyph motion is optional, semantic, and CSS-driven. Active-state drawing or
micro-emphasis uses engine motion roles and is removed under reduced motion.
Icons never animate continuously while idle.
