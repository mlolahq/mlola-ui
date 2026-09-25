/**
 * What a renderer must *do*, as data.
 *
 * The stylesheet says what an attribute looks like; this says when to set it.
 * Kept as plain data so it can be read by a human implementing the library in
 * Svelte, Vue, Rails or a Go template, by the framework-free runtime in
 * packages/behavior, and by the audit that proves the two agree.
 *
 * Components built on native form controls are deliberately absent: checkbox
 * and radio are real inputs, so the browser already owns their behaviour and
 * nothing here can rot. Only the indeterminate flag on a checkbox needs script,
 * because HTML exposes it as a property rather than an attribute.
 */
export const behaviors = {
  accordion: {
    summary: "Disclosure list. One panel open at a time, or several.",
    root: "ml-accordion",
    parts: {
      item: "ml-accordion-item",
      trigger: "ml-accordion-trigger",
      panel: "ml-accordion-panel",
    },
    state: { "data-state": ["open", "closed"] },
    aria: {
      trigger: {
        role: "button (a real <button> is preferred)",
        "aria-expanded": "true when the item is open",
        "aria-controls": "id of the panel",
      },
      panel: { role: "region", "aria-labelledby": "id of the trigger" },
    },
    keyboard: [
      { keys: ["Enter", "Space"], does: "Toggle the focused item." },
      { keys: ["ArrowDown", "ArrowUp"], does: "Move focus between triggers." },
      { keys: ["Home", "End"], does: "Focus the first or last trigger." },
    ],
    transitions: [
      {
        on: "click or activate a trigger",
        set: "data-state on the item, trigger and panel",
        to: "open, or closed when it was open and collapsing is allowed",
        also: "hide the closed panel from the accessibility tree",
      },
    ],
    options: {
      multiple: "Allow more than one open item.",
      collapsible: "Allow closing the last open item. Default true.",
    },
  },

  tabs: {
    summary: "One panel visible at a time, selected by a tab strip.",
    root: "ml-tabs",
    parts: {
      list: "ml-tabs-list",
      trigger: "ml-tabs-trigger",
      content: "ml-tabs-content",
    },
    state: { "data-state": ["active", "inactive"], "data-orientation": ["horizontal", "vertical"] },
    aria: {
      list: { role: "tablist", "aria-orientation": "matches data-orientation" },
      trigger: {
        role: "tab",
        "aria-selected": "true on the active tab",
        "aria-controls": "id of the panel",
        tabindex: "0 on the active tab, -1 on the rest",
      },
      content: { role: "tabpanel", "aria-labelledby": "id of the tab" },
    },
    keyboard: [
      {
        keys: ["ArrowRight", "ArrowLeft"],
        does: "Move to the next or previous enabled tab when horizontal, wrapping around.",
      },
      { keys: ["ArrowDown", "ArrowUp"], does: "The same when vertical." },
      { keys: ["Home", "End"], does: "Move to the first or last enabled tab." },
    ],
    transitions: [
      {
        on: "select a tab by pointer or key",
        set: "data-state and aria-selected on triggers, data-state on panels",
        to: "active for the chosen pair, inactive for the rest",
        also: "move focus to the newly selected tab",
      },
    ],
    notes: "Selection follows focus. Disabled tabs are skipped, never focused.",
  },

  "dropdown-menu": {
    summary: "A menu anchored to a trigger.",
    root: "ml-dropdown",
    parts: {
      trigger: "ml-dropdown-trigger",
      menu: "ml-dropdown-menu",
      item: "ml-dropdown-item",
    },
    state: { "data-align": ["start", "end"] },
    signals: { "data-state": ["open", "closed"], "data-highlighted": ["present on the active item"] },
    aria: {
      trigger: { "aria-haspopup": "menu", "aria-expanded": "true while open" },
      menu: { role: "menu" },
      item: { role: "menuitem", "data-highlighted": "present on the active item" },
    },
    keyboard: [
      { keys: ["ArrowDown", "ArrowUp"], does: "Open the menu, then move the highlight." },
      { keys: ["Enter", "Space"], does: "Activate the highlighted item." },
      { keys: ["Escape"], does: "Close and return focus to the trigger." },
      { keys: ["Tab"], does: "Close without activating." },
    ],
    transitions: [
      { on: "click the trigger", set: "data-state", to: "open or closed" },
      { on: "pointer over an item", set: "data-highlighted", to: "that item only" },
      { on: "pointer down outside the root", set: "data-state", to: "closed" },
    ],
    notes: "Disabled items are skipped by the highlight and cannot be activated.",
  },

  select: {
    summary: "A listbox behind a combobox trigger.",
    root: "ml-select-root",
    parts: {
      trigger: "ml-select",
      popover: "ml-select-popover",
      list: "ml-select-list",
      option: "ml-select-option",
      search: "ml-select-search",
    },
    state: { "data-state": ["open", "closed", "checked", "unchecked"] },
    aria: {
      trigger: {
        role: "combobox",
        "aria-expanded": "true while open",
        "aria-controls": "id of the listbox",
        "aria-activedescendant": "id of the highlighted option while open",
      },
      list: { role: "listbox", "aria-multiselectable": "true when multiple" },
      option: {
        role: "option",
        "aria-selected": "true when chosen",
        "data-highlighted": "present on the active option",
      },
    },
    keyboard: [
      { keys: ["ArrowDown", "ArrowUp"], does: "Open, then move the highlight past disabled options." },
      { keys: ["Enter", "Space"], does: "Choose the highlighted option. Space types when a search field has focus." },
      { keys: ["Home", "End"], does: "Highlight the first or last enabled option." },
      { keys: ["Escape"], does: "Close and return focus to the trigger." },
      { keys: ["Tab"], does: "Close without choosing." },
    ],
    transitions: [
      {
        on: "choose an option",
        set: "aria-selected and data-state on options",
        to: "checked for the chosen option",
        also: "single select closes and restores focus; multiple select stays open",
      },
    ],
    options: { multiple: "Toggle several values and keep the list open." },
  },

  modal: {
    summary: "A dialog over the page that owns focus while open.",
    root: "ml-modal",
    parts: { overlay: "ml-modal-overlay", close: "ml-modal-close" },
    state: { "data-size": ["sm", "md", "lg", "xl", "full"] },
    signals: { "data-state": ["open", "closed"] },
    aria: {
      root: {
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "id of the title, or aria-label",
      },
    },
    keyboard: [
      { keys: ["Escape"], does: "Close, unless closing on Escape is disabled." },
      { keys: ["Tab", "Shift+Tab"], does: "Cycle focus inside the dialog and never leave it." },
    ],
    transitions: [
      { on: "open", set: "focus", to: "the first focusable element inside", also: "lock page scroll" },
      { on: "close", set: "focus", to: "the element that opened the dialog", also: "release page scroll" },
      { on: "pointer down on the backdrop", set: "closed", to: "unless closing on backdrop is disabled" },
    ],
  },

  sheet: {
    summary: "A dialog anchored to one edge of the viewport.",
    root: "ml-sheet-panel",
    parts: { overlay: "ml-sheet-overlay", close: "ml-sheet-close" },
    state: {
      "data-side": ["left", "right", "top", "bottom"],
      "data-size": ["sm", "md", "lg"],
    },
    signals: { "data-state": ["open", "closed"] },
    aria: { root: { role: "dialog", "aria-modal": "true" } },
    keyboard: [
      { keys: ["Escape"], does: "Close, unless closing on Escape is disabled." },
      { keys: ["Tab", "Shift+Tab"], does: "Cycle focus inside the panel." },
    ],
    transitions: [
      { on: "open", set: "focus", to: "inside the panel", also: "lock page scroll" },
      { on: "close", set: "focus", to: "the trigger", also: "release page scroll" },
    ],
    notes: "Identical to modal apart from which edge it is anchored to.",
  },

  tooltip: {
    summary: "A short label shown on hover or focus.",
    root: "ml-tooltip-root",
    parts: { tooltip: "ml-tooltip", arrow: "ml-tooltip-arrow" },
    state: { "data-side": ["top", "right", "bottom", "left"] },
    signals: { "data-state": ["open"] },
    aria: {
      tooltip: { role: "tooltip" },
      trigger: { "aria-describedby": "id of the tooltip while it is open" },
    },
    keyboard: [{ keys: ["Escape"], does: "Hide the tooltip." }],
    transitions: [
      { on: "pointer enter or focus the trigger", set: "visible", to: "after the delay" },
      { on: "pointer leave or blur", set: "hidden", to: "immediately, cancelling any pending delay" },
    ],
    notes: "Never put essential information or interactive content in a tooltip.",
  },

  toast: {
    summary: "Transient messages in a live region.",
    root: "ml-toaster",
    parts: { toast: "ml-toast", action: "ml-toast-action", close: "ml-toast-close" },
    state: {
      "data-tone": ["neutral", "info", "success", "warning", "danger"],
      "data-position": ["top-right", "top-center", "bottom-right", "bottom-center"],
    },
    aria: {
      root: { role: "region", "aria-label": "distinct per region, so several are distinguishable" },
      toast: {
        role: "status for ordinary messages, alert for danger and warning",
        "aria-live": "polite, or assertive for danger and warning",
        "aria-busy": "true while it waits on work (a loading toast)",
      },
    },
    keyboard: [{ keys: ["Tab"], does: "Reach the action and dismiss controls." }],
    transitions: [
      { on: "push", set: "a toast into the region matching its position", to: "visible" },
      { on: "duration elapsed", set: "removed", to: "unless the duration is zero" },
    ],
  },

  switch: {
    summary: "An on/off control that is not a native checkbox.",
    root: "ml-toggle",
    parts: { thumb: "ml-toggle-thumb" },
    state: { "data-state": ["checked", "unchecked"], "data-size": ["sm", "md", "lg"] },
    aria: { root: { role: "switch", "aria-checked": "true or false" } },
    keyboard: [{ keys: ["Enter", "Space"], does: "Toggle." }],
    transitions: [{ on: "activate", set: "aria-checked and data-state", to: "the opposite value" }],
    notes: "Prefer a native checkbox unless the control genuinely reads as a switch.",
  },

  slider: {
    summary: "A single value chosen from a range.",
    root: "ml-slider-field",
    parts: {
      control: "ml-slider",
      track: "ml-slider-track",
      range: "ml-slider-range",
      thumb: "ml-slider-thumb",
    },
    state: { "data-size": ["sm", "md"] },
    aria: {
      thumb: {
        role: "slider",
        "aria-valuenow": "current value",
        "aria-valuemin": "minimum",
        "aria-valuemax": "maximum",
        tabindex: "0 unless disabled",
      },
    },
    keyboard: [
      { keys: ["ArrowRight", "ArrowUp"], does: "Increase by one step." },
      { keys: ["ArrowLeft", "ArrowDown"], does: "Decrease by one step." },
      { keys: ["Home", "End"], does: "Jump to the minimum or maximum." },
      { keys: ["PageUp", "PageDown"], does: "Move by a larger step." },
    ],
    transitions: [
      {
        on: "pointer down on the track, or drag the thumb",
        set: "the value from the pointer position, snapped to the step",
        to: "within min and max",
      },
    ],
  },
};
