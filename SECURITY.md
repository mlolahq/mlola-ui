# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| < 1.0 | No |

## Reporting a vulnerability

Please do not open a public issue. Report privately through
[GitHub's private vulnerability reporting](https://github.com/mlolahq/mlola-ui/security/advisories/new)
or by email to hello@mlola.com, with steps to reproduce and the affected
package and version.

We acknowledge reports within three working days and aim to ship a fix for a
confirmed issue within fourteen days, crediting the reporter unless they ask
otherwise.

## How releases are protected

- Packages are published only from `mlolahq/mlola-ui`'s `publish.yml` through
  npm trusted publishing: no npm token exists, and every version carries
  provenance you can check with `npm audit signatures`.
- Release tags and the default branch are protected; only maintainers can
  create a `v*` tag.
- Mlola Pro source is never part of this repository or its packages.
