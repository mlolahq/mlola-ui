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

A `select`, a `switch` and a `slider` say when a person changes them: an
`ml-change` event that bubbles from the root, with the new value in
`event.detail.value` (an option's `data-value`, true or false, or the number).

### A behavior in a module of its own

The core stays under 10 KB gzip for every page, so a behavior few pages
need lives in a module of its own. Import it where the page has one; on
import it joins the core's behaviors and enhances what is already there:

```html
<script type="module">
  import { observe } from "@mlola-ui/behavior";
  import "@mlola-ui/behavior/dial";
  observe();
</script>
```

## Examples

`examples/` holds the markup for each behavior, one file per behavior, as
it should be written by hand. They are the markup the browser suite runs in
Chromium, Firefox and WebKit, and the markup the component docs show.

## Implemented behaviors

`accordion`, `tabs`, `dropdown-menu`, `select`, `modal`, `sheet`, `tooltip`,
`toast`, `switch`, `slider`, and `dial` (imported on its own,
`@mlola-ui/behavior/dial`): the same list the engine's `behavior-spec.mjs`
specifies, checked by the contract audit.

## Exports

| Path | What it is |
| --- | --- |
| `@mlola-ui/behavior` | `enhance`, `observe`, `destroy`, `behaviors` |
| `@mlola-ui/behavior/logic` | pure decisions shared with React |
| `@mlola-ui/behavior/dial` | the dial, which adds itself to `behaviors` on import |
| `@mlola-ui/behavior/render` | Mlola Render without a framework: `mountRender` draws the surfaces an agent composed as A2UI messages |
| `@mlola-ui/behavior/render/core` | the host both Mlola renderers draw from, and the check |
| `@mlola-ui/behavior/render/rules` | the Mlola Render catalog, as a module |

MIT licensed. Part of [Mlola UI](https://ui.mlola.com).
