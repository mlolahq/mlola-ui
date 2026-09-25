# Theme methodology

A theme is derived by one method — Theme, Anatomy, Synthesis, Tuning,
Evaluation — that turns product character into reproducible design-system
output:

- **T — Theme:** state the intended character as normalized coordinates.
- **A — Anatomy:** fix semantics and interaction contracts. Accessibility is a
  constraint projected through every later stage, never a channel the vector can
  trade away.
- **S — Synthesis:** derive tokens, recipes, spring motion curves, and icon
  parameters from the vector through a deliberately sparse set of couplings.
- **T — Tuning:** map the derived foundations into intent-oriented component
  recipes without restating them per component.
- **E — Evaluation:** regenerate, validate, compare, and revise the vector
  instead of patching downstream components.

The five letters describe the workflow. Accessibility, sparse coupling,
tokenization, and evaluation appear inside those stages rather than as separate
steps, because they are properties of the whole method.

## Theme vector

The engine defines:

`τ = [type, geometry, density, depth, motion, texture, rhythm, icon]`, where every coordinate is in `[0, 1]`.

Axis meanings:

- `type`: utilitarian → editorial
- `geometry`: rectilinear → organic
- `density`: compact → spacious
- `depth`: flat → layered
- `motion`: still → kinetic
- `texture`: polished → tactile
- `rhythm`: regular → syncopated
- `icon`: systematic → expressive

The vector is descriptive, not a quality score. Neither endpoint is inherently better.

## Sparse derivation

For a derived value `yⱼ`, the general model is:

`yⱼ = clampⱼ(bⱼ + Σᵢ aⱼᵢ τᵢ + Σ(p,q)∈E cⱼpq τp τq)`

`b` is the foundation baseline, `a` is a direct axis influence, and `E` is the deliberately sparse coupling graph:

- `type × rhythm = 0.14`
- `geometry × texture = 0.18`
- `density × rhythm = −0.10`
- `depth × texture = 0.20`
- `depth × motion = 0.16`
- `motion × rhythm = 0.12`
- `icon × type = 0.08`

Current concrete derivations live in `packages/engine/src/config.mjs`. Examples include:

`space = 3.5 + 1.5 density − 0.3 density rhythm`

`radius = 2 + 12 geometry + 4 geometry texture`

`shadowBlur = 4 + 30 depth + 10 depth texture`

`durationNormal = 180 + 140 motion + 35 motion rhythm`

`iconStroke = 2.1 − 0.55 icon + 0.12 (1 − geometry)`

Motion is derived as a damped oscillator rather than only a duration. The motion
axis sets the damping ratio and the natural frequency is chosen so the spring
settles within the normal duration:

`ζ = 0.95 − 0.5 motion`

`ω = 4 / (ζ · durationNormal)`

`packages/engine/src/spring.mjs` samples that oscillator into a CSS `linear()`
easing, so a static transition carries the theme's kinetic character with
no JavaScript. In browsers without `linear()`, the engine keeps a cubic-bezier
fallback behind `@supports`.

The generated value is then constrained:

`tokens = P_accessibility(D(τ), semanticPalette)`

Semantic colors are curated profile inputs rather than unconstrained formula
output. That prevents a vector change from silently breaking contrast.

## Built-in vectors

- `atelier = [0.82, 0.68, 0.58, 0.62, 0.48, 0.78, 0.70, 0.82]`
- `machined = [0.22, 0.05, 0.30, 0.34, 0.22, 0.18, 0.24, 0.30]`
- `aerogel = [0.54, 0.92, 0.76, 0.94, 0.82, 0.38, 0.76, 0.68]`
- `nordic = [0.62, 0.74, 0.66, 0.46, 0.34, 0.86, 0.62, 0.54]`

Their single source of truth is `packages/engine/src/config.mjs`. The registry
and the preview read identity, genre, and swatch from the generated manifest
rather than keeping their own lists.

## Evaluation rules

A profile is ready only when:

1. Text and essential graphics meet WCAG contrast requirements in light and dark modes.
2. Focus is visible without relying on color alone.
3. Coarse-pointer interactive controls reach a 44px minimum target.
4. Reduced motion removes spatial and repeating animation.
5. Forced-colors mode retains boundaries, labels, and operability.
6. Intent recipes remain distinguishable without profile-specific markup.
7. Regeneration is deterministic and `node packages/engine/build.mjs --check` passes.
