# Component Anatomy

Anatomy is the invariant half of Mlola. A theme may retune expression but
cannot change what a component means or how it behaves.

## Root contract

Every interactive component defines:

- semantic root element or explicit role
- controlled and uncontrolled state contract
- stable state vocabulary exposed through ARIA and `data-state`
- labelled relationships generated with stable IDs
- forwarded references where consumers need focus or measurement
- keyboard, pointer, touch, and dismissal behavior
- reduced-motion and forced-colors behavior

## Compound components

Composite widgets use consistent parts:

```text
Root
├── Trigger
├── Content
│   ├── Item
│   └── optional Group or Separator
└── optional Close
```

Parts share behavior through a narrowly scoped context. State is not inferred
from CSS. CSS consumes semantic state that React or the native element already
owns.

## Prop vocabulary

Four props, four questions. A prop answers exactly one of them, and the same
word means the same thing in every component.

| Prop | Answers | Values | Attribute |
|---|---|---|---|
| `tone` | What does the color mean? | `neutral` `primary` `info` `success` `warning` `danger` — the theme's color roles, or a subset | `data-tone` |
| `variant` | What form does it take? | Per component: Button `primary` `secondary` `outline` `subtle` `link` `danger`; Badge `soft` `solid` `outline`; Alert `card` `soft` | `data-variant` |
| `size` | How large? | `xs` `sm` `md` `lg` `xl`, a subset per component; `md` is the default | `data-size` |
| `status` | Where is it in its lifecycle? | e.g. `idle` `loading` `success` `error`, `streaming` `complete` | `data-status` |

- Color never goes in `variant`, and form never goes in `tone`. Button's
  `danger` variant is the one exception: a destructive action is a kind of
  button, not a color on another kind.
- The word for a failure color is always `danger` (never `destructive`,
  `error` or `critical`). `error` belongs only to `status`, as the outcome of
  work.
- A neutral tone is `neutral`, never `default` or `muted`. (`default` remains
  a valid *variant* name: the standard form of a Card, Input or Tabs.)
- Values are controlled with `value`, `defaultValue` and `onValueChange`;
  booleans with `checked`/`onCheckedChange`, `pressed`/`onPressedChange` and
  `open`/`onOpenChange`. `multiple` switches `value` between one value and a
  list; it does not introduce a second prop.
- Toasts follow the same words: `toast.info`, `toast.success`,
  `toast.warning`, `toast.danger` and `toast.loading`.
- Two sizes stand outside the `xs`–`xl` steps, because they are not steps:
  `full` fills the viewport (Modal, Sheet) and `page` spans a whole page
  (EmptyState).
- Status words are shared too. Work that went wrong is `error` (never
  `failure` or `failed`); finished work is `complete`, or `done` for a task on
  a board; progress through a sequence is `complete` / `current` /
  `upcoming`. Values follow the code's spelling: `canceled`.

## Reserved attributes

`data-theme` and `data-mode` belong to the engine: they select a theme and
light or dark. A component never sets them for its own meaning. A floating
layer copies them from where it opened, so a composer that borrowed
`data-mode="note"` would repaint its own popovers in the wrong mode. Name the
component's own state instead: `data-kind`, `data-state`.

## Touch

A control drawn smaller than a fingertip (a remove mark on a tag, a clear
button, a carousel dot, a breadcrumb link) keeps its look and adds
`data-hit="expand"`: on a coarse pointer an invisible area widens its target
to 44px. It uses `::after`, so a control that already draws with `::after`
grows its own box on touch instead.

## State vocabulary

- disclosure: `open` / `closed`
- selection: `selected` / `unselected`
- binary input: `checked` / `unchecked` / `indeterminate`
- toggle: `on` / `off`
- request: `idle` / `loading` / `success` / `error`

Use native attributes first. `data-state` is a stable styling and inspection
hook, not a replacement for ARIA.

## Layer families

Modal and Sheet share focus containment, background isolation, scroll lock,
dismissal stacking, portal lifecycle, labelling, and focus restoration.

Dropdown and Select share collection registration, roving focus, typeahead,
viewport positioning, and dismissal, while retaining their distinct ARIA
semantics.

Tabs, Radio Group, and menu-like collections share roving focus but define
different activation and selection behavior.

## Two renderers, one contract

A component has two possible renderers: the React source and the framework-free
runtime. They share the pure interaction decisions in
`@mlola-ui/behavior/logic` and both satisfy `behavior-spec.mjs`, which the
contract audit checks. A behavior may be implemented in React, in the runtime,
or in both; it may never exist in only one of them without the spec saying so.

When a block needs an interaction that no canonical component owns, the fix is
to promote it to a component with its own spec, not to reimplement the
interaction inside the block.

## Composition rule

The library is four ordered layers:

```text
Component  a single primitive with one job            Button, Card, Tabs
Block      one section of a page                      Hero, Navbar, Pricing tiers
Page       one complete route built from blocks        Landing, Pricing, Dashboard
Template   a multi-page flow with routes and state    Storefront (catalog → cart → checkout)
```

Each layer consumes the one below it and nothing above it. A component may not
import a block, a block may not import a page, and a page may not import a
template. Interaction behavior belongs to the lowest layer that owns the
concern: focus, keyboard, overlay, and collection logic live in components; a
block, page, or template may arrange and configure them but must not reimplement
them. A behavior bug fixed in a primitive must not remain duplicated in a higher
layer.
