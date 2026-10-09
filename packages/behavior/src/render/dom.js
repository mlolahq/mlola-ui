/**
 * Mlola Render without a framework: draws the surfaces an agent composed into
 * an element, as the markup of the Mlola components the catalog names, and
 * lets the runtime's behaviors (tabs, accordion, select, slider, switch)
 * attach to it.
 *
 *   import { mountRender } from "@mlola-ui/behavior/render";
 *   import rules from "@mlola-ui/behavior/render/rules";
 *   const view = mountRender(document.querySelector("#agent-ui"), { rules, onAction: send });
 *   view.receive(messagesFromTheAgent);
 *
 * It draws from the same host as the React renderer (core.js), so a binding,
 * a template, an action or a refused update means the same in both. What
 * the agent wrote is only ever set as text or as an attribute; nothing it
 * sends is parsed as markup.
 *
 * A date field is the browser's own (<input type="date">), as a Mlola input:
 * the calendar of the React renderer's Date Picker is React's.
 */

import { enhance } from "../index.js";
import { createRenderHost, isBinding } from "./core.js";
import GLYPHS from "./glyphs.js";

export { createRenderHost } from "./core.js";

const LABELS = {
  required: "Fill in this field.",
  missing: (fields) => `Fill in ${fields.join(", ")} first.`,
  yes: "Yes",
  no: "No",
};

const text = (value) => (value === undefined || value === null ? "" : String(value));
const present = (value) => value !== undefined && value !== null && value !== "";
const domId = (base, key) => `${base}-${Array.from(key, (character) => (/[A-Za-z0-9_-]/.test(character) ? character : `_${character.codePointAt(0)?.toString(16)}`)).join("")}`;
let mounted = 0;

/** An element with attributes (null and false leave one out) and children (strings become text). */
function h(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === false) continue;
    element.setAttribute(name, value === true ? "" : String(value));
  }
  for (const child of children.flat()) if (child !== null && child !== undefined && child !== false) element.append(child);
  return element;
}

/** A glyph from the icons package (glyphs.js, generated): markup Mlola wrote, never the agent. */
function glyph(name, className) {
  const holder = document.createElement("span");
  holder.innerHTML = GLYPHS[name];
  const svg = holder.firstElementChild;
  if (className) svg.classList.add(className);
  return svg;
}

/**
 * Draws Mlola Render surfaces into `element`. Options: `rules` (required),
 * `onAction(message, extra)`, `onError(messages)`, `theme` ("surface", the
 * agent's theme, or "inherit"), `labels`, `surfaceId` to draw only one, and
 * `host` to draw from a host you keep. Returns { host, receive, destroy }.
 */
export function mountRender(element, options = {}) {
  const host = options.host ?? createRenderHost(options.rules, { onAction: options.onAction, onError: options.onError });
  const labels = { ...LABELS, ...options.labels };
  const base = `ml-render-${(mounted += 1)}`;
  const root = h("div", { class: "ml-render" });
  const notice = h("p", { role: "status", class: "ml-visually-hidden" });
  root.append(notice);
  element.append(root);
  /** surfaceId → { node, structure, lists, updaters } */
  const drawn = new Map();
  // "system" follows the reader's setting; a host that knows it better (an app inside a chat) says so.
  const modeOf = (theme) => (theme.mode === "system" && options.systemMode ? options.systemMode : theme.mode);

  function render() {
    const wanted = options.surfaceId ? (host.surface(options.surfaceId) ? [options.surfaceId] : []) : host.surfaces();
    for (const [id, entry] of drawn) {
      if (!wanted.includes(id)) {
        entry.node.remove();
        drawn.delete(id);
      }
    }
    if (options.streaming) root.setAttribute("aria-busy", "true");
    else root.removeAttribute("aria-busy");
    for (const id of wanted) {
      const entry = drawn.get(id);
      if (entry && entry.structure === host.structure(id) && entry.lists.every((list) => list.count() === list.length)) {
        for (const update of entry.updaters) update();
        continue;
      }
      const fresh = build(id, entry);
      if (entry) entry.node.replaceWith(fresh.node);
      else root.insertBefore(fresh.node, notice);
      drawn.set(id, fresh);
      enhance(fresh.node);
      restore(fresh.node, fresh.kept);
    }
    // Surfaces in the order they were opened; a node already in its place is left there, since moving one drops focus.
    let before = notice;
    for (const id of [...wanted].reverse()) {
      const node = drawn.get(id).node;
      if (node.nextSibling !== before) root.insertBefore(node, before);
      before = node;
    }
  }

  /** What a person was in the middle of, kept across a rebuild: focus, the caret, the open tab and sections. */
  function keep(node) {
    const active = node.contains(document.activeElement) ? document.activeElement : null;
    return {
      focus: active?.id ?? null,
      selection: active && "selectionStart" in active ? [active.selectionStart, active.selectionEnd] : null,
      tabs: [...node.querySelectorAll('.ml-tabs-trigger[aria-selected="true"]')].map((tab) => tab.id),
      open: [...node.querySelectorAll('.ml-accordion-item[data-state="open"] .ml-accordion-trigger')].map((trigger) => trigger.id),
    };
  }

  function restore(node, kept) {
    if (!kept) return;
    for (const id of kept.tabs) document.getElementById(id)?.click();
    for (const trigger of node.querySelectorAll(".ml-accordion-trigger")) {
      if (kept.open.includes(trigger.id) !== (trigger.getAttribute("aria-expanded") === "true")) trigger.click();
    }
    const focused = kept.focus ? document.getElementById(kept.focus) : null;
    if (focused) {
      focused.focus();
      if (kept.selection && "setSelectionRange" in focused) {
        try {
          focused.setSelectionRange(...kept.selection);
        } catch {
          // An input type with no caret (a date, a checkbox) keeps none.
        }
      }
    }
  }

  function build(surfaceId, previous) {
    const kept = previous ? keep(previous.node) : null;
    const surface = host.surface(surfaceId);
    const themed = options.theme === "inherit" ? null : surface.theme;
    const node = h("div", { class: "ml-render-surface", "data-surface": surfaceId, "data-theme": themed?.name, "data-mode": themed ? modeOf(themed) : null, "data-themed": themed ? true : null });
    const context = { surfaceId, base: `${base}-${surfaceId}`, updaters: [], lists: [] };
    node.append(...draw(context, { id: "root", scope: "", key: "root@" }));
    return { node, structure: host.structure(surfaceId), lists: context.lists, updaters: context.updaters, kept };
  }

  /** The children of a component, a template expanded; its item count is remembered so a longer list rebuilds. */
  function children(context, id, scope) {
    const node = host.component(context.surfaceId, id);
    const instances = host.children(context.surfaceId, id, scope);
    if (node && !Array.isArray(node.props.children) && node.props.children) {
      context.lists.push({ length: instances.length, count: () => host.children(context.surfaceId, id, scope).length });
    }
    return instances;
  }

  function press(surfaceId, componentId, scope) {
    const { missing } = host.press(surfaceId, componentId, scope);
    notice.textContent = missing.length ? labels.missing(missing.map((field) => text(field.label))) : "";
    if (!missing.length) return;
    const first = document.getElementById(domId(`${base}-${surfaceId}`, missing[0].key));
    (first?.matches("input, textarea, button, [tabindex]") ? first : first?.querySelector("input, textarea, button, [tabindex]"))?.focus();
  }

  /** One instance of a component as elements. */
  function draw(context, instance) {
    const { surfaceId, updaters } = context;
    const { id, scope, key } = instance;
    const node = host.component(surfaceId, id);
    if (!node) return [];
    const props = node.props;
    const read = (value) => host.read(surfaceId, value, scope);
    const write = (binding, value) => host.write(surfaceId, binding, value, scope);
    const fieldId = domId(context.base, key);
    /** Sets something now and again whenever the data model changes. */
    const bind = (apply) => {
      apply();
      updaters.push(apply);
    };
    const words = (element, value) => {
      bind(() => {
        element.textContent = text(read(value));
      });
      return element;
    };
    const inside = () => children(context, id, scope).flatMap((child) => draw(context, child));
    const accessible = props.accessibility ?? {};
    const named = (element) => {
      bind(() => {
        const label = text(read(accessible.label));
        const description = text(read(accessible.description));
        if (label) element.setAttribute("aria-label", label);
        else element.removeAttribute("aria-label");
        if (description) element.setAttribute("aria-description", description);
        else element.removeAttribute("aria-description");
      });
      return element;
    };
    // A container with a name of its own is a group; without one it is only layout.
    const group = (element) => {
      if (accessible.label === undefined) return element;
      element.setAttribute("role", "group");
      return named(element);
    };
    /** Options the data model holds: a different set rebuilds the field, as a longer list does. */
    const optionsOf = () => (Array.isArray(read(props.options)) ? read(props.options).filter((option) => typeof option?.label === "string" && typeof option?.value === "string" && option.value) : []);
    const watchOptions = () => {
      if (!isBinding(props.options)) return;
      const signature = () => JSON.stringify(optionsOf());
      context.lists.push({ length: signature(), count: signature });
    };
    const disabled = () => read(props.disabled) === true;
    const required = () => read(props.required) === true;
    /** A field's error, shown while a required field kept an action back. */
    const errorFor = (field, control) => {
      const error = h("p", { id: `${fieldId}-error`, role: "alert", class: "ml-input-error", hidden: true });
      bind(() => {
        const missing = host.missing(surfaceId, id, scope);
        error.hidden = !missing;
        error.textContent = missing ? labels.required : "";
        field.toggleAttribute("data-invalid", missing);
        if (missing) control.setAttribute("aria-invalid", "true");
        else control.removeAttribute("aria-invalid");
        const described = [present(props.hint) ? `${fieldId}-hint` : null, missing ? `${fieldId}-error` : null].filter(Boolean).join(" ");
        if (described) control.setAttribute("aria-describedby", described);
        else control.removeAttribute("aria-describedby");
      });
      return error;
    };
    const fieldLabel = (forId) => {
      const label = h("label", { id: `${forId}-label`, for: forId, class: "ml-input-label" });
      const words_ = document.createTextNode("");
      const mark = h("span", { "aria-hidden": "true", class: "ml-required-mark" }, "*");
      label.append(words_);
      bind(() => {
        words_.textContent = text(read(props.label));
        if (required()) label.append(mark);
        else mark.remove();
      });
      return label;
    };
    const hint = () => (present(props.hint) ? words(h("p", { id: `${fieldId}-hint`, class: "ml-input-hint" }), props.hint) : null);
    /** A text control bound to the data model, or holding its literal. */
    const textControl = (control) => {
      if (isBinding(props.value)) {
        bind(() => {
          const value = text(read(props.value));
          if (control.value !== value) control.value = value;
        });
        control.addEventListener("input", () => write(props.value, control.value));
      } else control.value = text(props.value);
      bind(() => {
        control.disabled = disabled();
        control.required = required();
      });
      return control;
    };

    switch (node.type) {
      case "Stack":
        return [group(h("div", { class: "ml-stack" }, inside()))];
      case "Row":
        return [group(h("div", { class: "ml-cluster" }, inside()))];
      case "Grid":
        return [group(h("div", { class: "ml-grid", "data-columns": props.columns }, inside()))];
      case "Heading":
        return [words(h(`h${props.level ?? 2}`), props.text)];
      case "Text":
        return [words(h("p", { class: "ml-render-text" }), props.text)];
      case "Card":
        return [group(h("div", { class: "ml-card", "data-variant": props.variant ?? "default" }, h("div", { class: "ml-card-content ml-stack" }, inside())))];
      case "Alert": {
        const tone = props.tone ?? "neutral";
        return [
          h(
            "div",
            { class: "ml-alert", role: tone === "danger" || tone === "warning" ? "alert" : "status", "data-tone": tone, "data-variant": props.variant ?? "card", "data-state": "open" },
            h("span", { "aria-hidden": "true", class: "ml-alert-icon" }, glyph(tone === "neutral" ? "info" : tone)),
            h("div", { class: "ml-alert-content" }, props.title !== undefined ? words(h("p", { class: "ml-alert-title" }), props.title) : null, words(h("div", { class: "ml-alert-description" }), props.text)),
          ),
        ];
      }
      case "EmptyState": {
        const actions = props.children !== undefined ? inside() : [];
        return [
          h(
            "section",
            { class: "ml-empty", "data-size": props.size ?? "inline" },
            words(h(`h${host.headingLevel(surfaceId, id)}`, { class: "ml-empty-title" }), props.title),
            props.description !== undefined ? words(h("p", { class: "ml-empty-description" }), props.description) : null,
            actions.length ? h("div", { class: "ml-empty-actions" }, actions) : null,
          ),
        ];
      }
      case "Tabs": {
        const tabs = children(context, id, scope);
        if (!tabs.length) return [];
        const list = h("div", { class: "ml-tabs-list", role: "tablist", "aria-orientation": "horizontal" });
        bind(() => list.setAttribute("aria-label", text(read(props.label))));
        const panels = [];
        for (const [index, tab] of tabs.entries()) {
          const tabId = domId(context.base, `${tab.key}-tab`);
          const panelId = domId(context.base, `${tab.key}-panel`);
          const active = index === 0;
          const trigger = h("button", { class: "ml-tabs-trigger", id: tabId, type: "button", role: "tab", "aria-selected": String(active), "aria-controls": panelId, tabindex: active ? "0" : "-1", "data-state": active ? "active" : "inactive" });
          bind(() => {
            trigger.textContent = text(host.read(surfaceId, host.component(surfaceId, tab.id)?.props.label, tab.scope));
          });
          list.append(trigger);
          panels.push(h("div", { class: "ml-tabs-content ml-stack", id: panelId, role: "tabpanel", "aria-labelledby": tabId, tabindex: "0", hidden: !active, "data-state": active ? "active" : "inactive" }, children(context, tab.id, tab.scope).flatMap((child) => draw(context, child))));
        }
        return [h("div", { class: "ml-tabs", "data-ml": "tabs", "data-variant": props.variant ?? "default", "data-orientation": "horizontal" }, list, panels)];
      }
      case "Accordion": {
        const level = host.headingLevel(surfaceId, id);
        const sections = children(context, id, scope).map((section) => {
          const triggerId = domId(context.base, `${section.key}-trigger`);
          const panelId = domId(context.base, `${section.key}-panel`);
          const label = h("span", { class: "ml-accordion-trigger-label" });
          bind(() => {
            label.textContent = text(host.read(surfaceId, host.component(surfaceId, section.id)?.props.title, section.scope));
          });
          return h(
            "div",
            { class: "ml-accordion-item", "data-state": "closed" },
            h(`h${level}`, { class: "ml-accordion-heading" }, h("button", { class: "ml-accordion-trigger", id: triggerId, type: "button", "aria-expanded": "false", "aria-controls": panelId, "data-state": "closed" }, label, glyph("chevron", "ml-accordion-chevron"))),
            h("div", { class: "ml-accordion-panel", id: panelId, role: "region", "aria-labelledby": triggerId, "data-state": "closed", hidden: true }, h("div", { class: "ml-accordion-panel-inner ml-stack" }, children(context, section.id, section.scope).flatMap((child) => draw(context, child)))),
          );
        });
        return [h("div", { class: "ml-accordion", "data-ml": "accordion", "data-ml-multiple": props.type === "multiple" ? "true" : null }, sections)];
      }
      case "Tab":
      case "AccordionItem":
        return [];
      case "Input":
      case "DatePicker": {
        const control = textControl(h("input", { class: "ml-input", id: fieldId, type: node.type === "DatePicker" ? "date" : (props.type ?? "text"), "data-variant": props.variant ?? "default", "data-size": props.size ?? "md", maxlength: node.type === "Input" ? host.rules.limits.textLength : null, min: props.min, max: props.max }));
        if (node.type === "DatePicker" && isBinding(props.value)) control.addEventListener("change", () => write(props.value, control.value || null));
        bind(() => {
          const placeholder = text(read(props.placeholder));
          if (placeholder) control.setAttribute("placeholder", placeholder);
          else control.removeAttribute("placeholder");
        });
        const field = h("div", { class: "ml-input-field" });
        field.append(fieldLabel(fieldId), h("div", { class: "ml-input-control" }, control), ...[hint()].filter(Boolean), errorFor(field, control));
        return [field];
      }
      case "Textarea": {
        const control = textControl(h("textarea", { class: "ml-textarea", id: fieldId, rows: props.rows ?? 4, maxlength: host.rules.limits.textLength }));
        bind(() => {
          const placeholder = text(read(props.placeholder));
          if (placeholder) control.setAttribute("placeholder", placeholder);
          else control.removeAttribute("placeholder");
        });
        const field = h("div", { class: "ml-input-field" });
        field.append(fieldLabel(fieldId), control, ...[hint()].filter(Boolean), errorFor(field, control));
        return [field];
      }
      case "Select": {
        const labelId = `${fieldId}-label`;
        const listId = `${fieldId}-list`;
        const value = h("span", { class: "ml-select-value" });
        const trigger = h("button", { class: "ml-select", id: fieldId, type: "button", role: "combobox", "aria-haspopup": "listbox", "aria-expanded": "false", "aria-controls": listId, "aria-labelledby": labelId, "data-size": props.size ?? "md", "data-state": "closed" }, value, glyph("chevron", "ml-select-chevron"));
        const list = h("ul", { class: "ml-select-list", id: listId, role: "listbox", "aria-labelledby": labelId });
        watchOptions();
        for (const [index, option] of optionsOf().entries()) list.append(h("li", { class: "ml-select-option", id: `${fieldId}-option-${index}`, role: "option", "data-value": option.value, "aria-selected": "false", "data-state": "unchecked" }, option.label));
        const root_ = h("div", { class: "ml-select-root", "data-ml": "select" }, words(h("span", { class: "ml-select-label", id: labelId }), props.label), h("div", { class: "ml-select-control" }, trigger), h("div", { class: "ml-select-popover" }, list));
        bind(() => {
          const current = text(read(props.value));
          const chosen = optionsOf().find((option) => option.value === current);
          value.textContent = chosen ? chosen.label : text(read(props.placeholder)) || " ";
          value.toggleAttribute("data-placeholder", !chosen);
          for (const item of list.children) {
            const on = item.dataset.value === current;
            item.setAttribute("aria-selected", String(on));
            item.dataset.state = on ? "checked" : "unchecked";
          }
          trigger.disabled = disabled();
          if (required()) trigger.setAttribute("aria-required", "true");
          else trigger.removeAttribute("aria-required");
        });
        if (isBinding(props.value)) root_.addEventListener("ml-change", (event) => write(props.value, event.detail.value));
        root_.append(errorFor(root_, trigger));
        return [root_];
      }
      case "RadioGroup": {
        const labelId = `${fieldId}-label`;
        watchOptions();
        const options = optionsOf();
        const inputs = options.map((option, index) => h("input", { class: "ml-radio-input", id: `${fieldId}-${index}`, type: "radio", name: fieldId, value: option.value }));
        const items = options.map((option, index) => h("label", { class: "ml-radio-item", for: `${fieldId}-${index}`, "data-state": "unchecked" }, h("span", { class: "ml-radio-control" }, inputs[index], h("span", { class: "ml-radio-indicator", "aria-hidden": "true" })), h("span", { class: "ml-radio-copy" }, h("span", { class: "ml-radio-label" }, option.label))));
        const orientation = props.orientation ?? "vertical";
        const groupElement = h("div", { class: "ml-radio-group", id: fieldId, role: "radiogroup", "aria-labelledby": labelId, "aria-orientation": orientation, "data-orientation": orientation }, words(h("div", { class: "ml-radio-group-label", id: labelId }), props.label), h("div", { class: "ml-radio-group-items" }, items));
        let own = text(props.value);
        bind(() => {
          const current = isBinding(props.value) ? text(read(props.value)) : own;
          for (const [index, input] of inputs.entries()) {
            input.checked = input.value === current;
            input.disabled = disabled();
            items[index].dataset.state = input.checked ? "checked" : "unchecked";
          }
          if (required()) groupElement.setAttribute("aria-required", "true");
          else groupElement.removeAttribute("aria-required");
        });
        for (const input of inputs) {
          input.addEventListener("change", () => {
            if (isBinding(props.value)) write(props.value, input.value);
            else {
              own = input.value;
              for (const update of updaters) update();
            }
          });
        }
        groupElement.append(errorFor(groupElement, groupElement));
        return [groupElement];
      }
      case "Checkbox": {
        const input = h("input", { class: "ml-checkbox-input", id: fieldId, type: "checkbox" });
        const copy = h("span", { class: "ml-checkbox-copy" }, h("label", { class: "ml-checkbox-label", for: fieldId }, words(h("span", { class: "ml-checkbox-text" }), props.label)), props.description !== undefined ? words(h("span", { class: "ml-checkbox-description", id: `${fieldId}-description` }), props.description) : null);
        const field = h("div", { class: "ml-checkbox-field", "data-state": "unchecked" }, h("label", { class: "ml-checkbox-control", "data-hit": "expand" }, input, h("span", { class: "ml-checkbox-indicator", "aria-hidden": "true" }, glyph("check"))), copy);
        if (!isBinding(props.checked)) input.checked = props.checked === true;
        bind(() => {
          if (isBinding(props.checked)) input.checked = read(props.checked) === true;
          input.disabled = disabled();
          input.required = required();
          field.dataset.state = input.checked ? "checked" : "unchecked";
        });
        input.addEventListener("change", () => {
          if (isBinding(props.checked)) write(props.checked, input.checked);
          field.dataset.state = input.checked ? "checked" : "unchecked";
        });
        field.append(errorFor(field, input));
        return [field];
      }
      case "Switch": {
        const labelId = `${fieldId}-label`;
        const toggle = h("button", { class: "ml-toggle", id: fieldId, type: "button", role: "switch", "data-ml": "switch", "aria-checked": String(isBinding(props.checked) ? read(props.checked) === true : props.checked === true), "aria-labelledby": labelId, "data-size": props.size ?? "md", "data-hit": "expand" }, h("span", { class: "ml-toggle-thumb", "aria-hidden": "true" }));
        toggle.dataset.state = toggle.getAttribute("aria-checked") === "true" ? "checked" : "unchecked";
        bind(() => {
          if (isBinding(props.checked)) {
            const on = read(props.checked) === true;
            toggle.setAttribute("aria-checked", String(on));
            toggle.dataset.state = on ? "checked" : "unchecked";
          }
          toggle.disabled = disabled();
        });
        if (isBinding(props.checked)) toggle.addEventListener("ml-change", (event) => write(props.checked, event.detail.value));
        return [h("span", { class: "ml-switch-field" }, toggle, words(h("span", { class: "ml-switch-label", id: labelId }), props.label))];
      }
      case "Slider": {
        const min = props.min ?? 0;
        const max = props.max ?? 100;
        const labelId = `${fieldId}-label`;
        const output = h("span", { class: "ml-slider-output" });
        const range = h("span", { class: "ml-slider-range", "aria-hidden": "true" });
        const thumb = h("span", { class: "ml-slider-thumb", id: fieldId, role: "slider", tabindex: "0", "aria-labelledby": labelId, "aria-valuemin": min, "aria-valuemax": max });
        const field = h("div", { class: "ml-slider-field", "data-ml": "slider", "data-size": props.size ?? "md", "data-ml-step": props.step ?? 1 }, h("div", { class: "ml-slider-header" }, words(h("span", { class: "ml-slider-label", id: labelId }), props.label), output), h("div", { class: "ml-slider" }, h("div", { class: "ml-slider-track" }, range, thumb)));
        let own = typeof props.value === "number" ? props.value : min;
        bind(() => {
          const raw = isBinding(props.value) ? read(props.value) : own;
          const value = typeof raw === "number" && Number.isFinite(raw) ? Math.min(max, Math.max(min, raw)) : min;
          const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
          thumb.setAttribute("aria-valuenow", String(value));
          output.textContent = String(value);
          range.style.width = `${percent}%`;
          thumb.style.left = `${percent}%`;
          if (disabled()) {
            field.dataset.disabled = "";
            thumb.setAttribute("aria-disabled", "true");
          } else {
            delete field.dataset.disabled;
            thumb.removeAttribute("aria-disabled");
          }
        });
        field.addEventListener("ml-change", (event) => {
          if (isBinding(props.value)) write(props.value, event.detail.value);
          else own = event.detail.value;
        });
        return [field];
      }
      case "Button": {
        const label = words(h("span", { class: "ml-button-label" }), props.text);
        const button = named(h("button", { class: "ml-button", id: fieldId, type: "button", "data-variant": props.variant ?? "primary", "data-size": props.size ?? "md", "data-width": props.width === "full" ? "full" : null }, label));
        bind(() => {
          button.disabled = disabled();
        });
        button.addEventListener("click", () => press(surfaceId, id, scope));
        return [button];
      }
      case "Badge":
        return [h("span", { class: "ml-badge", "data-tone": props.tone ?? "neutral", "data-variant": props.variant ?? "soft", "data-size": props.size ?? "md" }, words(h("span", { class: "ml-badge-label" }), props.text))];
      case "Progress": {
        const max = props.max ?? 100;
        const value = h("span", { class: "ml-progress-value", "aria-hidden": "true" });
        const fill = h("div", { class: "ml-progress-fill", "aria-hidden": "true" });
        const track = h("div", { class: "ml-progress-track", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": max }, fill);
        const label = words(h("span"), props.label);
        const shown = h("div", { class: "ml-progress-label" }, label, value);
        bind(() => {
          const raw = read(props.value);
          const current = typeof raw === "number" && Number.isFinite(raw) ? Math.min(max, Math.max(0, raw)) : 0;
          const percent = Math.round((current / max) * 100);
          track.setAttribute("aria-valuenow", String(current));
          track.setAttribute("aria-valuetext", `${percent}%`);
          track.setAttribute("aria-label", text(read(props.label)));
          fill.style.width = `${percent}%`;
          value.textContent = `${percent}%`;
          value.hidden = read(props.showLabel) !== true;
        });
        return [h("div", { class: "ml-progress-root", "data-tone": props.tone ?? "primary", "data-size": props.size ?? "md", "data-state": "determinate" }, shown, track)];
      }
      case "Avatar": {
        const fallback = h("span", { class: "ml-avatar-fallback", role: "img" });
        const status = props.status ? h("span", { class: "ml-avatar-status", role: "status", "data-status": props.status }) : null;
        bind(() => {
          const name = text(read(props.name));
          fallback.setAttribute("aria-label", name);
          fallback.textContent = name.replace(/[^\p{L}\p{N}\s]/gu, "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join("");
          status?.setAttribute("aria-label", `${name} is ${props.status}`);
        });
        return [h("span", { class: "ml-avatar-root", "data-size": props.size ?? "md" }, h("span", { class: "ml-avatar" }, fallback), status)];
      }
      case "Table": {
        const columns = Array.isArray(props.columns) ? props.columns : [];
        const body = h("tbody", { class: "ml-table-body" });
        const caption = words(h("caption", { class: "ml-table-caption" }), props.caption);
        const container = h("div", { class: "ml-table-container" }, h("table", { class: "ml-table", "data-size": props.size ?? "md" }, caption, h("thead", { class: "ml-table-header" }, h("tr", { class: "ml-table-row" }, columns.map((column) => words(h("th", { class: "ml-table-head", scope: "col", "data-align": column.align ?? "left" }), column.label)))), body));
        bind(() => {
          container.setAttribute("aria-label", text(read(props.caption)));
          const rows = read(props.rows);
          body.replaceChildren(
            ...(Array.isArray(rows) ? rows.slice(0, host.rules.limits.rows) : []).map((row) =>
              h("tr", { class: "ml-table-row" }, columns.map((column) => h("td", { class: "ml-table-cell", "data-align": column.align ?? "left" }, cell(row, column.key, labels)))),
            ),
          );
          // A table wider than its surface scrolls, and the keyboard reaches it.
          queueMicrotask(() => {
            const scrolls = container.scrollWidth > container.clientWidth + 1;
            if (scrolls) container.setAttribute("tabindex", "0");
            else container.removeAttribute("tabindex");
            container.setAttribute("role", scrolls ? "region" : "presentation");
            if (!scrolls) container.removeAttribute("role");
          });
        });
        return [container];
      }
      default:
        return [];
    }
  }

  const stop = host.subscribe(render);
  render();
  return {
    host,
    /** Takes A2UI messages; `{ streaming: true }` while more are on their way. */
    receive: (input, receiveOptions = {}) => {
      options.streaming = Boolean(receiveOptions.streaming);
      return host.receive(input, receiveOptions);
    },
    /** What "system" means for these surfaces: "light" or "dark" from the host, or null for the reader's setting. */
    setSystemMode: (mode) => {
      options.systemMode = mode ?? undefined;
      if (options.theme === "inherit") return;
      for (const [id, entry] of drawn) {
        const theme = host.surface(id)?.theme;
        if (theme) entry.node.dataset.mode = modeOf(theme);
      }
    },
    destroy: () => {
      stop();
      root.remove();
    },
  };
}

function cell(row, key, labels) {
  const value = row !== null && typeof row === "object" && Object.hasOwn(row, key) ? row[key] : undefined;
  if (typeof value === "boolean") return value ? labels.yes : labels.no;
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "—";
}

export { isBinding };
