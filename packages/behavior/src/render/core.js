/**
 * Mlola Render's core: what a renderer keeps and decides, with no DOM.
 *
 * A host receives A2UI messages, holds each surface's components and data
 * model, and answers what a renderer asks while it draws: a component's
 * children (a template expanded over its list), a prop's value (a binding
 * read in its scope), what a press sends back. The React renderer and the
 * framework-free one draw from the same host, so they cannot disagree about
 * a binding, a template or an action.
 *
 * Nothing is drawn that has not passed the check (check.js). A surface shows
 * its last state that passed: an update with an error is reported, in A2UI's
 * own error message, and what is on screen stays as it was.
 */

import { applyRenderMessages, checkSurface, childIds, createRenderState, getAt, isObject, parseRenderInput, setAt } from "./check.js";

export { applyRenderMessages, checkSurface, checkSurfaces, createRenderState, formatRenderReport, parseRenderInput, renderCatalogGuide, validateRender } from "./check.js";

const KINDS = ["createSurface", "updateComponents", "updateDataModel", "deleteSurface"];
const MESSAGE_PATH = /^(?:\/\d+)?\/(?:createSurface|updateComponents|updateDataModel|deleteSurface)(\/.*)?$/;
/** Components whose title is a heading the agent gives no level: the renderer finds it from the outline. */
const TITLED = new Set(["EmptyState", "Accordion"]);

const isBinding = (value) => isObject(value) && typeof value.path === "string";
/** A copy that later edits to the data model cannot reach. */
const copy = (value) => (value !== null && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value);

/** A path as written in a component, from the top of the data model: relative ones start at the template's item. */
export function absolutePath(path, scope = "") {
  if (path.startsWith("/")) return path;
  return path ? `${scope}/${path}` : scope || "/";
}

/**
 * A check's error as the A2UI message a renderer sends the agent:
 * {"version", "error": {"code", "surfaceId", "path", "message"}}, with the
 * path inside the one message that was refused.
 */
export function toErrorMessage(issue, version = "v0.9.1") {
  const inside = MESSAGE_PATH.exec(issue.path);
  return { version, error: { code: issue.code, surfaceId: issue.surfaceId, path: inside ? inside[1] || "/" : issue.path || "/", message: issue.message } };
}

/**
 * A host for surfaces. `onAction(message, extra)` receives A2UI's action when
 * a Button is pressed (`extra.dataModel` when the surface asked for it with
 * sendDataModel); `onError(messages)` receives A2UI error messages for what
 * was refused.
 */
export function createRenderHost(rules, given = {}) {
  let options = given;
  let state = createRenderState(rules);
  const version = options.version ?? rules.protocolVersions.at(-1);
  const now = options.now ?? (() => new Date());
  /** What is drawn: surfaceId → { components, theme, levels, missing }. */
  const views = new Map();
  const listeners = new Set();
  /** Surfaces that changed since they were last checked whole: a stream's updates wait here until it pauses. */
  const pending = new Set();
  let revision = 0;
  /** Errors from before anyone listened (a first render on the server), sent once onError is given. */
  let unsent = [];
  const report = (messages) => {
    if (options.onError) options.onError(messages);
    else unsent.push(...messages);
  };
  /** Grows each time a surface's components are replaced, so a renderer knows when to rebuild rather than update. */
  let drawn = 0;

  const changed = () => {
    revision += 1;
    for (const listener of [...listeners]) listener();
  };

  /** The level for each titled component, from the headings before it in reading order. */
  function outline(components) {
    const levels = new Map();
    const root = components.get("root");
    if (!root) return levels;
    const seen = new Set(["root"]);
    const stack = [root];
    let current = 1;
    while (stack.length) {
      const node = stack.pop();
      if (node.type === "Heading") current = Number.isInteger(node.props.level) ? node.props.level : (node.definition?.props.level?.default ?? 2);
      else if (TITLED.has(node.type)) levels.set(node.id, Math.min(6, current + 1));
      const { ids } = childIds(node);
      for (let index = ids.length - 1; index >= 0; index -= 1) {
        const child = components.get(ids[index]);
        if (child && !seen.has(child.id)) {
          seen.add(child.id);
          stack.push(child);
        }
      }
    }
    return levels;
  }

  function receive(input, { streaming = false } = {}) {
    const parsed = parseRenderInput(input, rules.limits);
    if (parsed.error) {
      const issues = { errors: [{ code: "VALIDATION_FAILED", surfaceId: "", path: "", message: parsed.error }], advice: [] };
      report(issues.errors.map((issue) => toErrorMessage(issue, version)));
      return issues;
    }
    // No messages is how a stream says it has paused: nothing to apply, and what waited is checked and drawn.
    const none = Array.isArray(parsed.messages) && !parsed.messages.length;
    const issues = none ? { errors: [], advice: [] } : applyRenderMessages(state, parsed.messages);
    for (const message of Array.isArray(parsed.messages) ? parsed.messages : [parsed.messages]) {
      if (!isObject(message)) continue;
      for (const kind of KINDS) if (isObject(message[kind]) && typeof message[kind].surfaceId === "string") pending.add(message[kind].surfaceId);
    }
    for (const id of [...views.keys()]) {
      const surface = state.surfaces.get(id);
      if (!surface || surface.deleted) views.delete(id);
    }
    if (!streaming) {
      // The whole-surface check repeats what each message already reported, so an error is kept once.
      const known = new Set(issues.errors.map((error) => `${error.path}\u0000${error.message}`));
      for (const id of pending) {
        const surface = state.surfaces.get(id);
        if (!surface || surface.deleted || !surface.components.size) continue;
        const checked = checkSurface(state, id);
        if (checked.errors.length) {
          for (const error of checked.errors) {
            const key = `${error.path}\u0000${error.message}`;
            if (!known.has(key)) issues.errors.push(error);
            known.add(key);
          }
          continue;
        }
        issues.advice.push(...checked.advice);
        const components = new Map(surface.components);
        drawn += 1;
        views.set(id, { components, theme: surface.theme, levels: outline(components), missing: views.get(id)?.missing ?? new Set(), structure: drawn });
      }
      pending.clear();
    }
    if (issues.errors.length) report(issues.errors.map((issue) => toErrorMessage(issue, version)));
    changed();
    return issues;
  }

  const view = (surfaceId) => views.get(surfaceId) ?? null;
  const data = (surfaceId) => state.surfaces.get(surfaceId)?.data;

  /** A prop's value: the literal, or what its binding holds now. */
  function read(surfaceId, value, scope = "") {
    if (!isBinding(value)) return value;
    return getAt(data(surfaceId), absolutePath(value.path, scope));
  }

  /** The instances a container draws: its children by id, or its template once for each item of its list. */
  function children(surfaceId, componentId, scope = "") {
    const drawn = view(surfaceId);
    const node = drawn?.components.get(componentId);
    if (!node) return [];
    const { ids, template } = childIds(node);
    if (!template) return ids.filter((id) => drawn.components.has(id)).map((id) => ({ id, scope, key: `${id}@${scope}` }));
    if (!drawn.components.has(template.componentId)) return [];
    const listPath = absolutePath(template.path, scope);
    const list = getAt(data(surfaceId), listPath);
    if (!Array.isArray(list)) return [];
    const base = listPath === "/" ? "" : listPath;
    return list.slice(0, rules.limits.components).map((_, index) => ({ id: template.componentId, scope: `${base}/${index}`, key: `${template.componentId}@${base}/${index}` }));
  }

  /** Writes what a person entered into the data model, where the field is bound. Returns false for a literal. */
  function write(surfaceId, binding, value, scope = "") {
    const surface = state.surfaces.get(surfaceId);
    if (!surface || surface.deleted || !isBinding(binding)) return false;
    const path = absolutePath(binding.path, scope);
    const written = setAt(surface.data, path, value);
    if (written.error) return false;
    surface.data = written.root;
    const drawn = view(surfaceId);
    if (drawn?.missing.size) for (const key of [...drawn.missing]) if (key.endsWith(`|${path}`)) drawn.missing.delete(key);
    changed();
    return true;
  }

  /** Every instance on the surface, templates expanded, in reading order. */
  function* instances(surfaceId, componentId = "root", scope = "", depth = 0) {
    const node = view(surfaceId)?.components.get(componentId);
    if (!node || depth > rules.limits.depth) return;
    yield { node, scope };
    for (const child of children(surfaceId, componentId, scope)) yield* instances(surfaceId, child.id, child.scope, depth + 1);
  }

  const empty = (value) => value === undefined || value === null || value === false || (typeof value === "string" && !value.trim());

  /**
   * A Button was pressed. A required field holds back the actions that would
   * send its value: one bound at or under a path the action's context reads.
   * Returns what was sent, or the fields still to fill in.
   */
  function press(surfaceId, componentId, scope = "") {
    const drawn = view(surfaceId);
    const node = drawn?.components.get(componentId);
    const event = node?.props.action?.event;
    if (!drawn || !isObject(event)) return { sent: null, missing: [] };
    const context = isObject(event.context) ? event.context : {};
    const sends = Object.values(context).filter(isBinding).map((binding) => absolutePath(binding.path, scope));
    const covers = (path) => sends.some((sent) => sent === "/" || sent === path || path.startsWith(`${sent}/`));
    const missing = [];
    for (const instance of instances(surfaceId)) {
      const { props, definition } = instance.node;
      if (definition?.group !== "form" || read(surfaceId, props.required, instance.scope) !== true) continue;
      const bound = isBinding(props.value) ? props.value : isBinding(props.checked) ? props.checked : null;
      if (!bound) continue;
      const path = absolutePath(bound.path, instance.scope);
      if (covers(path) && empty(getAt(data(surfaceId), path))) missing.push({ id: instance.node.id, scope: instance.scope, key: `${instance.node.id}@${instance.scope}`, path, label: read(surfaceId, props.label, instance.scope) });
    }
    // An action that sends no field (Cancel) leaves the marks another press made.
    if (missing.length || sends.length) drawn.missing = new Set(missing.map((field) => `${field.key}|${field.path}`));
    if (missing.length) {
      changed();
      return { sent: null, missing };
    }
    const message = {
      version,
      action: {
        name: event.name,
        surfaceId,
        sourceComponentId: componentId,
        timestamp: now().toISOString(),
        context: Object.fromEntries(Object.entries(context).map(([key, value]) => [key, copy(read(surfaceId, value, scope)) ?? null])),
      },
    };
    const surface = state.surfaces.get(surfaceId);
    options.onAction?.(message, surface?.sendDataModel ? { dataModel: copy(surface.data) } : {});
    changed();
    return { sent: message, missing: [] };
  }

  return {
    rules,
    receive,
    /** The surfaces that can be drawn, oldest first. */
    surfaces: () => [...views.keys()],
    /** What to draw for a surface, or null while nothing of it has passed the check: { id, theme: { name, mode } }. */
    surface: (surfaceId) => (views.has(surfaceId) ? { id: surfaceId, theme: views.get(surfaceId).theme } : null),
    /** A component as drawn: { id, type, props, definition }, or null. */
    component: (surfaceId, componentId) => view(surfaceId)?.components.get(componentId) ?? null,
    children,
    read,
    write,
    press,
    /** True while a required field kept an action back and has not been filled in since. */
    missing: (surfaceId, componentId, scope = "") => {
      const drawn = view(surfaceId);
      if (!drawn?.missing.size) return false;
      const prefix = `${componentId}@${scope}|`;
      for (const key of drawn.missing) if (key.startsWith(prefix)) return true;
      return false;
    },
    /** A number that changes when the surface's components were replaced; data changes leave it. */
    structure: (surfaceId) => view(surfaceId)?.structure ?? 0,
    /** The heading level for a titled component (EmptyState, Accordion), one under the heading before it. */
    headingLevel: (surfaceId, componentId) => view(surfaceId)?.levels.get(componentId) ?? 2,
    /** Replaces what the host answers to: onAction and onError, as they are now. */
    configure: (next) => {
      options = { ...options, ...next };
      if (options.onError && unsent.length) {
        const waiting = unsent;
        unsent = [];
        options.onError(waiting);
      }
    },
    /** Forgets every surface, for a new conversation in the same place. */
    reset: () => {
      state = createRenderState(rules);
      views.clear();
      pending.clear();
      changed();
    },
    /** The surface's data model, as it stands. */
    dataModel: (surfaceId) => copy(data(surfaceId)),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** A number that grows with every change, for a renderer that compares snapshots. */
    revision: () => revision,
  };
}

export { isBinding };
