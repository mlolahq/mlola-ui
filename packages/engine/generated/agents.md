# Mlola UI for code generation

Generated from the source of truth. Do not edit by hand.

## Read this first

- **Do not import a styling framework.** The library ships its own CSS. There
  is no Tailwind, no CSS-in-JS and no class name utility to install.
- **Style through the classes below, never through invented ones.** A class
  that is not in this document does not exist. (Mlola Pro's classes are in the
  guide that comes with Pro source.)
- **Behaviour is optional and framework-free.** `@mlola-ui/behavior` attaches
  to markup you already rendered. It never renders anything itself, so it works
  with React, Svelte, Vue, Rails, a Go template or a static file.
- **Native controls stay native.** Checkbox and radio are real `<input>`
  elements. Do not reimplement them.

## The shortest correct example

```html
<link rel="stylesheet" href="@mlola-ui/engine" />

<div data-theme="graphite" data-mode="light">
  <button class="ml-button" data-variant="primary">Save</button>
</div>

<script type="module">
  import { observe } from "@mlola-ui/behavior";
  observe();
</script>
```

## Themes

Set `data-theme` and `data-mode` on any ancestor. Nothing else changes.

| id | name |
| --- | --- |
| `graphite` | Graphite |
| `atelier` | Atelier Umami |
| `machined` | Machined Titanium |
| `aerogel` | Aerogel Glass |
| `nordic` | Nordic Earth |

`data-mode` is `light` or `dark`.

A project defines its own theme in one file, `mlola.theme.json`, which
overrides fonts, colours, geometry, the spacing and type scale, and any
custom property through `extend`. See `mlola.theme.example.json`.

## Elements and their attributes

Emit these classes and attributes from any language and the visuals are
correct. This table is read out of the stylesheet, so it is never stale.

| class | attribute | allowed values |
| --- | --- | --- |
| `.ml-accordion-item` | `data-state` | `open` |
| `.ml-alert` | `data-state` | `closing` |
| `.ml-alert` | `data-tone` | `danger`, `info`, `neutral`, `success`, `warning` |
| `.ml-alert` | `data-variant` | `soft` |
| `.ml-app-shell` | `data-narrow` | _presence only_ |
| `.ml-avatar-root` | `data-size` | `lg`, `sm`, `xl`, `xs` |
| `.ml-avatar-status` | `data-status` | `away`, `busy`, `online` |
| `.ml-badge` | `data-size` | `lg`, `sm` |
| `.ml-badge` | `data-tone` | `danger`, `info`, `primary`, `success`, `warning` |
| `.ml-badge` | `data-variant` | `outline`, `solid` |
| `.ml-breadcrumb-item` | `data-collapse-indicator` | _presence only_ |
| `.ml-breadcrumb-item` | `data-collapsible` | _presence only_ |
| `.ml-button` | `aria-disabled` | `true` |
| `.ml-button` | `aria-pressed` | `true` |
| `.ml-button` | `data-loading` | _presence only_ |
| `.ml-button` | `data-size` | `icon`, `lg`, `sm` |
| `.ml-button` | `data-state` | `success` |
| `.ml-button` | `data-variant` | `danger`, `link`, `outline`, `primary`, `secondary`, `subtle` |
| `.ml-calendar-cell` | `data-preview` | _presence only_ |
| `.ml-calendar-cell` | `data-range` | `end`, `start` |
| `.ml-calendar-day` | `aria-disabled` | `true` |
| `.ml-calendar-day` | `data-outside` | _presence only_ |
| `.ml-calendar-day` | `data-selected` | _presence only_ |
| `.ml-calendar-day` | `data-today` | _presence only_ |
| `.ml-calendar-day` | `data-unreachable` | _presence only_ |
| `.ml-card` | `data-interactive` | _presence only_ |
| `.ml-card` | `data-variant` | `elevated`, `glass`, `specular` |
| `.ml-carousel` | `data-playing` | _presence only_ |
| `.ml-carousel-arrow` | `data-side` | `next`, `previous` |
| `.ml-carousel-dot` | `aria-current` | `true` |
| `.ml-chart-bar` | `data-highlighted` | `true` |
| `.ml-checkbox-field` | `data-state` | `checked`, `indeterminate` |
| `.ml-circular-progress` | `data-size` | `lg`, `sm` |
| `.ml-circular-progress` | `data-state` | `complete`, `indeterminate` |
| `.ml-circular-progress` | `data-tone` | `danger`, `info`, `success`, `warning` |
| `.ml-color-picker-preset` | `aria-pressed` | `true` |
| `.ml-combobox-control` | `data-open` | _presence only_ |
| `.ml-combobox-input` | `data-clearable` | _presence only_ |
| `.ml-combobox-input` | `data-leading` | _presence only_ |
| `.ml-combobox-option` | `aria-disabled` | `true` |
| `.ml-combobox-option` | `aria-selected` | `true` |
| `.ml-combobox-option` | `data-create` | _presence only_ |
| `.ml-combobox-option` | `data-highlighted` | _presence only_ |
| `.ml-combobox-popover` | `data-side` | `top` |
| `.ml-command-item` | `aria-disabled` | _presence only_ |
| `.ml-command-item` | `aria-selected` | `true` |
| `.ml-context-menu-item` | `aria-disabled` | `true` |
| `.ml-context-menu-item` | `data-danger` | _presence only_ |
| `.ml-context-menu-item` | `data-highlighted` | _presence only_ |
| `.ml-date-picker-panel` | `data-presets` | _presence only_ |
| `.ml-date-picker-trigger` | `data-empty` | _presence only_ |
| `.ml-dropdown-item` | `data-danger` | _presence only_ |
| `.ml-dropdown-item` | `data-highlighted` | _presence only_ |
| `.ml-dropdown-menu` | `data-align` | `end` |
| `.ml-dropdown-trigger` | `aria-expanded` | `true` |
| `.ml-dropzone` | `aria-disabled` | _presence only_ |
| `.ml-dropzone` | `data-dragging` | _presence only_ |
| `.ml-dropzone-file` | `data-status` | `error` |
| `.ml-empty` | `data-size` | `page` |
| `.ml-filter-chip` | `aria-pressed` | `true` |
| `.ml-filter-chip` | `data-state` | `active` |
| `.ml-form-message` | `data-tone` | `danger`, `success` |
| `.ml-grid` | `data-columns` | `1`, `2`, `3`, `4`, `6` |
| `.ml-grid` | `data-layout` | `3-col`, `4-col`, `list` |
| `.ml-heatmap` | `data-tone` | `info`, `success`, `warning` |
| `.ml-heatmap-cell` | `data-active` | _presence only_ |
| `.ml-heatmap-cell` | `data-level` | `1`, `2`, `3`, `4` |
| `.ml-heatmap-cell` | `data-outside` | _presence only_ |
| `.ml-input` | `aria-invalid` | `true` |
| `.ml-input` | `data-size` | `lg`, `sm` |
| `.ml-input` | `data-variant` | `filled`, `subtle` |
| `.ml-input-control` | `data-leading` | _presence only_ |
| `.ml-input-control` | `data-trailing` | _presence only_ |
| `.ml-input-field` | `data-invalid` | _presence only_ |
| `.ml-modal` | `data-size` | `full`, `lg`, `sm`, `xl` |
| `.ml-number-input-control` | `data-disabled` | _presence only_ |
| `.ml-number-input-control` | `data-invalid` | _presence only_ |
| `.ml-otp` | `data-invalid` | _presence only_ |
| `.ml-pagination-button` | `aria-current` | `page` |
| `.ml-pagination-button` | `data-state` | `active` |
| `.ml-popover` | `data-side` | `bottom`, `left`, `right`, `top` |
| `.ml-priority-icon` | `data-priority` | `high`, `none`, `urgent` |
| `.ml-progress-root` | `data-active` | _presence only_ |
| `.ml-progress-root` | `data-size` | `lg`, `sm` |
| `.ml-progress-root` | `data-state` | `complete`, `indeterminate` |
| `.ml-progress-root` | `data-tone` | `danger`, `info`, `success`, `warning` |
| `.ml-radio-group` | `data-orientation` | `horizontal` |
| `.ml-radio-item` | `data-state` | `checked` |
| `.ml-resizable` | `data-anchor` | `second` |
| `.ml-resizable` | `data-direction` | `horizontal`, `vertical` |
| `.ml-resizable-pane` | `data-folded` | _presence only_ |
| `.ml-segmented-control-item` | `aria-pressed` | `true` |
| `.ml-segmented-control-item` | `data-state` | `active` |
| `.ml-select` | `data-size` | `lg`, `sm` |
| `.ml-select` | `data-state` | `open` |
| `.ml-select-option` | `data-disabled` | _presence only_ |
| `.ml-select-option` | `data-highlighted` | _presence only_ |
| `.ml-select-option` | `data-state` | `checked` |
| `.ml-select-popover` | `data-side` | `top` |
| `.ml-select-root` | `data-invalid` | _presence only_ |
| `.ml-select-value` | `data-placeholder` | _presence only_ |
| `.ml-sheet-panel` | `data-side` | `bottom`, `left`, `right`, `top` |
| `.ml-sheet-panel` | `data-size` | `lg`, `sm` |
| `.ml-sidebar-item` | `aria-current` | `page` |
| `.ml-sidebar-title` | `aria-expanded` | `false` |
| `.ml-sidebar-title` | `data-collapsible` | _presence only_ |
| `.ml-skeleton` | `data-rounded` | `none` |
| `.ml-slider-field` | `data-size` | `sm` |
| `.ml-status-icon` | `data-status` | `backlog`, `canceled`, `done`, `in-progress`, `in-review` |
| `.ml-stepper` | `data-orientation` | `horizontal`, `vertical` |
| `.ml-stepper-step` | `data-status` | `complete`, `current`, `error`, `upcoming` |
| `.ml-table` | `data-size` | `sm` |
| `.ml-table` | `data-stripe` | `alternate` |
| `.ml-table` | `data-striped` | _presence only_ |
| `.ml-table-row` | `data-state` | `selected` |
| `.ml-tabs` | `data-orientation` | `vertical` |
| `.ml-tabs` | `data-variant` | `enclosed`, `pills` |
| `.ml-tabs-trigger` | `aria-selected` | `true` |
| `.ml-tabs-trigger` | `data-state` | `active` |
| `.ml-tag-input-control` | `data-disabled` | _presence only_ |
| `.ml-tag-input-control` | `data-invalid` | _presence only_ |
| `.ml-tag-input-tag` | `data-armed` | _presence only_ |
| `.ml-textarea-count` | `data-full` | _presence only_ |
| `.ml-time-picker-control` | `data-disabled` | _presence only_ |
| `.ml-time-picker-control` | `data-unavailable` | _presence only_ |
| `.ml-time-picker-option` | `aria-selected` | `true` |
| `.ml-time-picker-segment` | `data-empty` | _presence only_ |
| `.ml-time-picker-segment` | `data-period` | _presence only_ |
| `.ml-timeline-item` | `data-status` | `complete`, `current`, `upcoming` |
| `.ml-timeline-marker` | `data-status` | `complete`, `current`, `upcoming` |
| `.ml-timeline-marker` | `data-tone` | `danger`, `info`, `primary`, `success`, `warning` |
| `.ml-toast` | `data-has-description` | _presence only_ |
| `.ml-toast` | `data-swiping` | _presence only_ |
| `.ml-toast` | `data-tone` | `danger`, `info`, `success`, `warning` |
| `.ml-toast-slot` | `data-state` | `closed` |
| `.ml-toaster` | `data-position` | `bottom-center`, `bottom-right`, `top-center`, `top-right` |
| `.ml-toggle` | `aria-checked` | `true` |
| `.ml-toggle` | `data-size` | `lg`, `sm` |
| `.ml-toggle` | `data-state` | `checked` |
| `.ml-toggle-button` | `aria-pressed` | `true` |
| `.ml-toggle-button` | `data-state` | `on` |
| `.ml-tooltip` | `data-side` | `bottom`, `left`, `right`, `top` |
| `.ml-tour-button` | `data-primary` | _presence only_ |
| `.ml-tour-card` | `data-centred` | _presence only_ |
| `.ml-tour-dot` | `data-active` | _presence only_ |
| `.ml-tour-scrim` | `data-spotlight` | _presence only_ |

## Behaviour

### accordion

Disclosure list. One panel open at a time, or several.

- Root: `.ml-accordion`
- Parts: item `.ml-accordion-item`, trigger `.ml-accordion-trigger`, panel `.ml-accordion-panel`
- ARIA on trigger: `role` — button (a real <button> is preferred); `aria-expanded` — true when the item is open; `aria-controls` — id of the panel
- ARIA on panel: `role` — region; `aria-labelledby` — id of the trigger
- Keyboard:
  - <kbd>Enter</kbd> / <kbd>Space</kbd>: Toggle the focused item.
  - <kbd>ArrowDown</kbd> / <kbd>ArrowUp</kbd>: Move focus between triggers.
  - <kbd>Home</kbd> / <kbd>End</kbd>: Focus the first or last trigger.
- State changes:
  - On click or activate a trigger, set data-state on the item, trigger and panel to open, or closed when it was open and collapsing is allowed. Also: hide the closed panel from the accessibility tree.

### tabs

One panel visible at a time, selected by a tab strip.

- Root: `.ml-tabs`
- Parts: list `.ml-tabs-list`, trigger `.ml-tabs-trigger`, content `.ml-tabs-content`
- ARIA on list: `role` — tablist; `aria-orientation` — matches data-orientation
- ARIA on trigger: `role` — tab; `aria-selected` — true on the active tab; `aria-controls` — id of the panel; `tabindex` — 0 on the active tab, -1 on the rest
- ARIA on content: `role` — tabpanel; `aria-labelledby` — id of the tab
- Keyboard:
  - <kbd>ArrowRight</kbd> / <kbd>ArrowLeft</kbd>: Move to the next or previous enabled tab when horizontal, wrapping around.
  - <kbd>ArrowDown</kbd> / <kbd>ArrowUp</kbd>: The same when vertical.
  - <kbd>Home</kbd> / <kbd>End</kbd>: Move to the first or last enabled tab.
- State changes:
  - On select a tab by pointer or key, set data-state and aria-selected on triggers, data-state on panels to active for the chosen pair, inactive for the rest. Also: move focus to the newly selected tab.
- Note: Selection follows focus. Disabled tabs are skipped, never focused.

### dropdown-menu

A menu anchored to a trigger.

- Root: `.ml-dropdown`
- Parts: trigger `.ml-dropdown-trigger`, menu `.ml-dropdown-menu`, item `.ml-dropdown-item`
- ARIA on trigger: `aria-haspopup` — menu; `aria-expanded` — true while open
- ARIA on menu: `role` — menu
- ARIA on item: `role` — menuitem; `data-highlighted` — present on the active item
- Keyboard:
  - <kbd>ArrowDown</kbd> / <kbd>ArrowUp</kbd>: Open the menu, then move the highlight.
  - <kbd>Enter</kbd> / <kbd>Space</kbd>: Activate the highlighted item.
  - <kbd>Escape</kbd>: Close and return focus to the trigger.
  - <kbd>Tab</kbd>: Close without activating.
- State changes:
  - On click the trigger, set data-state to open or closed.
  - On pointer over an item, set data-highlighted to that item only.
  - On pointer down outside the root, set data-state to closed.
- Note: Disabled items are skipped by the highlight and cannot be activated.

### select

A listbox behind a combobox trigger.

- Root: `.ml-select-root`
- Parts: trigger `.ml-select`, popover `.ml-select-popover`, list `.ml-select-list`, option `.ml-select-option`, search `.ml-select-search`
- ARIA on trigger: `role` — combobox; `aria-expanded` — true while open; `aria-controls` — id of the listbox; `aria-activedescendant` — id of the highlighted option while open
- ARIA on list: `role` — listbox; `aria-multiselectable` — true when multiple
- ARIA on option: `role` — option; `aria-selected` — true when chosen; `data-highlighted` — present on the active option
- Keyboard:
  - <kbd>ArrowDown</kbd> / <kbd>ArrowUp</kbd>: Open, then move the highlight past disabled options.
  - <kbd>Enter</kbd> / <kbd>Space</kbd>: Choose the highlighted option. Space types when a search field has focus.
  - <kbd>Home</kbd> / <kbd>End</kbd>: Highlight the first or last enabled option.
  - <kbd>Escape</kbd>: Close and return focus to the trigger.
  - <kbd>Tab</kbd>: Close without choosing.
- State changes:
  - On choose an option, set aria-selected and data-state on options to checked for the chosen option. Also: single select closes and restores focus; multiple select stays open.

### modal

A dialog over the page that owns focus while open.

- Root: `.ml-modal`
- Parts: overlay `.ml-modal-overlay`, close `.ml-modal-close`
- ARIA on root: `role` — dialog; `aria-modal` — true; `aria-labelledby` — id of the title, or aria-label
- Keyboard:
  - <kbd>Escape</kbd>: Close, unless closing on Escape is disabled.
  - <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd>: Cycle focus inside the dialog and never leave it.
- State changes:
  - On open, set focus to the first focusable element inside. Also: lock page scroll.
  - On close, set focus to the element that opened the dialog. Also: release page scroll.
  - On pointer down on the backdrop, set closed to unless closing on backdrop is disabled.

### sheet

A dialog anchored to one edge of the viewport.

- Root: `.ml-sheet-panel`
- Parts: overlay `.ml-sheet-overlay`, close `.ml-sheet-close`
- ARIA on root: `role` — dialog; `aria-modal` — true
- Keyboard:
  - <kbd>Escape</kbd>: Close, unless closing on Escape is disabled.
  - <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd>: Cycle focus inside the panel.
- State changes:
  - On open, set focus to inside the panel. Also: lock page scroll.
  - On close, set focus to the trigger. Also: release page scroll.
- Note: Identical to modal apart from which edge it is anchored to.

### tooltip

A short label shown on hover or focus.

- Root: `.ml-tooltip-root`
- Parts: tooltip `.ml-tooltip`, arrow `.ml-tooltip-arrow`
- ARIA on tooltip: `role` — tooltip
- ARIA on trigger: `aria-describedby` — id of the tooltip while it is open
- Keyboard:
  - <kbd>Escape</kbd>: Hide the tooltip.
- State changes:
  - On pointer enter or focus the trigger, set visible to after the delay.
  - On pointer leave or blur, set hidden to immediately, cancelling any pending delay.
- Note: Never put essential information or interactive content in a tooltip.

### toast

Transient messages in a live region.

- Root: `.ml-toaster`
- Parts: toast `.ml-toast`, action `.ml-toast-action`, close `.ml-toast-close`
- ARIA on root: `role` — region; `aria-label` — distinct per region, so several are distinguishable
- ARIA on toast: `role` — status for ordinary messages, alert for danger and warning; `aria-live` — polite, or assertive for danger and warning; `aria-busy` — true while it waits on work (a loading toast)
- Keyboard:
  - <kbd>Tab</kbd>: Reach the action and dismiss controls.
- State changes:
  - On push, set a toast into the region matching its position to visible.
  - On duration elapsed, set removed to unless the duration is zero.

### switch

An on/off control that is not a native checkbox.

- Root: `.ml-toggle`
- Parts: thumb `.ml-toggle-thumb`
- ARIA on root: `role` — switch; `aria-checked` — true or false
- Keyboard:
  - <kbd>Enter</kbd> / <kbd>Space</kbd>: Toggle.
- State changes:
  - On activate, set aria-checked and data-state to the opposite value.
- Note: Prefer a native checkbox unless the control genuinely reads as a switch.

### slider

A single value chosen from a range.

- Root: `.ml-slider-field`
- Parts: control `.ml-slider`, track `.ml-slider-track`, range `.ml-slider-range`, thumb `.ml-slider-thumb`
- ARIA on thumb: `role` — slider; `aria-valuenow` — current value; `aria-valuemin` — minimum; `aria-valuemax` — maximum; `tabindex` — 0 unless disabled
- Keyboard:
  - <kbd>ArrowRight</kbd> / <kbd>ArrowUp</kbd>: Increase by one step.
  - <kbd>ArrowLeft</kbd> / <kbd>ArrowDown</kbd>: Decrease by one step.
  - <kbd>Home</kbd> / <kbd>End</kbd>: Jump to the minimum or maximum.
  - <kbd>PageUp</kbd> / <kbd>PageDown</kbd>: Move by a larger step.
- State changes:
  - On pointer down on the track, or drag the thumb, set the value from the pointer position, snapped to the step to within min and max.

## If you are unsure

Prefer emitting less. A plain `<button class="ml-button">` is correct; a
button with a variant this document does not list is not. When a component
needs behaviour, mark its root with `data-ml="<behaviour name>"` and let the
runtime attach, rather than writing event handlers that guess at the contract.
