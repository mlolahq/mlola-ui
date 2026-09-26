# @mlola-ui/behavior

Framework-free interaction behavior for Mlola UI markup. Standard DOM only: no
framework, no build step, no runtime peers, and no renderer of its own. Mark a
root with `data-ml="<behavior>"` and enhance it, or call `observe()` once and
let new markup enhance itself.

The decisions themselves — which index a key moves to, where focus goes, what a
value snaps to — live in `@mlola-ui/behavior/logic` as pure functions, so React
components and this runtime cannot drift apart.

## Install

```bash
npm install @mlola-ui/behavior
```

## Use

```html
<link rel="stylesheet" href="@mlola-ui/engine" />

<div data-theme="atelier" data-mode="light">
  <div data-ml="tabs">…</div>
</div>

<script type="module">
  import { observe } from "@mlola-ui/behavior";
  observe();
</script>
```

It is idempotent, so it is safe to call after a framework re-render, a turbo
navigation, or an htmx swap.

## Implemented behaviors

`accordion`, `tabs`, `dropdown-menu`, `select`, `modal`, `sheet`, `tooltip`,
`toast`, `switch`, `slider` — the same list the engine's `behavior-spec.mjs`
specifies, checked by the contract audit.

## Exports

| Path | What it is |
| --- | --- |
| `@mlola-ui/behavior` | `enhance`, `observe`, `destroy`, `behaviors` |
| `@mlola-ui/behavior/logic` | pure decisions shared with React |

MIT licensed. Part of [Mlola UI](https://ui.mlola.com).
