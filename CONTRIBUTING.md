# Contributing to Mlola

Mlola changes must preserve stable component anatomy while improving expression,
behavior, or delivery.

## Development

```bash
npm install
npm run codegen
npm run check
npm run dev
```

Run the packed CLI test before changing registry or distribution behavior.

## Runtime dependency policy

Published code may depend only on React, ReactDOM, other Mlola packages, and web
platform APIs. Do not add UI, styling, class-merging, icon, animation, floating,
or accessibility runtimes.

Development-only tools are acceptable when they verify output and are not
shipped to consumers.

## Component requirements

Every component change must:

- preserve semantic DOM and accessible naming
- document controlled and uncontrolled state behavior
- support keyboard, pointer, and touch input
- expose stable `data-state` hooks
- use semantic `ml-*` recipes
- pass reduced-motion and forced-colors checks
- avoid an animation loop while idle
- include or update a contract test

Blocks compose components. Templates compose blocks. Do not reimplement an
existing interaction pattern in either layer.

## Theme changes

Theme profiles are authored in the engine model, not by editing generated
CSS. A profile must affect a coherent set of channels and pass pairwise
distance, contrast, grayscale, reduced-motion, and reference-corpus checks.

Do not add an isolated token override to make one showcase look correct. Fix the
foundation, semantic role, or component recipe responsible for the mismatch.

## Registry changes

Registry metadata is the source of truth for files, targets, dependencies,
checksums, and preview loaders. Run code generation and commit required generated
artifacts with their source change.

The CLI must continue to work from an npm tarball in a clean project with no
repository checkout.

## Commit scope

Keep foundation, behavior, component, composition, distribution, and
documentation changes reviewable. Generated outputs may accompany their source
change but should not obscure the authored diff.
