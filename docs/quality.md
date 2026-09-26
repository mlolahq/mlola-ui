# Mlola Quality Contract

Mlola is releaseable only when its semantics, expression, distribution, and
performance are proven together.

## Required gates

Every pull request must pass:

1. generated artifact drift check (`check:engine`, `check:codegen`)
2. forbidden runtime dependency audit
3. registry schema and dependency closure validation
4. package-level TypeScript checks, including `noUnusedLocals`
5. lint
6. pure-logic unit tests, including WCAG contrast and deprecation expiry
7. production package and preview builds
8. packed CLI installation in a clean consumer fixture
9. keyboard and accessibility browser tests for every behavior, in Chromium,
   Firefox and WebKit
10. an axe-core WCAG 2.2 A/AA sweep of every registry item, in both modes
11. theme visual corpus and registry render coverage

## Accessibility invariants

All canonical components target WCAG 2.2 AA and follow the relevant WAI-ARIA
Authoring Practices pattern.

- Keyboard behavior is complete and documented.
- Focus is visible, ordered, contained when modal, and restored after dismissal.
- State and errors are programmatically associated.
- Meaning never depends only on color, texture, motion, icons, or sound.
- Pointer targets are at least 24 by 24 CSS pixels and target 40–44 pixels for
  primary controls.
- Content remains operable at 200% zoom and in narrow containers.
- `prefers-reduced-motion` removes spatial motion, parallax, tilt, bounce, and
  decorative stagger.
- `forced-colors` replaces decorative material with real system borders and
  colors.

## Theme proof

The reference corpus is layered, and each layer names what it covers:

- `tests/e2e/coverage.spec.ts` renders **every** registry item (free and Pro
  components, blocks, pages, templates) in a canonical theme, in Chromium,
  Firefox and WebKit, and fails on any uncaught error.
- `tests/e2e/accessibility.spec.ts` runs axe-core (WCAG 2.2 A and AA) on
  every registry item in light and dark mode. An exception names the item,
  the rule and the reason; there are none.
- `tests/e2e/theme-visual.spec.ts` snapshots a representative subset
  (`VISUAL_CORPUS`) across all five themes and both modes.
- `tests/e2e/modes.spec.ts` asserts reduced motion, forced colors, a compact
  viewport, and the disabled and focus states.
- `tests/e2e/a11y-smoke.spec.ts` exercises the keyboard map of every behavior
  in `behavior-spec.mjs`.

The corpus is a sample for pixels and exhaustive for rendering and behavior;
it does not claim a screenshot for every state.

For each visual channel `k`, the engine records normalized observable change
`delta(k)`. Pairwise theme distance is:

```text
D(a,b) = sqrt(sum(weight(k) * delta(k,a,b)^2))
```

This is implemented in `packages/engine/src/theme-distance.mjs`. Each
channel is observed through the foundations it moves (type through weight,
tracking, and leading; geometry through radius and border; and so on), and
`delta(k)` is the mean normalized change across those observables. Weights are
`1` except `icon = 0.7`, because optical stroke moves less of a page than type,
motion, or depth.

Release criteria, calibrated against the maintained corpus:

- at least six of eight expression channels change by `delta >= 0.075`
- pairwise distance is at least 0.35
- no single channel contributes more than 40% of the squared distance
- identity remains recognizable in grayscale and with motion disabled
- all anatomy and accessibility tests remain identical across themes

These values are Mlola product gates, not universal perceptual laws. They are
tested by `tests/theme.test.mjs` and change only with corpus evidence.

## Performance budgets

Initial budgets:

- framework-free behavior: at most 10 KB gzip, measured as a plain page loads
  it (`index.js` and the modules it imports)
- critical engine CSS: at most 28 KB Brotli
- no requestAnimationFrame loop while idle
- no layout read after a write in the same animation frame
- preview Interaction to Next Paint below 200 ms
- preview Cumulative Layout Shift below 0.1
- icons remain tree-shakeable
- textures and scene effects are optional, lazy, and non-semantic

CI records measured sizes. A budget increase requires an explicit explanation
and a corresponding user-facing gain.

## Browser verification

Automated coverage (`npm run test:e2e`):

- current Chromium in CI; Firefox and Safari are a per-release manual pass
- every registry item renders, plus the mode and state matrix above
- keyboard behavior for the full behavior contract
- light and dark themes across all canonical themes
- reduced motion and forced colors
- a mobile viewport and a compact container

Manual, per release, recorded in
[the accessibility checklist](accessibility-checklist.md):

- VoiceOver and NVDA passes for Dialog, Sheet, Select, Tabs, Toast, Accordion,
  and Carousel
- iOS touch and scroll locking
- nested overlay and portaled content in Safari and Firefox

Native APIs are not assumed to supply complete component semantics. Dialog,
Popover, and Anchor Positioning are implementation tools; component contracts
remain Mlola's responsibility.
