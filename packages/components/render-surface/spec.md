# Render Surface Component Contract

## Purpose

Draws the interface an agent composed. The agent describes a surface as A2UI
messages from the Mlola Render catalog (`docs/render.md`); every message is
checked before anything shows, and what is drawn is made of Mlola components.

## Source

`packages/components/render-surface/render-surface.tsx`

## Anatomy and composition

`ml-render` holds one `ml-render-surface` for each surface the messages open.
Inside a surface every catalog component is the Mlola component it names:
Card, Alert, Empty State, Tabs, Accordion, Input, Textarea, Select, Radio
Group, Checkbox, Switch, Slider, Date Picker, Button, Badge, Progress, Avatar
and Table, with the engine's `ml-stack`, `ml-cluster` and `ml-grid` for layout.
It owns no interaction of its own: focus, keyboard and overlays belong to the
components it composes.

What a renderer decides (a binding's value, a template's rows, what a press
sends, which update is refused) is decided by the host in
`@mlola-ui/behavior/render/core`, which the framework-free renderer shares.

## Public API

The exported TypeScript source is authoritative. Named interface contracts:

- `RenderSurfaceProps`
- `RenderSurfaceLabels`

`messages` is fed once each: pass the same array with more messages at its
end as they arrive, and a different array for a different conversation.
`streaming` holds drawing until the messages pause. `host` takes a host kept
outside the component in place of `messages`. `onAction` receives A2UI's
action when a Button is pressed; `onError` receives A2UI's error for each
message that was refused.

## Semantic states

- Nothing to draw yet: `fallback` shows, with `aria-busy` while `streaming`.
- Drawn: each surface is the last state of it that passed the check.
- Refused: an update with an error changes nothing on screen.
- Held back: a required field left empty keeps the actions that would send
  its value. The field shows its error, the first one takes focus, and a
  `role="status"` region names the fields.

## Keyboard and accessibility behavior

Every field, control, table and tab group has a name, because the check
refuses a surface without one. Headings keep the order the agent gave, and an
Empty State or an Accordion takes the level under the heading before it. A
container the agent named with `accessibility.label` is a group with that
name; a Button takes its `accessibility` label and description. Keyboard
operation is each composed component's own.

## Theme channels used

A surface carries `data-theme` and `data-mode` from the agent's
`createSurface` and restates its ink and type, so it reads correctly inside a
page of another theme. `theme="inherit"` leaves both to the page. No color,
size or shadow is written here: every channel comes through the components.

## Responsive and container behavior

A surface fills its container and never outgrows it: layout wraps, a wide
table scrolls inside itself, and an agent's long word or address breaks.

## Registry and engine dependencies

- Registry: accordion, alert, avatar, badge, button, card, checkbox,
  date-picker, empty-state, input, progress, radio-group, select, slider,
  table, tabs, textarea, toggle.
- `@mlola-ui/behavior` for `render/core` and `render/rules`.

Tailwind utilities, class-merging runtimes, third-party primitive libraries, third-party icons, and external motion runtimes are forbidden.

## Required verification

Every claim below is enforced by a gate in `npm run check`, the browser suite,
or the registry audit:

- Every component of the catalog draws from an agent's messages
  (`tests/render-surface.test.tsx` builds one of each from the catalog).
- Typing writes to the data model, and a press sends A2UI's action with the
  bound values; a required field left empty holds it back and takes focus.
- A refused update leaves what was drawn and is reported in A2UI's error.
- A template draws one instance for each item, each reading its own item.
- Light and dark modes pass axe in all 5 canonical themes.
- The layout survives a compact container and 200% zoom.
- Registry dependencies and copied source compile without external UI runtimes.
