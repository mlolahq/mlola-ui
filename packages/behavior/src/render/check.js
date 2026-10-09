/**
 * Mlola Render: checks the UI an agent composes before anything renders.
 *
 * An agent describes an interface as A2UI messages (https://a2ui.org): a
 * surface, a flat list of components that name their children by id, and a
 * data model the inputs bind to. This module checks those messages against
 * the Mlola catalog (render-rules.json, generated from the components) and
 * answers with A2UI's own error shape, so the agent can correct itself:
 *
 *   { code: "VALIDATION_FAILED", surfaceId, path, message }
 *
 * `path` is a JSON Pointer into the input: "/1/updateComponents/components/3/variant"
 * when the input is an array of messages, "/updateComponents/components/3/variant"
 * when it is one message.
 *
 * Beyond the schema it holds what makes UI usable: every field and control
 * has a name, headings do not skip a level, a tree has one root and no
 * cycles, a value is one the component offers. It never reads a theme or a
 * color, since the components and the engine already guarantee contrast,
 * focus, target size and reduced motion.
 *
 * Messages come from a model, so everything here runs in time that grows with
 * the input's length and stops at the catalog's limits. No Node or DOM API is
 * used: the CLI, both MCP servers and a renderer in the browser share it.
 */

const KINDS = ["createSurface", "updateComponents", "updateDataModel", "deleteSurface"];
const COMMON_PROPS = new Set(["id", "component", "accessibility"]);
const STYLE_PROPS = new Set(["style", "className", "class", "css", "color", "background", "backgroundColor", "theme", "sx", "tw"]);
const UNSAFE_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);
const ACTION_NAME = /^[A-Za-z][A-Za-z0-9_.:-]{0,63}$/;
const COLUMN_KEY = /^[A-Za-z0-9_-]{1,64}$/;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
/** A day that exists, written as an ISO date: "2026-02-30" is not one. */
const isDate = (value) => {
  const match = typeof value === "string" ? ISO_DATE.exec(value) : null;
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
/** More errors than this are summed up in one line: an agent fixes the first ones and checks again. */
const MAX_REPORTED = 100;

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
/** A key the input chose, looked up on the catalog's own entries: "toString" or "__proto__" is not a component. */
const own = (object, key) => (Object.hasOwn(object, key) ? object[key] : undefined);
const typeName = (value) => (value === null ? "null" : Array.isArray(value) ? "an array" : typeof value === "object" ? "an object" : `a ${typeof value}`);
/** A value echoed back in a message: short, and never a whole object someone sent. */
const quote = (value) => {
  if (value !== null && typeof value === "object") return typeName(value);
  if (typeof value === "string" && value.length > 80) return JSON.stringify(`${value.slice(0, 77)}…`);
  return String(JSON.stringify(value));
};
const escapeSegment = (segment) => String(segment).replaceAll("~", "~0").replaceAll("/", "~1");
const pointer = (base, ...segments) => segments.reduce((path, segment) => `${path}/${escapeSegment(segment)}`, base);
const list = (values) => values.map((value) => quote(value)).join(", ");

/**
 * Reads what an agent or a file holds: one message, an array of messages,
 * or JSON Lines (one message per line, as A2UI streams them).
 */
export function parseRenderInput(source, limits) {
  if (typeof source !== "string") return { messages: source, error: null };
  if (limits && source.length > limits.inputBytes) return { messages: null, error: `The input is ${source.length} characters; at most ${limits.inputBytes} are checked at a time. Send fewer messages per call.` };
  const trimmed = source.trim();
  if (!trimmed) return { messages: null, error: "The input is empty. Pass A2UI messages: one object, an array, or one object per line." };
  try {
    return { messages: JSON.parse(trimmed), error: null };
  } catch (whole) {
    const lines = trimmed.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length > 1) {
      const messages = [];
      for (const [index, line] of lines.entries()) {
        try {
          messages.push(JSON.parse(line));
        } catch (error) {
          return { messages: null, error: `Line ${index + 1} is not JSON: ${error.message}` };
        }
      }
      return { messages, error: null };
    }
    return { messages: null, error: `The input is not JSON: ${whole.message}` };
  }
}

/**
 * The state a renderer keeps between messages: the surfaces, their
 * components and their data. Checking a stream message by message and
 * checking it all at once give the same answer. A state can live as long
 * as its stream: the limits hold what one call brings and what is open at
 * once, never a running total.
 */
export function createRenderState(rules) {
  return { rules, surfaces: new Map() };
}

/**
 * Checks messages and applies the valid ones to the state. Structure that
 * needs the whole tree (the root, references, cycles, heading order) is
 * checked by `checkSurfaces`, once the batch is in.
 */
export function applyRenderMessages(state, input) {
  const issues = { errors: [], advice: [] };
  const single = isObject(input);
  const messages = single ? [input] : input;
  if (!Array.isArray(messages)) {
    issues.errors.push(failure("", "", `Expected A2UI messages: an object with "version" and one of ${KINDS.join(", ")}, or an array of them. Got ${typeName(input)}.`));
    return issues;
  }
  const { limits } = state.rules;
  if (!messages.length) issues.errors.push(failure("", "", "There are no messages. Start with createSurface, then updateComponents."));
  if (messages.length > limits.messages) {
    issues.errors.push(failure("", "", `At most ${limits.messages} messages are checked at a time; this is ${messages.length}. Check the rest in another call.`));
    return issues;
  }
  for (const [index, message] of messages.entries()) {
    applyMessage(state, message, single ? "" : `/${index}`, issues);
  }
  return issues;
}

/** Whole-tree checks for every surface the messages touched. */
export function checkSurfaces(state, issues = { errors: [], advice: [] }) {
  for (const surface of state.surfaces.values()) {
    if (!surface.deleted && surface.components.size) checkTree(state.rules, surface, issues);
  }
  return issues;
}

/**
 * One surface, checked whole: how it was created, every component it holds
 * now and the tree they make. A renderer asks this before it draws, so what
 * shows has passed the check however many updates it took to get there.
 */
export function checkSurface(state, surfaceId) {
  const issues = { errors: [], advice: [] };
  const surface = state.surfaces.get(surfaceId);
  if (!surface || surface.deleted) return issues;
  issues.errors.push(...surface.problems);
  for (const node of surface.components.values()) checkComponent(state.rules, surface.id, node.props, node.at, issues);
  if (surface.components.size) checkTree(state.rules, surface, issues);
  return issues;
}

/**
 * Checks A2UI messages against the Mlola catalog. Takes parsed JSON or the
 * text of it, and answers with the errors that stop it rendering, advice
 * that does not, and what each surface holds.
 */
export function validateRender(input, rules) {
  const parsed = parseRenderInput(input, rules.limits);
  if (parsed.error) return report([failure("", "", parsed.error)], [], []);
  const state = createRenderState(rules);
  const issues = applyRenderMessages(state, parsed.messages);
  checkSurfaces(state, issues);
  if (issues.errors.length > MAX_REPORTED) {
    const more = issues.errors.length - MAX_REPORTED;
    issues.errors = [...issues.errors.slice(0, MAX_REPORTED), failure("", "", `${more} more ${more === 1 ? "error" : "errors"} not shown. Fix these first and check again.`)];
  }
  issues.advice = issues.advice.slice(0, MAX_REPORTED);
  const surfaces = [...state.surfaces.values()].map((surface) => ({
    surfaceId: surface.id,
    deleted: surface.deleted,
    theme: surface.theme,
    components: surface.components.size,
  }));
  return report(issues.errors, issues.advice, surfaces);
}

function report(errors, notes, surfaces) {
  return { valid: errors.length === 0, errors, advice: notes, surfaces };
}

function failure(surfaceId, path, message) {
  return { code: "VALIDATION_FAILED", surfaceId: surfaceId ?? "", path, message };
}

function advice(surfaceId, path, message) {
  return { code: "ADVICE", surfaceId: surfaceId ?? "", path, message };
}

/* Messages ---------------------------------------------------------------- */

function applyMessage(state, message, base, issues) {
  const { rules } = state;
  if (!isObject(message)) {
    issues.errors.push(failure("", base, `A message is an object with "version" and one of ${KINDS.join(", ")}; this one is ${typeName(message)}.`));
    return;
  }
  const kinds = KINDS.filter((kind) => kind in message);
  const surfaceGuess = kinds.length === 1 && isObject(message[kinds[0]]) && typeof message[kinds[0]].surfaceId === "string" ? message[kinds[0]].surfaceId : "";
  if (!rules.protocolVersions.includes(message.version)) {
    issues.errors.push(failure(surfaceGuess, pointer(base, "version"), message.version === undefined ? `Add "version": ${quote(rules.protocolVersions.at(-1))} to every message.` : `Version ${quote(message.version)} is not supported; use ${list(rules.protocolVersions)}.`));
  }
  if (kinds.length !== 1) {
    issues.errors.push(failure(surfaceGuess, base, kinds.length ? `A message carries one of ${KINDS.join(", ")}; this one has ${kinds.join(" and ")}. Send them as separate messages.` : `A message carries one of ${KINDS.join(", ")}; this one has none.`));
    return;
  }
  for (const key of Object.keys(message)) {
    if (key !== "version" && key !== kinds[0]) issues.errors.push(failure(surfaceGuess, pointer(base, key), `A message holds only "version" and ${quote(kinds[0])}; remove ${quote(key)}.`));
  }
  const kind = kinds[0];
  const body = message[kind];
  const at = pointer(base, kind);
  if (!isObject(body)) {
    issues.errors.push(failure("", at, `${kind} is an object; got ${typeName(body)}.`));
    return;
  }
  const surfaceId = body.surfaceId;
  if (typeof surfaceId !== "string" || !surfaceId.trim() || surfaceId.length > rules.limits.idLength) {
    issues.errors.push(failure("", pointer(at, "surfaceId"), `${kind} needs a "surfaceId": a string of 1 to ${rules.limits.idLength} characters that names the surface.`));
    return;
  }
  if (kind === "createSurface") createSurface(state, body, at, issues);
  else {
    const surface = state.surfaces.get(surfaceId);
    if (!surface || surface.deleted) {
      issues.errors.push(failure(surfaceId, pointer(at, "surfaceId"), surface?.deleted ? `Surface ${quote(surfaceId)} was deleted; send createSurface again before ${kind}.` : `No surface is called ${quote(surfaceId)}. Send createSurface for it first, in the same messages.`));
      return;
    }
    if (kind === "updateComponents") updateComponents(rules, surface, body, at, issues);
    else if (kind === "updateDataModel") updateDataModel(rules, surface, body, at, issues);
    else deleteSurface(state, surface, body, at, issues);
  }
}

function onlyKeys(object, allowed, at, surfaceId, issues, name) {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) issues.errors.push(failure(surfaceId, pointer(at, key), `${name} does not take ${quote(key)}. It takes ${list(allowed)}.`));
  }
}

function createSurface(state, body, at, issues) {
  const { rules } = state;
  const { surfaceId } = body;
  const before = issues.errors.length;
  onlyKeys(body, ["surfaceId", "catalogId", "theme", "sendDataModel"], at, surfaceId, issues, "createSurface");
  if (body.catalogId !== rules.catalogId) {
    issues.errors.push(failure(surfaceId, pointer(at, "catalogId"), `Set "catalogId" to ${quote(rules.catalogId)}: this renderer draws the Mlola catalog${typeof body.catalogId === "string" ? `, not ${quote(body.catalogId)}` : ""}.`));
  }
  if (body.sendDataModel !== undefined && typeof body.sendDataModel !== "boolean") {
    issues.errors.push(failure(surfaceId, pointer(at, "sendDataModel"), `"sendDataModel" is true or false.`));
  }
  const theme = { name: rules.defaultTheme, mode: "system" };
  if (body.theme !== undefined) {
    const themeAt = pointer(at, "theme");
    if (!isObject(body.theme)) {
      issues.errors.push(failure(surfaceId, themeAt, `"theme" is an object like {"name": ${quote(rules.defaultTheme)}, "mode": "system"}.`));
    } else {
      for (const key of Object.keys(body.theme)) {
        if (key === "name" || key === "mode") continue;
        issues.errors.push(failure(surfaceId, pointer(themeAt, key), /color|font|radius|spacing|icon/i.test(key)
          ? `Colors, type and shape come from the theme; pick one by name instead of setting ${quote(key)}: ${list(rules.themes)}.`
          : `"theme" takes "name" and "mode"; remove ${quote(key)}.`));
      }
      if (body.theme.name !== undefined) {
        if (rules.themes.includes(body.theme.name)) theme.name = body.theme.name;
        else issues.errors.push(failure(surfaceId, pointer(themeAt, "name"), `Theme ${quote(body.theme.name)} does not exist; use ${list(rules.themes)}.`));
      }
      if (body.theme.mode !== undefined) {
        if (rules.modes.includes(body.theme.mode)) theme.mode = body.theme.mode;
        else issues.errors.push(failure(surfaceId, pointer(themeAt, "mode"), `Mode ${quote(body.theme.mode)} does not exist; use ${list(rules.modes)} (system follows the reader's setting).`));
      }
    }
  }
  const existing = state.surfaces.get(surfaceId);
  if (existing && !existing.deleted) {
    issues.errors.push(failure(surfaceId, pointer(at, "surfaceId"), `Surface ${quote(surfaceId)} already exists. Use another surfaceId, or send deleteSurface first.`));
    return;
  }
  let open = 0;
  for (const surface of state.surfaces.values()) if (!surface.deleted) open += 1;
  if (open >= rules.limits.surfaces) {
    issues.errors.push(failure(surfaceId, at, `At most ${rules.limits.surfaces} surfaces are open at once; send deleteSurface for one that is done.`));
    return;
  }
  // Created again, a surface takes its place at the end, as the newest.
  state.surfaces.delete(surfaceId);
  // What was wrong with createSurface stays with the surface: a renderer does not draw one made for another catalog.
  state.surfaces.set(surfaceId, { id: surfaceId, theme, sendDataModel: body.sendDataModel === true, deleted: false, components: new Map(), data: {}, dataBytes: 0, at, problems: issues.errors.slice(before) });
}

function deleteSurface(state, surface, body, at, issues) {
  onlyKeys(body, ["surfaceId"], at, surface.id, issues, "deleteSurface");
  surface.deleted = true;
  surface.components = new Map();
  surface.data = {};
  surface.dataBytes = 0;
  // A deleted surface is remembered, so a late update is told why it fails; the oldest are let go.
  const gone = [...state.surfaces.values()].filter((entry) => entry.deleted);
  for (const entry of gone.slice(0, Math.max(0, gone.length - state.rules.limits.surfaces))) state.surfaces.delete(entry.id);
}

function updateComponents(rules, surface, body, at, issues) {
  onlyKeys(body, ["surfaceId", "components"], at, surface.id, issues, "updateComponents");
  const listAt = pointer(at, "components");
  if (!Array.isArray(body.components) || !body.components.length) {
    issues.errors.push(failure(surface.id, listAt, `"components" is a non-empty array of components, each with an "id" and a "component".`));
    return;
  }
  if (body.components.length > rules.limits.components) {
    issues.errors.push(failure(surface.id, listAt, `This message sends ${body.components.length} components; a surface holds at most ${rules.limits.components}. Split it into more surfaces.`));
    return;
  }
  const seen = new Set();
  for (const [index, component] of body.components.entries()) {
    const componentAt = pointer(listAt, index);
    if (!isObject(component)) {
      issues.errors.push(failure(surface.id, componentAt, `A component is an object with "id" and "component"; got ${typeName(component)}.`));
      continue;
    }
    const { id } = component;
    if (typeof id !== "string" || !id.trim() || id.length > rules.limits.idLength) {
      issues.errors.push(failure(surface.id, pointer(componentAt, "id"), `Every component needs an "id": a string of 1 to ${rules.limits.idLength} characters, unique on the surface.`));
      continue;
    }
    if (seen.has(id)) {
      issues.errors.push(failure(surface.id, pointer(componentAt, "id"), `Two components in this message have the id ${quote(id)}; give each its own.`));
      continue;
    }
    seen.add(id);
    if (!surface.components.has(id) && surface.components.size >= rules.limits.components) {
      issues.errors.push(failure(surface.id, componentAt, `A surface holds at most ${rules.limits.components} components; split it into more surfaces.`));
      break;
    }
    const definition = checkComponent(rules, surface.id, component, componentAt, issues);
    surface.components.set(id, { id, type: component.component, props: component, definition, at: componentAt });
  }
}

function updateDataModel(rules, surface, body, at, issues) {
  onlyKeys(body, ["surfaceId", "path", "value"], at, surface.id, issues, "updateDataModel");
  const path = body.path ?? "/";
  const pathAt = pointer(at, "path");
  if (typeof path !== "string" || (path !== "" && !validPointer(path, { absolute: true, rules }))) {
    issues.errors.push(failure(surface.id, pathAt, `"path" is a JSON Pointer like "/form/email", or "/" for the whole data model.`));
    return;
  }
  // The size is what the model holds: the value written, less the one it
  // replaces, so a stream that keeps updating one field never fills it.
  // The model holds a copy: what a person types later is written to the surface, never into the message it came from.
  let total = 0;
  let value;
  try {
    const written = body.value === undefined ? undefined : JSON.stringify(body.value);
    value = written === undefined ? undefined : JSON.parse(written);
    total = surface.dataBytes - jsonLength(getAt(surface.data, path)) + (written?.length ?? 0);
  } catch {
    issues.errors.push(failure(surface.id, pointer(at, "value"), `This value is nested too deeply to read; flatten it.`));
    return;
  }
  if (total > rules.limits.dataBytes) {
    issues.errors.push(failure(surface.id, pointer(at, "value"), `A surface's data model holds at most ${rules.limits.dataBytes} bytes of JSON; send less, or page through it.`));
    return;
  }
  const written = setAt(surface.data, path, value);
  if (written.error) {
    issues.errors.push(failure(surface.id, pathAt, written.error));
    return;
  }
  surface.data = written.root;
  surface.dataBytes = total;
}

const jsonLength = (value) => (value === undefined ? 0 : (JSON.stringify(value)?.length ?? 0));

/* Components -------------------------------------------------------------- */

function checkComponent(rules, surfaceId, component, at, issues) {
  const type = component.component;
  const typeAt = pointer(at, "component");
  if (typeof type !== "string" || !type) {
    issues.errors.push(failure(surfaceId, typeAt, `Every component names its type in "component", for example "Stack", "Text" or "Button".`));
    return null;
  }
  const definition = own(rules.components, type);
  if (!definition) {
    issues.errors.push(failure(surfaceId, typeAt, unknownComponent(rules, type)));
    return null;
  }
  for (const [name, value] of Object.entries(component)) {
    if (COMMON_PROPS.has(name)) continue;
    const prop = own(definition.props, name);
    const propAt = pointer(at, name);
    if (!prop) {
      issues.errors.push(failure(surfaceId, propAt, unknownProp(rules, type, definition, name)));
      continue;
    }
    checkProp(rules, surfaceId, type, name, prop, value, propAt, issues);
  }
  for (const [name, prop] of Object.entries(definition.props)) {
    if (prop.required && component[name] === undefined) {
      issues.errors.push(failure(surfaceId, at, `${type} needs ${quote(name)}${prop.description ? `: ${lowerFirst(prop.description)}` : "."}`));
    }
  }
  if (component.accessibility !== undefined) checkAccessibility(rules, surfaceId, component.accessibility, pointer(at, "accessibility"), issues);
  checkValues(rules, surfaceId, type, definition, component, at, issues);
  return definition;
}

const lowerFirst = (value) => value.charAt(0).toLowerCase() + value.slice(1);

function unknownComponent(rules, type) {
  const alias = own(rules.aliases, type) ?? Object.keys(rules.components).find((name) => name.toLowerCase() === type.toLowerCase());
  if (alias) return `${quote(type)} is not in the Mlola catalog; use ${quote(alias)}.`;
  const hint = own(rules.borrowed.components, type);
  if (hint) return `${quote(type)} is not in the Mlola catalog. ${hint}`;
  return `${quote(type)} is not in the Mlola catalog. It has: ${catalogGroups(rules).map(([title, names]) => `${title} (${names.join(", ")})`).join("; ")}.`;
}

/** The catalog's components by group, in the order the groups are titled: [title, names][]. */
function catalogGroups(rules) {
  return Object.entries(rules.groups).map(([group, title]) => [title, Object.keys(rules.components).filter((name) => rules.components[name].group === group)]);
}

function unknownProp(rules, type, definition, name) {
  const props = Object.keys(definition.props);
  const hint = own(rules.borrowed.props, `${type}.${name}`) ?? own(rules.borrowed.props, name);
  if (hint) return `${type} does not take ${quote(name)}. ${hint}`;
  if (STYLE_PROPS.has(name)) return `${type} takes no ${quote(name)}: Mlola Render draws with the surface's theme. Choose a named value instead (${props.filter((prop) => definition.props[prop].kind === "enum").join(", ") || "none on this component"}).`;
  if (name === "child" && props.includes("children")) return `${type} takes "children", an array of ids, not "child".`;
  if (name === "checks") return `Client-side checks are not in the Mlola catalog yet; use "required" on the field, and check the values when the action arrives.`;
  if (/^on[A-Z]/.test(name)) return `${type} does not take ${quote(name)}. A Button's "action" sends an event to the agent; inputs bind their value with {"path": …}.`;
  return `${type} does not take ${quote(name)}. It takes: ${props.join(", ")}.`;
}

function checkAccessibility(rules, surfaceId, value, at, issues) {
  if (!isObject(value)) {
    issues.errors.push(failure(surfaceId, at, `"accessibility" is an object with "label" and "description".`));
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    if (key !== "label" && key !== "description") {
      issues.errors.push(failure(surfaceId, pointer(at, key), `"accessibility" takes "label" and "description"; remove ${quote(key)}.`));
      continue;
    }
    checkText(rules, surfaceId, entry, pointer(at, key), { maxLength: rules.limits.labelLength }, false, issues);
  }
}

function checkProp(rules, surfaceId, type, name, prop, value, at, issues) {
  switch (prop.kind) {
    case "text":
      return checkText(rules, surfaceId, value, at, prop, prop.required, issues, `${type} ${quote(name)}`);
    case "boolean":
      if (typeof value === "boolean" || (!prop.literal && binding(rules, surfaceId, value, at, issues))) return;
      return issues.errors.push(failure(surfaceId, at, `${type} ${quote(name)} is true or false${prop.literal ? "" : `, or {"path": "/…"}`}; got ${typeName(value)}.`));
    case "number":
      if (typeof value === "number" && Number.isFinite(value)) return;
      if (!prop.literal && binding(rules, surfaceId, value, at, issues)) return;
      return issues.errors.push(failure(surfaceId, at, `${type} ${quote(name)} is a number${prop.literal ? "" : ` or {"path": "/…"}`}; got ${typeName(value)}.`));
    case "integer":
      if (Number.isInteger(value) && value >= prop.minimum && value <= prop.maximum) return;
      return issues.errors.push(failure(surfaceId, at, `${type} ${quote(name)} is a whole number from ${prop.minimum} to ${prop.maximum}; got ${quote(value)}.`));
    case "date":
      if (isDate(value)) return;
      if (!prop.literal && binding(rules, surfaceId, value, at, issues)) return;
      return issues.errors.push(failure(surfaceId, at, `${type} ${quote(name)} is a day written as an ISO date, like "2026-10-12"${prop.literal ? "" : `, or {"path": "/…"}`}; got ${quote(value)}.`));
    case "enum":
      if (typeof value === "string" && prop.values.includes(value)) return;
      return issues.errors.push(failure(surfaceId, at, enumMessage(rules, type, name, prop, value)));
    case "children":
      return checkChildren(rules, surfaceId, type, name, prop, value, at, issues);
    case "action":
      return checkAction(rules, surfaceId, value, at, issues);
    case "options":
      return checkOptions(rules, surfaceId, type, prop, value, at, issues);
    case "columns":
      return checkColumns(rules, surfaceId, prop, value, at, issues);
    case "rows":
      return checkRows(rules, surfaceId, value, at, issues);
    default:
      return issues.errors.push(failure(surfaceId, at, `${type} ${quote(name)} has a kind this validator does not know (${prop.kind}).`));
  }
}

function enumMessage(rules, type, name, prop, value) {
  if (typeof value === "string") {
    const near = prop.values.find((option) => option.toLowerCase() === value.toLowerCase());
    if (near) return `${type} ${quote(name)} is ${quote(near)}, not ${quote(value)}: values are case-sensitive.`;
    const hint = own(rules.borrowed.props, `${type}.${name}=${value}`);
    if (hint) return `${type} ${quote(name)} ${quote(value)} is not in the catalog. ${hint}`;
    if (prop.excluded?.includes(value)) return `${type} ${quote(name)} ${quote(value)} is not in the catalog: ${prop.description ?? "it needs content the catalog does not offer."} Use ${list(prop.values)}.`;
  }
  return `${type} ${quote(name)} ${typeof value === "string" ? `${quote(value)} does not exist` : `is a name, not ${typeName(value)}`}; use ${list(prop.values)}.`;
}

function checkText(rules, surfaceId, value, at, prop, required, issues, label = "This text") {
  if (typeof value === "string") {
    const max = prop.maxLength ?? rules.limits.textLength;
    if (value.length > max) issues.errors.push(failure(surfaceId, at, `${label} is ${value.length} characters; keep it to ${max}.`));
    else if (required && !value.trim()) issues.errors.push(failure(surfaceId, at, `${label} is empty. It is what a person sees and a screen reader reads; write the words.`));
    return;
  }
  if (binding(rules, surfaceId, value, at, issues)) return;
  if (isObject(value) && "call" in value) {
    issues.errors.push(failure(surfaceId, at, `Functions are not in the Mlola catalog yet; use a literal string or {"path": "/…"}.`));
    return;
  }
  issues.errors.push(failure(surfaceId, at, `${label} is a string or {"path": "/…"}; got ${typeName(value)}.`));
}

/** A data binding, {"path": "…"}: true when it is one (reporting a bad path), false when the value is something else. */
function binding(rules, surfaceId, value, at, issues) {
  if (!isObject(value) || !("path" in value)) return false;
  const extra = Object.keys(value).filter((key) => key !== "path");
  if (extra.length) issues.errors.push(failure(surfaceId, at, `A binding holds only "path"; remove ${list(extra)}.`));
  if (typeof value.path !== "string" || !validPointer(value.path, { rules })) {
    issues.errors.push(failure(surfaceId, pointer(at, "path"), `${quote(value.path)} is not a data path. Write a JSON Pointer like "/form/email" (or "name" inside a template), at most ${rules.limits.pathLength} characters.`));
  }
  return true;
}

/** JSON Pointer (RFC 6901), or a relative one inside a template; no segment that reaches an object's prototype. */
function validPointer(path, { absolute = false, rules }) {
  if (!path || path.length > rules.limits.pathLength) return false;
  if (absolute && path === "/") return true;
  if (absolute && !path.startsWith("/")) return false;
  const segments = (path.startsWith("/") ? path.slice(1) : path).split("/");
  for (const segment of segments) {
    if (/~(?![01])/.test(segment)) return false;
    if (UNSAFE_SEGMENTS.has(unescapeSegment(segment))) return false;
  }
  return true;
}

const unescapeSegment = (segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~");

function checkChildren(rules, surfaceId, type, name, prop, value, at, issues) {
  if (Array.isArray(value)) {
    if (value.length < (prop.minItems ?? 0)) issues.errors.push(failure(surfaceId, at, `${type} needs at least ${prop.minItems} ${prop.minItems === 1 ? "child" : "children"}.`));
    if (value.length > rules.limits.components) issues.errors.push(failure(surfaceId, at, `${type} lists ${value.length} children; a surface holds at most ${rules.limits.components} components.`));
    const seen = new Set();
    for (const [index, id] of value.entries()) {
      if (typeof id !== "string" || !id) issues.errors.push(failure(surfaceId, pointer(at, index), `A child is a component id (a string); got ${typeName(id)}.`));
      else if (seen.has(id)) issues.errors.push(failure(surfaceId, pointer(at, index), `${quote(id)} is listed twice in ${type}'s children; a component appears in one place.`));
      else seen.add(id);
    }
    return;
  }
  if (isObject(value) && ("componentId" in value || "path" in value)) {
    onlyKeys(value, ["componentId", "path"], at, surfaceId, issues, "A template");
    if (typeof value.componentId !== "string" || !value.componentId) issues.errors.push(failure(surfaceId, pointer(at, "componentId"), `A template names the component to repeat in "componentId".`));
    // Relative inside another template (an item's own list); checkBindingsScope holds that.
    if (typeof value.path !== "string" || !validPointer(value.path, { rules })) issues.errors.push(failure(surfaceId, pointer(at, "path"), `A template's "path" points at an array in the data model, like "/items".`));
    return;
  }
  issues.errors.push(failure(surfaceId, at, `${type} ${quote(name)} is an array of component ids, or a template {"componentId", "path"}; got ${typeName(value)}.`));
}

function checkAction(rules, surfaceId, value, at, issues) {
  if (!isObject(value)) {
    issues.errors.push(failure(surfaceId, at, `"action" is {"event": {"name": "…", "context": {…}}}; got ${typeName(value)}.`));
    return;
  }
  if ("functionCall" in value) {
    issues.errors.push(failure(surfaceId, pointer(at, "functionCall"), `Client-side functions are not in the Mlola catalog yet; send an event and handle it in the agent: {"event": {"name": "…"}}.`));
    return;
  }
  onlyKeys(value, ["event"], at, surfaceId, issues, "An action");
  const event = value.event;
  const eventAt = pointer(at, "event");
  if (!isObject(event)) {
    issues.errors.push(failure(surfaceId, eventAt, `An action sends an event: {"name": "…", "context": {…}}.`));
    return;
  }
  onlyKeys(event, ["name", "context"], eventAt, surfaceId, issues, "An event");
  if (typeof event.name !== "string" || !ACTION_NAME.test(event.name)) {
    issues.errors.push(failure(surfaceId, pointer(eventAt, "name"), `An event's "name" starts with a letter and uses letters, digits, _ . : or - (at most 64), like "create_workspace".`));
  }
  if (event.context === undefined) return;
  const contextAt = pointer(eventAt, "context");
  if (!isObject(event.context)) {
    issues.errors.push(failure(surfaceId, contextAt, `An event's "context" is an object of values or {"path": …} bindings.`));
    return;
  }
  const keys = Object.keys(event.context);
  if (keys.length > rules.limits.contextKeys) issues.errors.push(failure(surfaceId, contextAt, `An event's context holds at most ${rules.limits.contextKeys} values; bind a whole object with {"path": "/form"} instead.`));
  for (const key of keys.slice(0, rules.limits.contextKeys)) {
    const entry = event.context[key];
    const entryAt = pointer(contextAt, key);
    if (UNSAFE_SEGMENTS.has(key)) issues.errors.push(failure(surfaceId, entryAt, `${quote(key)} cannot be a context key.`));
    else if (isObject(entry) && !binding(rules, surfaceId, entry, entryAt, issues)) {
      issues.errors.push(failure(surfaceId, entryAt, `A context value is a string, number, boolean, array or {"path": …}; an object needs a binding.`));
    } else if (Array.isArray(entry) && entry.some((item) => item !== null && typeof item === "object")) {
      // Nothing inside an array is resolved, so a binding or an object there would reach the agent as written.
      issues.errors.push(failure(surfaceId, entryAt, `An array in the context holds strings, numbers and true or false; for a list from the data model use {"path": "/…"}.`));
    } else if (typeof entry === "string" && entry.length > rules.limits.textLength) {
      issues.errors.push(failure(surfaceId, entryAt, `This value is ${entry.length} characters; keep it to ${rules.limits.textLength}.`));
    }
  }
}

function checkOptions(rules, surfaceId, type, prop, value, at, issues) {
  if (binding(rules, surfaceId, value, at, issues)) return;
  if (!Array.isArray(value)) {
    issues.errors.push(failure(surfaceId, at, `${type} "options" is an array of {"label", "value"}, or {"path": "/…"}; got ${typeName(value)}.`));
    return;
  }
  if (value.length < (prop.minItems ?? 1)) issues.errors.push(failure(surfaceId, at, `${type} needs at least ${prop.minItems} options${type === "RadioGroup" ? "; for one yes or no choice use a Checkbox" : ""}.`));
  if (value.length > rules.limits.options) {
    issues.errors.push(failure(surfaceId, at, `${type} lists ${value.length} options; keep it to ${rules.limits.options}.`));
    return;
  }
  const seen = new Set();
  for (const [index, option] of value.entries()) {
    const optionAt = pointer(at, index);
    if (!isObject(option)) {
      issues.errors.push(failure(surfaceId, optionAt, `An option is {"label": "…", "value": "…"}; got ${typeName(option)}.`));
      continue;
    }
    onlyKeys(option, ["label", "value"], optionAt, surfaceId, issues, "An option");
    if (typeof option.label !== "string" || !option.label.trim() || option.label.length > rules.limits.labelLength) issues.errors.push(failure(surfaceId, pointer(optionAt, "label"), `An option's "label" is the words a person picks, 1 to ${rules.limits.labelLength} characters.`));
    if (typeof option.value !== "string" || !option.value || option.value.length > rules.limits.labelLength) issues.errors.push(failure(surfaceId, pointer(optionAt, "value"), `An option's "value" is the string sent back, 1 to ${rules.limits.labelLength} characters.`));
    else if (seen.has(option.value)) issues.errors.push(failure(surfaceId, pointer(optionAt, "value"), `Two options have the value ${quote(option.value)}; give each its own.`));
    else seen.add(option.value);
  }
}

function checkColumns(rules, surfaceId, prop, value, at, issues) {
  if (!Array.isArray(value) || value.length < (prop.minItems ?? 1)) {
    issues.errors.push(failure(surfaceId, at, `"columns" is a non-empty array of {"key", "label", "align"?}.`));
    return;
  }
  if (value.length > rules.limits.columns) {
    issues.errors.push(failure(surfaceId, at, `A table shows at most ${rules.limits.columns} columns; more cannot be read on a phone.`));
    return;
  }
  const seen = new Set();
  for (const [index, column] of value.entries()) {
    const columnAt = pointer(at, index);
    if (!isObject(column)) {
      issues.errors.push(failure(surfaceId, columnAt, `A column is {"key": "…", "label": "…"}; got ${typeName(column)}.`));
      continue;
    }
    onlyKeys(column, ["key", "label", "align"], columnAt, surfaceId, issues, "A column");
    if (typeof column.key !== "string" || !COLUMN_KEY.test(column.key) || UNSAFE_SEGMENTS.has(column.key)) issues.errors.push(failure(surfaceId, pointer(columnAt, "key"), `A column's "key" names the row field it shows: letters, digits, _ or -, like "order".`));
    else if (seen.has(column.key)) issues.errors.push(failure(surfaceId, pointer(columnAt, "key"), `Two columns have the key ${quote(column.key)}.`));
    else seen.add(column.key);
    checkText(rules, surfaceId, column.label, pointer(columnAt, "label"), { maxLength: rules.limits.labelLength }, true, issues, `The column's "label"`);
    if (column.align !== undefined && !prop.align.values.includes(column.align)) issues.errors.push(failure(surfaceId, pointer(columnAt, "align"), `"align" is ${list(prop.align.values)}.`));
  }
}

function checkRows(rules, surfaceId, value, at, issues) {
  if (binding(rules, surfaceId, value, at, issues)) return;
  if (!Array.isArray(value)) {
    issues.errors.push(failure(surfaceId, at, `"rows" is an array of objects, or {"path": "/…"} to one in the data model; got ${typeName(value)}.`));
    return;
  }
  if (value.length > rules.limits.rows) {
    issues.errors.push(failure(surfaceId, at, `A table holds at most ${rules.limits.rows} rows; page through the rest.`));
    return;
  }
  for (const [index, row] of value.entries()) {
    const rowAt = pointer(at, index);
    if (!isObject(row)) {
      issues.errors.push(failure(surfaceId, rowAt, `A row is an object keyed by column key; got ${typeName(row)}.`));
      continue;
    }
    for (const [key, cell] of Object.entries(row)) {
      if (cell === null || typeof cell === "number" || typeof cell === "boolean") continue;
      if (typeof cell === "string" && cell.length <= rules.limits.textLength) continue;
      issues.errors.push(failure(surfaceId, pointer(rowAt, key), typeof cell === "string" ? `A cell holds at most ${rules.limits.textLength} characters.` : `A cell holds text, a number or true/false; got ${typeName(cell)}.`));
    }
  }
}

/** Rules between props of one component: a range that holds its value, a value among the options. */
function checkValues(rules, surfaceId, type, definition, component, at, issues) {
  const literal = (name) => (typeof component[name] === "number" ? component[name] : definition.props[name]?.default);
  if (type === "Slider") {
    const min = literal("min");
    const max = literal("max");
    const step = literal("step");
    if (typeof min === "number" && typeof max === "number" && min >= max) issues.errors.push(failure(surfaceId, pointer(at, "max"), `Slider "max" (${max}) must be greater than "min" (${min}).`));
    if (typeof step === "number" && (step <= 0 || step > max - min)) issues.errors.push(failure(surfaceId, pointer(at, "step"), `Slider "step" is greater than 0 and at most max minus min.`));
    if (typeof component.value === "number" && (component.value < min || component.value > max)) issues.errors.push(failure(surfaceId, pointer(at, "value"), `Slider "value" ${component.value} is outside ${min} to ${max}.`));
  }
  if (type === "Progress") {
    const max = literal("max");
    if (typeof max === "number" && max <= 0) issues.errors.push(failure(surfaceId, pointer(at, "max"), `Progress "max" is greater than 0.`));
    if (typeof component.value === "number" && (component.value < 0 || component.value > max)) issues.errors.push(failure(surfaceId, pointer(at, "value"), `Progress "value" ${component.value} is outside 0 to ${max}.`));
  }
  if (type === "DatePicker") {
    // ISO dates sort as text, so the range is compared as written.
    const { min, max, value } = component;
    if (isDate(min) && isDate(max) && min > max) issues.errors.push(failure(surfaceId, pointer(at, "max"), `DatePicker "max" (${max}) comes before "min" (${min}); make it the later day.`));
    else if (isDate(value) && ((isDate(min) && value < min) || (isDate(max) && value > max))) issues.errors.push(failure(surfaceId, pointer(at, "value"), `DatePicker "value" ${value} is outside ${isDate(min) ? min : "any day"} to ${isDate(max) ? max : "any day"}.`));
  }
  if ((type === "Select" || type === "RadioGroup") && typeof component.value === "string" && Array.isArray(component.options)) {
    const values = component.options.filter(isObject).map((option) => option.value);
    if (!values.includes(component.value)) issues.errors.push(failure(surfaceId, pointer(at, "value"), `${type} "value" ${quote(component.value)} is not one of its options (${list(values)}).`));
  }
}

/* The tree ---------------------------------------------------------------- */

function childIds(node) {
  const value = node.props.children;
  if (Array.isArray(value)) return { ids: value.filter((id) => typeof id === "string"), template: null };
  if (isObject(value) && typeof value.componentId === "string") return { ids: [value.componentId], template: value };
  return { ids: [], template: null };
}

function checkTree(rules, surface, issues) {
  const { components } = surface;
  const root = components.get("root");
  if (!root) {
    issues.errors.push(failure(surface.id, surface.at, `No component has the id "root". One component is the root of the tree; give it "id": "root".`));
    return;
  }
  const parents = new Map();
  for (const node of components.values()) {
    const { ids, template } = childIds(node);
    const childrenAt = pointer(node.at, "children");
    for (const [index, id] of ids.entries()) {
      const at = template ? pointer(childrenAt, "componentId") : pointer(childrenAt, index);
      const child = components.get(id);
      if (!child) {
        issues.errors.push(failure(surface.id, at, `No component has the id ${quote(id)}. Add it, or remove it from ${node.type}'s children.`));
        continue;
      }
      if (id === node.id) {
        issues.errors.push(failure(surface.id, at, `${quote(id)} lists itself as a child: the children form a loop. A component cannot be inside its own tree.`));
        continue;
      }
      if (id === "root") {
        issues.errors.push(failure(surface.id, at, `"root" is the top of the tree and cannot be a child.`));
        continue;
      }
      const parent = parents.get(id);
      if (parent && parent !== node.id) {
        issues.errors.push(failure(surface.id, at, `${quote(id)} is already a child of ${quote(parent)}. A component appears in one place; give the second one its own id.`));
        continue;
      }
      parents.set(id, node.id);
      if (child.definition?.parents && node.definition && !child.definition.parents.includes(node.type)) {
        issues.errors.push(failure(surface.id, at, `${child.type} goes directly inside ${child.definition.parents.join(" or ")}, not inside ${node.type}.`));
      }
      if (node.definition?.accepts && child.definition && !node.definition.accepts.includes(child.type)) {
        issues.errors.push(failure(surface.id, at, `${node.type} holds only ${node.definition.accepts.join(" and ")} components; ${quote(id)} is a ${child.type}.`));
      }
    }
  }
  for (const node of components.values()) {
    if (node.definition?.parents && node.id !== "root" && !parents.has(node.id)) {
      issues.errors.push(failure(surface.id, node.at, `${node.type} goes directly inside ${node.definition.parents.join(" or ")}; list ${quote(node.id)} in one's children.`));
    }
  }

  // Depth-first from the root, in reading order, without recursion: a cycle
  // or a tree deeper than the limit is reported once, and the walk still ends.
  const visited = new Set(["root"]);
  const inTemplate = new Set();
  const order = [];
  const stack = [{ node: root, depth: 1, templated: false }];
  while (stack.length) {
    const { node, depth, templated } = stack.pop();
    order.push(node);
    if (templated) inTemplate.add(node.id);
    if (depth > rules.limits.depth) {
      issues.errors.push(failure(surface.id, node.at, `The tree is more than ${rules.limits.depth} levels deep at ${quote(node.id)}; flatten it.`));
      continue;
    }
    const { ids, template } = childIds(node);
    for (let index = ids.length - 1; index >= 0; index -= 1) {
      const child = components.get(ids[index]);
      if (!child || parents.get(child.id) !== node.id) continue;
      if (visited.has(child.id)) {
        issues.errors.push(failure(surface.id, pointer(node.at, "children"), `${quote(child.id)} contains itself: the children form a loop. A component cannot be inside its own tree.`));
        continue;
      }
      visited.add(child.id);
      stack.push({ node: child, depth: depth + 1, templated: templated || Boolean(template) });
    }
  }
  for (const node of components.values()) {
    if (!visited.has(node.id) && !(node.definition?.parents && !parents.has(node.id))) {
      issues.advice.push(advice(surface.id, node.at, `${quote(node.id)} is not inside "root", so it will not show. List it in a parent's children, or remove it.`));
    }
  }
  checkBindingsScope(rules, surface, order, inTemplate, issues);
  checkOutline(surface, order, issues);
}

/**
 * Relative paths ("name") resolve against a template's item, so they only
 * mean something inside one: in a prop, a template's own path, an action's
 * context or the accessibility words.
 */
function checkBindingsScope(rules, surface, order, inTemplate, issues) {
  const relative = (value) => isObject(value) && typeof value.path === "string" && !value.path.startsWith("/");
  const report = (value, at) => issues.errors.push(failure(surface.id, pointer(at, "path"), `${quote(value.path)} is relative, which only works inside a template; write it from the top of the data model, like "/${value.path}".`));
  for (const node of order) {
    if (inTemplate.has(node.id) || !node.definition) continue;
    for (const [name, value] of Object.entries(node.props)) {
      const at = pointer(node.at, name);
      if (name === "children") {
        if (relative(value)) issues.errors.push(failure(surface.id, pointer(at, "path"), `A template's "path" points at an array from the top of the data model, like "/${value.path}"; a relative path works only inside another template.`));
      } else if (name === "accessibility" && isObject(value)) {
        for (const key of ["label", "description"]) if (relative(value[key])) report(value[key], pointer(at, key));
      } else if (name === "action" && isObject(value) && isObject(value.event) && isObject(value.event.context)) {
        for (const [key, entry] of Object.entries(value.event.context)) if (relative(entry)) report(entry, pointer(at, "event", "context", key));
      } else if (relative(value)) report(value, at);
    }
  }
}

/** What a reader meets in order: headings that do not skip a level, one main action, fields told apart. */
function checkOutline(surface, order, issues) {
  let previous = 0;
  let primary = null;
  const labels = new Map();
  // A prop left out takes the catalog's default: a Button with no variant is primary.
  const value = (node, name) => node.props[name] ?? node.definition?.props[name]?.default;
  for (const node of order) {
    if (node.type === "Heading" && Number.isInteger(value(node, "level"))) {
      const level = value(node, "level");
      if (previous && level > previous + 1) {
        issues.errors.push(failure(surface.id, pointer(node.at, "level"), `This heading jumps from level ${previous} to ${level}; use ${previous + 1}. A screen reader uses the levels to move through the surface.`));
      }
      previous = level;
    }
    if (node.type === "Button" && value(node, "variant") === "primary") {
      if (primary) issues.advice.push(advice(surface.id, pointer(node.at, "variant"), `${quote(primary)} is already the primary action; keep one primary Button per surface and make this one "secondary".`));
      else primary = node.id;
    }
    const label = typeof node.props.label === "string" ? node.props.label.trim().toLowerCase() : null;
    if (label && node.definition?.group === "form") {
      if (labels.has(label)) issues.advice.push(advice(surface.id, pointer(node.at, "label"), `${quote(labels.get(label))} has the same label; give each field its own so they can be told apart.`));
      else labels.set(label, node.id);
    }
  }
}

/* Data model -------------------------------------------------------------- */

const ARRAY_INDEX = /^(0|[1-9][0-9]{0,5})$/;

/** The value at a JSON Pointer, or undefined; only the model's own keys, never a prototype's. */
function getAt(root, path) {
  if (path === "" || path === "/") return root;
  let target = root;
  for (const segment of path.slice(1).split("/").map(unescapeSegment)) {
    if (!isObject(target) && !Array.isArray(target)) return undefined;
    if (Array.isArray(target) && !ARRAY_INDEX.test(segment)) return undefined;
    target = Object.hasOwn(target, segment) ? target[segment] : undefined;
  }
  return target;
}

/**
 * Writes `value` at a JSON Pointer, creating objects on the way, as a
 * renderer applies updateDataModel. Inside an array a segment is an index
 * up to its length (the length appends), so a write never leaves a gap.
 */
function setAt(root, path, value) {
  if (path === "" || path === "/") return { root: value === undefined ? {} : value };
  const segments = path.slice(1).split("/").map(unescapeSegment);
  const top = isObject(root) || Array.isArray(root) ? root : {};
  let target = top;
  for (const [index, segment] of segments.entries()) {
    if (Array.isArray(target) && !ARRAY_INDEX.test(segment)) {
      return { error: `${quote(segments.slice(0, index).join("/") || "/")} holds an array, so the next segment is an index like 0, not ${quote(segment)}.` };
    }
    if (Array.isArray(target) && Number(segment) > target.length) {
      return { error: `${quote(segments.slice(0, index).join("/") || "/")} holds ${target.length} ${target.length === 1 ? "item" : "items"}, so the next index is at most ${target.length}, not ${segment}.` };
    }
    if (index === segments.length - 1) break;
    if (!isObject(target[segment]) && !Array.isArray(target[segment])) target[segment] = {};
    target = target[segment];
  }
  const last = segments.at(-1);
  if (value === undefined) delete target[last];
  else target[last] = value;
  return { root: top };
}

/* For the renderer's core (core.js), which reads and writes the same data model. */
export { childIds, getAt, isObject, setAt, unescapeSegment };

/* For people and agents --------------------------------------------------- */

/** The catalog as a guide an agent reads before composing a surface. */
export function renderCatalogGuide(rules) {
  const lines = [
    `# ${rules.title}`,
    "",
    rules.description,
    "",
    `Compose a surface as A2UI messages (version ${list(rules.protocolVersions)}):`,
    "",
    `1. {"version": "v0.9.1", "createSurface": {"surfaceId": "…", "catalogId": ${quote(rules.catalogId)}, "theme": {"name": ${quote(rules.defaultTheme)}, "mode": "system"}}}`,
    `2. {"version": "v0.9.1", "updateComponents": {"surfaceId": "…", "components": [{"id": "root", "component": "Stack", "children": […]}, …]}}`,
    `3. {"version": "v0.9.1", "updateDataModel": {"surfaceId": "…", "path": "/form", "value": {…}}} for the values inputs bind to.`,
    "",
    "Components are a flat list; containers name their children by id, and exactly one component has the id \"root\". Never set a color, size, class or style: pick the named values below.",
    "",
    `Themes: ${rules.themes.join(", ")} (default ${rules.defaultTheme}); modes: ${rules.modes.join(", ")}.`,
    "",
    "## Data and actions",
    "",
    "- Bind a field to the data model with {\"path\": \"/form/email\"}, and give it a starting value with updateDataModel.",
    "- To repeat a component for each item of an array, make a container's children a template: {\"componentId\": \"row\", \"path\": \"/items\"}. Inside it, relative paths ({\"path\": \"name\"}) read the item.",
    "- A Button's action is {\"event\": {\"name\": \"create_workspace\", \"context\": {\"form\": {\"path\": \"/form\"}}}}. When it is pressed, you receive an A2UI action with that name, the surfaceId, the Button's id and the context, each binding replaced by its value at that moment. It is input from a person: check it before you act on it.",
    "",
    "## Coming from A2UI's basic catalog",
    "",
    `- Use the Mlola name: ${Object.entries(rules.aliases).map(([name, target]) => `${name} is ${target}`).join(", ")}.`,
    ...Object.entries(rules.borrowed.components).map(([name, hint]) => `- ${name} is not in the catalog. ${hint}`),
    ...Object.entries(rules.borrowed.props).map(([key, hint]) => `- \`${key.replace(/=(.*)$/, ': "$1"')}\`: ${hint}`),
    "- Client-side functions and checks (functionCall, checks, {\"call\": …}) are not in the catalog: mark fields \"required\" and check values when the action arrives.",
    "",
  ];
  for (const [title, names] of catalogGroups(rules)) {
    lines.push(`## ${title}`, "");
    for (const [name, definition] of names.map((name) => [name, rules.components[name]])) {
      const placement = [definition.parents ? `Goes directly inside ${definition.parents.join(" or ")}.` : "", definition.accepts ? `Holds only ${definition.accepts.join(" and ")}.` : ""].filter(Boolean).join(" ");
      lines.push(`### ${name}`, "", `${definition.description}${placement ? ` ${placement}` : ""}`, "");
      for (const [prop, spec] of Object.entries(definition.props)) {
        lines.push(`- \`${prop}\`${spec.required ? " (required)" : ""}: ${describeKind(spec)}${spec.default !== undefined ? `, default ${quote(spec.default)}` : ""}${spec.description ? `. ${spec.description}` : ""}`);
      }
      lines.push("");
    }
  }
  if (rules.examples?.length) {
    lines.push("## Examples", "");
    for (const example of rules.examples) {
      lines.push(`### ${example.title}`, "", example.description, "", "```json", "[", example.messages.map((message) => `  ${JSON.stringify(message)}`).join(",\n"), "]", "```", "");
    }
  }
  lines.push(
    "## What the check holds",
    "",
    "- Every component and prop is in the catalog; values are ones the component offers.",
    "- Every field, control, table and tab group has a name a screen reader reads.",
    "- One root, every child exists, a component appears in one place, no loops.",
    "- Headings do not skip a level going deeper.",
    "- A Slider's or DatePicker's value sits in its range; a Select's value is one of its options.",
    "- Data paths are JSON Pointers; relative paths only inside a template.",
    `- At most ${rules.limits.components} components and ${rules.limits.depth} levels on a surface, ${rules.limits.surfaces} surfaces open at once and ${rules.limits.messages} messages in a call.`,
  );
  return `${lines.join("\n")}\n`;
}

function describeKind(spec) {
  switch (spec.kind) {
    case "enum":
      return list(spec.values);
    case "text":
      return `text or {"path"}${spec.maxLength ? `, at most ${spec.maxLength} characters` : ""}`;
    case "boolean":
      return spec.literal ? "true or false" : `true, false or {"path"}`;
    case "number":
      return spec.literal ? "a number" : `a number or {"path"}`;
    case "integer":
      return `a whole number from ${spec.minimum} to ${spec.maximum}`;
    case "date":
      return spec.literal ? `an ISO date like "2026-10-12"` : `an ISO date like "2026-10-12", or {"path"}`;
    case "children":
      return `an array of component ids, or a template {"componentId", "path"}${spec.minItems ? `, at least ${spec.minItems}` : ""}`;
    case "action":
      return `{"event": {"name", "context"}}`;
    case "options":
      return `an array of {"label", "value"}, or {"path"}${spec.minItems ? `, at least ${spec.minItems}` : ""}`;
    case "columns":
      return `an array of {"key", "label", "align"?}; align is ${list(spec.align.values)}`;
    case "rows":
      return `an array of objects keyed by column key, or {"path"}`;
    default:
      return spec.kind;
  }
}

/** A report as lines a person reads in a terminal or an agent reads in a tool result. */
export function formatRenderReport(result) {
  const lines = [];
  for (const error of result.errors) lines.push(`error ${error.path || "/"}${error.surfaceId ? ` [${error.surfaceId}]` : ""}: ${error.message}`);
  for (const note of result.advice) lines.push(`advice ${note.path || "/"}${note.surfaceId ? ` [${note.surfaceId}]` : ""}: ${note.message}`);
  const live = result.surfaces.filter((surface) => !surface.deleted);
  if (result.valid) {
    lines.unshift(`Valid: ${live.map((surface) => `${quote(surface.surfaceId)} (${surface.components} ${surface.components === 1 ? "component" : "components"}, ${surface.theme.name} ${surface.theme.mode})`).join(", ") || "no surface left after these messages"}.`);
  } else {
    lines.unshift(`${result.errors.length} ${result.errors.length === 1 ? "error" : "errors"}: nothing renders until ${result.errors.length === 1 ? "it is" : "they are"} fixed.`);
  }
  return lines.join("\n");
}
