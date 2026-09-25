# Authoring a Theme

A theme is authored as a compact profile, not as a copied token file.

## Profile

Each expression channel is normalized to the interval `[0, 1]`, where `0` is the
calm end of the axis and `1` is the expressive end. The vector is descriptive:
neither end is inherently better.

```text
type, geometry, density, depth, motion, texture, rhythm, icon
```

The compiler applies a sparse coupling matrix and clamps every derived value to
the engine's accessibility, performance, and component constraints.

## Authoring sequence

1. Write the intended sensory and cultural direction in plain language.
2. Choose a vector that describes the direction without referring to individual
   CSS properties.
3. Generate foundations and inspect the complete reference corpus.
4. Adjust coupling only when the inconsistency is systemic.
5. Adjust a component recipe only when its anatomy requires a unique mapping.
6. Run contrast, accessibility, theme-distance, grayscale, reduced-motion, and
   performance checks.

Do not patch generated CSS or introduce a component-only theme override to make
one screenshot look correct.

## Required evidence

A new theme must:

- differ observably on at least six expression channels
- remain identifiable without color
- retain identity with motion disabled
- preserve every anatomy and keyboard test
- meet contrast and target constraints in light and dark themes
- degrade cleanly without optional fonts, textures, or scene effects

## Typography

Mlola does not bundle fonts. A profile declares font roles and optional variable
axes; separate font packs may provide assets. Every role needs a metrically
reasonable fallback and must be tested for line-wrap and layout shift.

## Naming

Display names may use culinary or material language because theme is richer than
a palette. IDs remain stable, lowercase, and semantic-free. Names should suggest
an experience without pretending to be an objective sensory measurement.
