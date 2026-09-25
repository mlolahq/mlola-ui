# A theme is a vector, not a palette

A palette swaps color values while leaving the product's character intact. Mlola
treats a theme as a **coherent transformation** across type, geometry, density,
depth, motion, texture, rhythm, and icon treatment.

The engine has three boundaries:

1. **Theme is continuous.** A profile is a point in a normalized vector space, not a bag of unrelated overrides.
2. **Accessibility is invariant.** Contrast, focus visibility, target size, forced-colors behavior, and reduced-motion behavior are constraints, not stylistic dimensions.
3. **Output is static.** The build emits standards-native CSS and DTCG JSON. React components may consume it, but the engine does not depend on React, Tailwind, CSS-in-JS, or a browser runtime.

## Coherence over novelty

Changing one visual variable in isolation often produces a costume. Larger radii without corresponding spacing, motion, depth, and icon changes feel accidental. Mlola therefore derives foundations from a small vector and a sparse set of intentional couplings.

Sparse coupling matters. Every dimension must remain understandable on its own, and only relationships with a defensible perceptual effect are encoded. This keeps profiles inspectable and avoids an opaque “AI theme score.”

## Profiles are presets, not branches

The five built-in profiles are named coordinates:

- **Graphite** — neutral, polished, and lightly layered. The default when no theme is named.
- **Atelier Umami** — editorial, warm, tactile, and moderately layered.
- **Machined Titanium** — rectilinear, compact, restrained, and instrument-like.
- **Aerogel Glass** — soft, spacious, luminous, kinetic, and deeply layered.
- **Nordic Earth** — organic, calm, tactile, and lightly layered.

`data-theme` selects these profiles. Legacy `data-skin` names map to them temporarily: `mlola → atelier`, `mono → machined`, `mist → aerogel`, and `forest|ocean|ember → nordic`.

Profiles never change markup semantics. A primary action remains a primary action, and danger remains danger. Theme changes how those intents are expressed.
