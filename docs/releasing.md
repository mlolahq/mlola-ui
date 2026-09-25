# Releasing

Mlola is published as eight packages plus the `mlola-ui` CLI. Publishing is
mechanical, but it must never ship stale generated output or an incomplete
tarball.

## Before a release

1. `npm run release:check` — runs the full gate and then `npm pack --dry-run`
   for every package, verifying contents, licence, and public-access metadata.
2. `npm run test:e2e` — the browser suite, including the registry render
   coverage and the mode matrix.
3. Complete the [manual accessibility checklist](accessibility-checklist.md) and
   a Firefox and Safari pass. Automation is Chromium-only.
4. Update `version` in the root manifest and in every package to the same value,
   and add a `CHANGELOG.md` entry.

## Publish

Two repositories, one source of truth:

- `mlolahq/mlola` (private): everything, Pro included. Code generation and the
  audits run here.
- `mlolahq/mlola-ui` (public, MIT): the open-source mirror, made by
  `npm run export:free`. npm packages are published from it, because npm
  provenance can only attest a public source.

To release:

1. Pass the checks above, bump the versions, and publish a GitHub release
   tagged `vX.Y.Z` in `mlolahq/mlola`.
2. `sync-free.yml` exports the free core, tests the export on its own, and
   pushes it to `mlolahq/mlola-ui` as one commit with the same tag.
3. The tag runs the mirror's `publish.yml`, which tests again and publishes the
   eight packages in dependency order, with provenance.

Secrets: `MIRROR_TOKEN` in `mlolahq/mlola` (a fine-grained token with
Contents: read and write on `mlolahq/mlola-ui` only) and `NPM_TOKEN` in
`mlolahq/mlola-ui`. The commercial catalog never reaches either the mirror or
npm: the export fails on any Pro path, and `check:pack` on any Pro file or
class.

## Why not `prepublishOnly`

A `prepublishOnly` hook would run the gate once per package, eight times, for
the same tree. The gate runs once in `release:check` and once in CI instead, and
the publish step assumes a green, committed tree.

## Versioning

The registry index, every package, and the generated `agents.md` must agree on
the version. `check:registry` fails when the index and the packages drift.
