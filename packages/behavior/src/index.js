/**
 * Mlola behavior: the library's interactions without a framework.
 *
 * Built to still work in ten years, which drove every choice here:
 *
 *   - Standard DOM only. No framework, no bundler, no transpiler. This file is
 *     a plain ES module and runs from a <script type="module"> as it is.
 *   - Progressive enhancement over ownership. Markup comes first, from React,
 *     Svelte, Rails, a Go template or a static file, and behavior attaches to
 *     it. Nothing here renders HTML, so nothing here can disagree with it.
 *   - Attribute driven, matching the contract the stylesheet already reads.
 *     Behavior sets the same data-* and aria-* the CSS reacts to.
 *   - Idempotent. Enhancing twice is a no-op, so it is safe to call after a
 *     framework re-render, a turbo navigation or an htmx swap.
 *
 * Mark a root with data-ml="<behavior>" and call enhance(), or call observe()
 * once and let new markup enhance itself.
 */

import {
  clampToStep,
  focusTrapIndex,
  percentOf,
  placeFloating,
  rovingIndex,
  sliderValueForKey,
  valueFromRatio,
} from "./interaction.js";
import { lockScroll } from "./document.js";

const ENHANCED = "__mlolaEnhanced";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function focusable(root) {
  return [...root.querySelectorAll(FOCUSABLE)].filter(
    (element) => element.offsetWidth > 0 || element.offsetHeight > 0 || element === document.activeElement,
  );
}

function on(target, type, handler, options) {
  target.addEventListener(type, handler, options);
  return () => target.removeEventListener(type, handler, options);
}

/** Element-shaped wrapper over the shared rovingIndex decision. */
function roving(items, index, key, options = {}) {
  return rovingIndex(items.length, index, key, {
    ...options,
    enabled: (at) =>
      !items[at].disabled && items[at].getAttribute("aria-disabled") !== "true",
  });
}

const behaviors = {
  accordion(root) {
    const multiple = root.dataset.mlMultiple === "true";
    const collapsible = root.dataset.mlCollapsible !== "false";
    const items = () => [...root.querySelectorAll(".ml-accordion-item")];
    const triggers = () => [...root.querySelectorAll(".ml-accordion-trigger")];

    const setOpen = (item, open) => {
      const trigger = item.querySelector(".ml-accordion-trigger");
      const panel = item.querySelector(".ml-accordion-panel");
      const state = open ? "open" : "closed";
      item.dataset.state = state;
      if (trigger) {
        trigger.dataset.state = state;
        trigger.setAttribute("aria-expanded", String(open));
      }
      if (panel) {
        panel.dataset.state = state;
        panel.hidden = !open;
      }
    };

    const toggle = (item) => {
      const open = item.dataset.state === "open";
      if (open && !collapsible) return;
      if (!multiple && !open) {
        for (const other of items()) if (other !== item) setOpen(other, false);
      }
      setOpen(item, !open);
    };

    return [
      on(root, "click", (event) => {
        const trigger = event.target.closest(".ml-accordion-trigger");
        if (trigger && root.contains(trigger)) toggle(trigger.closest(".ml-accordion-item"));
      }),
      on(root, "keydown", (event) => {
        const trigger = event.target.closest(".ml-accordion-trigger");
        if (!trigger) return;
        const all = triggers();
        const index = all.indexOf(trigger);
        const target = roving(all, index, event.key, { horizontal: false });
        if (target >= 0) {
          event.preventDefault();
          all[target].focus();
        }
      }),
    ];
  },

  tabs(root) {
    const horizontal = root.dataset.orientation !== "vertical";
    const triggers = () => [...root.querySelectorAll(".ml-tabs-trigger")];

    const select = (trigger) => {
      for (const other of triggers()) {
        const active = other === trigger;
        other.dataset.state = active ? "active" : "inactive";
        other.setAttribute("aria-selected", String(active));
        other.tabIndex = active ? 0 : -1;
        const panel = document.getElementById(other.getAttribute("aria-controls") ?? "");
        if (panel) {
          panel.dataset.state = active ? "active" : "inactive";
          panel.hidden = !active;
        }
      }
    };

    return [
      on(root, "click", (event) => {
        const trigger = event.target.closest(".ml-tabs-trigger");
        if (trigger && root.contains(trigger) && !trigger.disabled) select(trigger);
      }),
      on(root, "keydown", (event) => {
        const trigger = event.target.closest(".ml-tabs-trigger");
        if (!trigger) return;
        const all = triggers();
        const target = roving(all, all.indexOf(trigger), event.key, { horizontal });
        if (target < 0) return;
        event.preventDefault();
        all[target].focus();
        select(all[target]);
      }),
    ];
  },

  "dropdown-menu": (root) => {
    const trigger = root.querySelector(".ml-dropdown-trigger");
    const menu = root.querySelector(".ml-dropdown-menu");
    if (!trigger || !menu) return [];
    const items = () =>
      [...menu.querySelectorAll(".ml-dropdown-item")].filter(
        (item) => !item.disabled && item.getAttribute("aria-disabled") !== "true",
      );

    const setOpen = (open) => {
      root.dataset.state = open ? "open" : "closed";
      menu.dataset.state = open ? "open" : "closed";
      menu.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
      if (!open) for (const item of items()) delete item.dataset.highlighted;
    };
    const isOpen = () => root.dataset.state === "open";

    const highlight = (item) => {
      for (const other of items()) delete other.dataset.highlighted;
      if (item) {
        item.dataset.highlighted = "";
        item.focus();
      }
    };

    setOpen(false);

    return [
      on(trigger, "click", () => setOpen(!isOpen())),
      on(root, "keydown", (event) => {
        const all = items();
        if (event.key === "Escape") {
          setOpen(false);
          trigger.focus();
          return;
        }
        if (event.key === "Tab") {
          setOpen(false);
          return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (!isOpen()) {
            setOpen(true);
            highlight(all[event.key === "ArrowDown" ? 0 : all.length - 1]);
            return;
          }
          const current = all.findIndex((item) => "highlighted" in item.dataset);
          const target = roving(all, current, event.key, { horizontal: false });
          if (target >= 0) highlight(all[target]);
        }
      }),
      on(menu, "pointermove", (event) => {
        const item = event.target.closest(".ml-dropdown-item");
        if (item && items().includes(item)) highlight(item);
      }),
      on(document, "pointerdown", (event) => {
        if (isOpen() && !root.contains(event.target)) setOpen(false);
      }),
    ];
  },

  switch: (root) => {
    const set = (on_) => {
      root.setAttribute("aria-checked", String(on_));
      root.dataset.state = on_ ? "checked" : "unchecked";
    };
    if (!root.hasAttribute("aria-checked")) set(false);
    return [
      on(root, "click", () => set(root.getAttribute("aria-checked") !== "true")),
      on(root, "keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        set(root.getAttribute("aria-checked") !== "true");
      }),
    ];
  },

  /** Shared by modal and sheet: they differ only in which edge they sit on. */
  modal(root) {
    const closeOnEscape = root.dataset.mlEscape !== "false";
    const closeOnOverlay = root.dataset.mlOverlay !== "false";
    let opener = null;
    let releaseScroll = () => {};

    const overlay = () =>
      document.querySelector(`.ml-modal-overlay[data-ml-for="${root.id}"], .ml-sheet-overlay[data-ml-for="${root.id}"]`);

    const close = () => {
      root.dataset.state = "closed";
      root.hidden = true;
      const layer = overlay();
      if (layer) layer.hidden = true;
      releaseScroll();
      releaseScroll = () => {};
      if (opener && document.contains(opener)) opener.focus();
    };

    const open = (from) => {
      opener = from ?? document.activeElement;
      root.dataset.state = "open";
      root.hidden = false;
      const layer = overlay();
      if (layer) layer.hidden = false;
      releaseScroll();
      releaseScroll = lockScroll();
      (focusable(root)[0] ?? root).focus();
    };

    root.mlolaDialog = { open, close };

    return [
      on(document, "click", (event) => {
        const opener_ = event.target.closest(`[data-ml-opens="${root.id}"]`);
        if (opener_) {
          event.preventDefault();
          open(opener_);
          return;
        }
        if (root.querySelector(".ml-modal-close, .ml-sheet-close")?.contains(event.target)) close();
        if (closeOnOverlay && event.target === overlay()) close();
      }),
      on(document, "keydown", (event) => {
        if (root.hidden) return;
        if (event.key === "Escape" && closeOnEscape) {
          event.preventDefault();
          close();
          return;
        }
        if (event.key !== "Tab") return;
        const items = focusable(root);
        const target = focusTrapIndex(
          items.length,
          items.indexOf(document.activeElement),
          event.shiftKey,
        );
        if (target < 0) return;
        event.preventDefault();
        items[target].focus();
      }),
    ];
  },

  select(root) {
    const trigger = root.querySelector(".ml-select");
    const popover = root.querySelector(".ml-select-popover");
    const list = root.querySelector(".ml-select-list");
    if (!trigger || !popover || !list) return [];
    const multiple = list.getAttribute("aria-multiselectable") === "true";
    const options = () =>
      [...list.querySelectorAll(".ml-select-option")].filter(
        (option) => option.getAttribute("aria-disabled") !== "true",
      );

    // The listbox is fixed to the viewport so no overflow clips it, which
    // means it is placed beside the trigger here, and follows it while open.
    const place = () => {
      const rect = trigger.getBoundingClientRect();
      popover.style.minWidth = `${trigger.offsetWidth}px`;
      const at = placeFloating(
        { x: rect.left, y: rect.top, width: rect.width, height: rect.height },
        { width: popover.offsetWidth, height: popover.offsetHeight },
        { width: window.innerWidth, height: window.innerHeight },
        { side: "bottom", align: "start", offset: 6 },
      );
      popover.style.left = `${at.x}px`;
      popover.style.top = `${at.y}px`;
      popover.dataset.side = at.side;
    };
    let frame = 0;
    const follow = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (isOpen()) place();
      });
    };

    const setOpen = (open) => {
      trigger.dataset.state = open ? "open" : "closed";
      popover.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
      if (open) place();
      if (!open) {
        for (const option of options()) delete option.dataset.highlighted;
        trigger.removeAttribute("aria-activedescendant");
      }
    };
    const isOpen = () => trigger.dataset.state === "open";

    const highlight = (option) => {
      for (const other of options()) delete other.dataset.highlighted;
      if (!option) return;
      option.dataset.highlighted = "";
      if (option.id) trigger.setAttribute("aria-activedescendant", option.id);
    };

    const choose = (option) => {
      if (!option) return;
      const chosen = option.getAttribute("aria-selected") === "true";
      if (!multiple) {
        for (const other of options()) {
          other.setAttribute("aria-selected", "false");
          other.dataset.state = "unchecked";
        }
      }
      const next = multiple ? !chosen : true;
      option.setAttribute("aria-selected", String(next));
      option.dataset.state = next ? "checked" : "unchecked";
      const value = root.querySelector(".ml-select-value");
      if (value && !multiple) value.textContent = option.textContent.trim();
      if (!multiple) {
        setOpen(false);
        trigger.focus();
      }
    };

    setOpen(false);

    return [
      on(trigger, "click", () => setOpen(!isOpen())),
      on(list, "click", (event) => choose(event.target.closest(".ml-select-option"))),
      on(list, "pointermove", (event) => {
        const option = event.target.closest(".ml-select-option");
        if (option && options().includes(option)) highlight(option);
      }),
      on(root, "keydown", (event) => {
        const all = options();
        if (event.key === "Escape") {
          setOpen(false);
          trigger.focus();
          return;
        }
        if (event.key === "Tab") {
          setOpen(false);
          return;
        }
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (!isOpen()) {
            setOpen(true);
            highlight(all[event.key === "ArrowDown" ? 0 : all.length - 1]);
            return;
          }
          const current = all.findIndex((option) => "highlighted" in option.dataset);
          const target = roving(all, current, event.key, { horizontal: false });
          if (target >= 0) highlight(all[target]);
          return;
        }
        if (event.key === "Home" || event.key === "End") {
          if (!isOpen()) return;
          event.preventDefault();
          highlight(event.key === "Home" ? all[0] : all[all.length - 1]);
          return;
        }
        if (event.key === "Enter" || (event.key === " " && event.target !== root.querySelector(".ml-select-search"))) {
          event.preventDefault();
          if (!isOpen()) {
            setOpen(true);
            return;
          }
          choose(all.find((option) => "highlighted" in option.dataset));
        }
      }),
      on(document, "pointerdown", (event) => {
        if (isOpen() && !root.contains(event.target)) setOpen(false);
      }),
      on(window, "scroll", follow, true),
      on(window, "resize", follow),
      () => cancelAnimationFrame(frame),
    ];
  },

  slider(root) {
    const track = root.querySelector(".ml-slider-track");
    const range = root.querySelector(".ml-slider-range");
    const thumb = root.querySelector(".ml-slider-thumb");
    // The value lives on whichever element carries role="slider"; the React
    // build puts it on the control, hand-written markup often uses the thumb.
    const valued = root.querySelector('[role="slider"]');
    if (!track || !valued) return [];

    const bounds = () => ({
      min: Number(valued.getAttribute("aria-valuemin") ?? 0),
      max: Number(valued.getAttribute("aria-valuemax") ?? 100),
      step: Number(root.dataset.mlStep ?? 1),
    });
    const disabled = root.dataset.disabled !== undefined || valued.getAttribute("aria-disabled") === "true";
    const output = root.querySelector(".ml-slider-output");
    const current = () => Number(valued.getAttribute("aria-valuenow") ?? bounds().min);

    const set = (raw) => {
      const box = bounds();
      const next = clampToStep(raw, box);
      valued.setAttribute("aria-valuenow", String(next));
      const percent = percentOf(next, box);
      if (range) range.style.width = `${percent}%`;
      if (thumb) thumb.style.left = `${percent}%`;
      if (output) output.textContent = String(next);
      root.dispatchEvent(new CustomEvent("ml-change", { detail: { value: next }, bubbles: true }));
    };

    const fromPointer = (event) => {
      const box = track.getBoundingClientRect();
      if (!box.width) return current();
      return valueFromRatio((event.clientX - box.left) / box.width, bounds());
    };

    let dragging = false;

    return [
      on(track, "pointerdown", (event) => {
        if (disabled) return;
        dragging = true;
        track.setPointerCapture?.(event.pointerId);
        set(fromPointer(event));
        valued.focus();
      }),
      on(track, "pointermove", (event) => {
        if (dragging && !disabled) set(fromPointer(event));
      }),
      on(track, "pointerup", (event) => {
        dragging = false;
        track.releasePointerCapture?.(event.pointerId);
      }),
      on(valued, "keydown", (event) => {
        if (disabled) return;
        const next = sliderValueForKey(event.key, current(), bounds());
        if (next === undefined) return;
        event.preventDefault();
        set(next);
      }),
    ];
  },

  tooltip(root) {
    const tip = root.querySelector(".ml-tooltip");
    const trigger = root.firstElementChild;
    if (!tip || !trigger) return [];
    const delay = Number(root.dataset.mlDelay ?? 200);
    let timer = null;

    const show = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        tip.hidden = false;
        tip.dataset.state = "open";
        if (tip.id) trigger.setAttribute("aria-describedby", tip.id);
      }, Math.max(0, delay));
    };
    const hide = () => {
      clearTimeout(timer);
      tip.hidden = true;
      delete tip.dataset.state;
      trigger.removeAttribute("aria-describedby");
    };

    hide();

    return [
      on(root, "pointerenter", show),
      on(root, "pointerleave", hide),
      on(root, "focusin", show),
      on(root, "focusout", hide),
      on(document, "keydown", (event) => {
        if (event.key === "Escape") hide();
      }),
    ];
  },

  toast(root) {
    const timers = new Map();
    const durationOf = (toast) =>
      Number(toast.dataset.mlDuration ?? root.dataset.mlDuration ?? 5000);

    const dismiss = (toast) => {
      const timer = timers.get(toast);
      if (timer) clearTimeout(timer);
      timers.delete(toast);
      toast.remove();
      if (!root.querySelector(".ml-toast")) {
        root.dispatchEvent(new CustomEvent("ml-empty", { bubbles: true }));
      }
    };

    const schedule = (toast) => {
      if ("mlPaused" in toast.dataset) return;
      const duration = durationOf(toast);
      const existing = timers.get(toast);
      if (existing) clearTimeout(existing);
      if (!(duration > 0)) return;
      timers.set(
        toast,
        setTimeout(() => dismiss(toast), duration),
      );
    };

    const register = (toast) => {
      if (toast.dataset.mlEnhanced !== undefined) return;
      toast.dataset.mlEnhanced = "";
      schedule(toast);
    };

    const existing = () => [...root.querySelectorAll(".ml-toast")];
    if (!root.hasAttribute("role")) root.setAttribute("role", "region");
    for (const toast of existing()) register(toast);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          const added = node.matches?.(".ml-toast")
            ? [node, ...node.querySelectorAll(".ml-toast")]
            : [...node.querySelectorAll(".ml-toast")];
          for (const toast of added) register(toast);
        }
      }
    });
    observer.observe(root, { childList: true, subtree: true });

    return [
      on(root, "click", (event) => {
        const toast = event.target.closest(".ml-toast");
        if (!toast || !root.contains(toast)) return;
        if (event.target.closest(".ml-toast-close")) {
          event.preventDefault();
          dismiss(toast);
        }
      }),
      on(root, "pointerenter", (event) => {
        const toast = event.target.closest(".ml-toast");
        if (toast) { toast.dataset.mlPaused = ""; schedule(toast); }
      }, true),
      on(root, "pointerleave", (event) => {
        const toast = event.target.closest(".ml-toast");
        if (toast) { delete toast.dataset.mlPaused; schedule(toast); }
      }, true),
      on(root, "focusin", (event) => {
        const toast = event.target.closest(".ml-toast");
        if (toast) { toast.dataset.mlPaused = ""; schedule(toast); }
      }),
      on(root, "focusout", (event) => {
        const toast = event.target.closest(".ml-toast");
        if (toast) { delete toast.dataset.mlPaused; schedule(toast); }
      }),
      () => {
        observer.disconnect();
        for (const timer of timers.values()) clearTimeout(timer);
      },
    ];
  },
};

// A modal and a sheet differ only in which edge the panel sits on, so they
// share one implementation rather than drifting apart.
behaviors.sheet = behaviors.modal;

/** Attach behavior to every marked root inside `scope`. Safe to call again. */
export function enhance(scope = document) {
  const roots = [
    ...(scope.matches?.("[data-ml]") ? [scope] : []),
    ...scope.querySelectorAll("[data-ml]"),
  ];
  let count = 0;
  for (const root of roots) {
    if (root[ENHANCED]) continue;
    const behavior = behaviors[root.dataset.ml];
    if (!behavior) continue;
    const teardown = behavior(root) ?? [];
    root[ENHANCED] = () => {
      for (const off of teardown) off();
      delete root[ENHANCED];
    };
    count += 1;
  }
  return count;
}

/** Undo enhancement, for hot reloads and tests. */
export function destroy(scope = document) {
  for (const root of scope.querySelectorAll("[data-ml]")) root[ENHANCED]?.();
}

/** Enhance now and keep enhancing markup added later. Returns a stop function. */
export function observe(scope = document) {
  enhance(scope);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === 1) enhance(node);
      }
    }
  });
  observer.observe(scope === document ? document.documentElement : scope, {
    childList: true,
    subtree: true,
  });
  return () => observer.disconnect();
}

export { behaviors };
