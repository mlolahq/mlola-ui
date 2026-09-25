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
   eight packages in dependency order, with provenance, through npm trusted
   publishing: each package trusts only `mlolahq/mlola-ui`'s `publish.yml`,
   over OIDC, so no npm token exists.

Secrets: `MIRROR_TOKEN` in `mlolahq/mlola` (a fine-grained token with
Contents: read and write on `mlolahq/mlola-ui` only). npm needs no secret.
The commercial catalog never reaches either the mirror or
npm: the export fails on any Pro path, and `check:pack` on any Pro file or
class.

## Why not `prepublishOnly`

A `prepublishOnly` hook would run the gate once per package, eight times, for
the same tree. The gate runs once in `release:check` and once in CI instead, and
the publish step assumes a green, committed tree.

## Versioning

The registry index, every package, and the generated `agents.md` must agree on
the version. `check:registry` fails when the index and the packages drift.

## Deploying the site

`npm run deploy` ships the committed `HEAD` to ui.mlola.com: it uploads a new
release to `/var/www/mlola-ui/releases/`, installs, builds and migrates with
`/etc/mlola-ui.env`, switches `current`, restarts `mlola-ui.service`, and rolls
back to the previous release if the new one does not answer. Secrets live only
in `/etc/mlola-ui.env` on the server (`NEXT_PUBLIC_*` values are read at build
time, so change them and deploy again).

## Backups

`mlola-ui-backup.timer` runs `scripts/ops/backup.sh` every night as root: a
compressed `pg_dump`, encrypted with AES-256, checked by restoring its table of
contents, uploaded to S3, and kept for 14 days in `/var/backups/mlola-ui`.
Settings live in `/etc/mlola-ui-backup.env` (root only):

```
BACKUP_S3_ENDPOINT=https://s3.<region>.amazonaws.com   # or an S3-compatible endpoint
BACKUP_S3_REGION=<region>
BACKUP_S3_BUCKET=<bucket>
BACKUP_S3_PREFIX=mlola-ui/
BACKUP_S3_ACCESS_KEY_ID=<key with s3:PutObject on that prefix only>
BACKUP_S3_SECRET_ACCESS_KEY=<secret>
BACKUP_ENCRYPTION_PASSPHRASE=<long random passphrase, also kept in your password manager>
BACKUP_KEEP_LOCAL_DAYS=14
```

Give the bucket a lifecycle rule that expires old backups, and keep the
passphrase somewhere other than the server: without it a backup cannot be read.
Run one by hand with `systemctl start mlola-ui-backup.service` and read the
result with `journalctl -u mlola-ui-backup.service -n 20`.

To restore into a fresh database:

```
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in mlola_ui-<stamp>.dump.enc -out restore.dump
pg_restore --no-owner --dbname="$DATABASE_URL" --clean --if-exists restore.dump
```
