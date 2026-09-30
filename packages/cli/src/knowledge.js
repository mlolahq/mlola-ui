import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG, interpolateTarget } from "./config.js";
import { BUNDLED_REGISTRY_ROOT, loadRegistry, readJson, sourcePath } from "./registry.js";

/**
 * What the CLI knows about Mlola UI, as answers rather than files: every
 * component and catalog item, the tokens, the rules for new UI, and the
 * element contract markup is checked against. All of it is read from the
 * registry bundled with this CLI, so an answer always matches the version
 * that `add` installs, and it works offline.
 */

const cache = new Map();
function bundled(name) {
  if (!cache.has(name)) {
    const filename = path.join(BUNDLED_REGISTRY_ROOT, name);
    cache.set(name, fs.existsSync(filename) ? (name.endsWith(".json") ? readJson(filename) : fs.readFileSync(filename, "utf8")) : null);
  }
  return cache.get(name);
}

const KIND = { "registry:ui": "component", "registry:block": "block", "registry:page": "page", "registry:template": "template" };

/** Every item, free and Pro, in one shape. */
export function allItems() {
  const registry = loadRegistry();
  const free = registry.items.map((item) => ({
    name: item.name,
    kind: KIND[item.type] ?? "component",
    tier: "free",
    title: item.title,
    description: item.description,
    category: item.category,
    tags: item.tags ?? [],
    variants: item.variants ?? [],
    sizes: item.sizes ?? [],
  }));
  const pro = (bundled("catalog.json")?.items ?? []).map((item) => ({
    name: item.name,
    kind: KIND[item.type] ?? "component",
    tier: "pro",
    title: item.title,
    description: item.description,
    category: item.category,
    tags: item.tags ?? [],
    variants: [],
    sizes: [],
  }));
  return [...free, ...pro];
}

/**
 * Items matching a query, searched in the name, title, description, category
 * and tags. Items that match every word come first; when none does, the items
 * that match the most words, so "radio card" still finds the radio group. A
 * plural matches its singular, and "stat-card" reads as "stat card".
 */
export function searchItems({ query = "", kind, category, tier } = {}) {
  const words = query.toLowerCase().split(/[\s-]+/).filter(Boolean);
  const forms = (word) => [word, ...(word.length > 3 && word.endsWith("s") ? [word.slice(0, -1)] : [])];
  const scored = allItems()
    .filter((item) => (!kind || item.kind === kind) && (!category || item.category === category) && (!tier || item.tier === tier))
    .map((item) => {
      const haystack = [item.name, item.title, item.description, item.category, ...item.tags].join(" ").toLowerCase();
      let matched = 0;
      let score = 0;
      for (const word of words) {
        const hit = Math.max(...forms(word).map((form) => (item.name === form ? 5 : item.name.includes(form) ? 3 : haystack.includes(form) ? 1 : 0)));
        if (hit) matched += 1;
        score += hit;
      }
      return { item, score, matched };
    });
  const best = Math.max(0, ...scored.map(({ matched }) => matched));
  return scored
    .filter(({ matched }) => !words.length || (best > 0 && matched === best))
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .map(({ item }) => item);
}

/** " Did you mean: …?" for a name that is not an item, or nothing. */
export function suggest(name) {
  const close = [...new Set([...allItems().filter((entry) => entry.name.includes(name) || name.includes(entry.name)).map((entry) => entry.name), ...searchItems({ query: name }).map((entry) => entry.name)])].slice(0, 5);
  return close.length ? ` Did you mean: ${close.join(", ")}?` : "";
}

/** The classes a component styles (its own prefix) and the attributes each reacts to. */
function elementsOf(name) {
  const contract = bundled("contract.json");
  if (!contract) return [];
  const prefix = `ml-${name}`;
  return contract.classes
    .filter((cls) => cls === prefix || cls.startsWith(`${prefix}-`))
    .map((cls) => ({ class: cls, attributes: contract.elements[cls] ?? {} }));
}

function projectConfig(cwd) {
  try {
    return readJson(path.join(cwd, "mlola.config.json"));
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Everything an agent needs to use one item correctly. */
export function describeItem(requested, { cwd = process.cwd(), includeSource = false } = {}) {
  // Agents often ask by class ("ml-button") or title ("Date picker"): both mean the item.
  const name = requested.trim().toLowerCase().replace(/^ml-/, "").replace(/\s+/g, "-");
  const registry = loadRegistry();
  const item = registry.items.find((entry) => entry.name === name);
  if (!item) {
    const pro = (bundled("catalog.json")?.items ?? []).find((entry) => entry.name === name);
    if (pro) {
      return {
        name,
        tier: "pro",
        kind: KIND[pro.type] ?? "component",
        title: pro.title,
        description: pro.description,
        category: pro.category,
        install: `npx mlola-ui login <token>   # once, with a token from https://ui.mlola.com/account\nnpx mlola-ui add ${name}`,
        note: "Part of Mlola Pro. Its source arrives with a license token; its classes and attributes are listed in mlola-pro.agents.md after the first Pro install.",
      };
    }
    throw new Error(`No item named "${requested}".${suggest(name)} Search with search_components.`);
  }
  const config = projectConfig(cwd);
  const usage = item.usage
    ? { import: `import { ${item.usage.exportName} } from "${interpolateTarget(item.usage.importPath, config, "import")}";`, exportName: item.usage.exportName }
    : null;
  const result = {
    name,
    tier: "free",
    kind: KIND[item.type] ?? "component",
    title: item.title,
    description: item.description,
    category: item.category,
    variants: item.variants ?? [],
    sizes: item.sizes ?? [],
    // Every prop with a fixed set of values, read from the TypeScript source.
    options: item.options ?? [],
    usage,
    install: `npx mlola-ui add ${name}`,
    dependsOn: item.registryDependencies ?? [],
    engineDependencies: item.engineDependencies ?? {},
    // Every class the component's stylesheet defines, when its example lists them.
    elements: bundled("examples.json")?.[name]?.elements ?? elementsOf(name),
  };
  // The same example the docs show: React, the HTML it renders, and the
  // framework-free markup when @mlola-ui/behavior drives it.
  const example = bundled("examples.json")?.[name];
  if (example) {
    result.example = {
      react: example.react,
      html: example.behavior?.html ?? example.html,
      script: example.needs === "behavior" ? `@mlola-ui/behavior, data-ml="${example.behavior.name}"` : example.needs === "nothing" ? "none" : "React, or your own script setting the attributes",
    };
  }
  if (includeSource) {
    result.source = (item.files ?? [])
      .filter((file) => !file.path.includes("/_internal/"))
      .map((file) => ({ path: interpolateTarget(file.target, config), content: fs.readFileSync(sourcePath(file.path), "utf8") }));
  }
  return result;
}

export function designData() {
  return bundled("agents.json");
}

export function designGuide() {
  return bundled("agents.md");
}

export function tokens(group) {
  const data = designData();
  if (!data) return [];
  const groups = data.tokens;
  if (!group) return groups;
  const wanted = group.toLowerCase();
  return groups.filter((entry) => entry.group.toLowerCase().includes(wanted) || entry.names.some((name) => name.includes(wanted)));
}

export function themes() {
  const registry = loadRegistry();
  return registry.themes ?? designData()?.themes ?? [];
}

/* ── Checking markup against the contract ─────────────────────────── */

const SHARED = new Set(["data-tone", "data-variant", "data-size", "data-state", "data-status"]);
const UTILITY = /^(-?(m|p)[trblxy]?-\d|flex$|grid$|block$|inline|hidden$|items-|justify-|gap-|w-|h-|min-|max-|text-(xs|sm|base|lg|xl|\d|[a-z]+-\d)|font-(bold|medium|semibold|light)|bg-|border-|rounded|shadow|ring-|space-[xy]-|leading-|tracking-|opacity-|z-\d|absolute$|relative$|fixed$|sticky$|overflow-|col-span|row-span|sm:|md:|lg:|xl:|hover:|focus:|dark:)/;
const COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/i;
/** A margin-left utility (ml-4, ml-auto), which only looks like a Mlola class. */
const MARGIN_UTILITY = /^-?ml-(?:\d|auto$|px$|\[)/;
/** An arbitrary value in a utility class: a color (bg-[#fafafa]) or a spacing length (p-[13px]) typed by hand. */
const ARBITRARY_COLOR = /-\[(#[0-9a-f]{3,8}|(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\([^\]]*\))\]$/i;
const ARBITRARY_SPACING = /^(?:[\w-]+:)*-?(?:[pm][trblxyse]?|gap(?:-[xy])?|space-[xy]|inset(?:-[xy])?|top|right|bottom|left)-\[(-?(?:\d*\.)?\d+(?:px|rem|em))\]$/;
const COLORS = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\([^)]*\)/gi;
const LENGTH = /-?(?:\d*\.)?\d+(?:px|rem|em)\b/g;

/*
 * Spacing written by hand: a padding, margin, gap or inset whose length is
 * not read from the scale. The guide asks for --ml-space-*; a calc() or
 * clamp() of scale steps reads a token and passes, and 0, auto and
 * percentages are not measures anyone invented.
 */
const SPACING_CSS = /(?:^|[;{\s])((?:padding|margin|inset)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?|(?:row-|column-)?gap)\s*:\s*([^;}]+)/gi;
const SPACING_JS = /(?:^|[{,\s])((?:padding|margin|inset)(?:Top|Right|Bottom|Left|Inline|Block)?(?:Start|End)?|(?:row|column)?[gG]ap)\s*:\s*("[^"]*"|'[^']*'|`[^`]*`|-?\d+(?:\.\d+)?(?=\s*[,}]))/g;
const byHand = (value) => !/var\(--ml-/.test(value) && [...value.matchAll(LENGTH)].some((length) => parseFloat(length[0]) !== 0);

/** The lengths a hand-written spacing declaration uses (a bare JSX number is pixels), for counting drift. */
const lengthsOf = (declarations) =>
  declarations.flatMap((declaration) => {
    const value = declaration.slice(declaration.indexOf(":") + 1).trim();
    if (/^-?\d+(?:\.\d+)?$/.test(value)) return [`${Number(value)}px`];
    return [...value.matchAll(LENGTH)].map((length) => length[0]).filter((length) => parseFloat(length) !== 0);
  });

/** Text of the same length with nothing in it, so what is left keeps its offsets. */
const blank = (text) => text.replace(/[^\n]/g, " ");

/** A color derived from a token (oklch(from var(--ml-primary-text) l c h / 50%)) follows the theme, so it is not written by hand. */
const underived = (text) => text.replace(/\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(\s*from\s+var\(--ml-[\w-]+\)[^)]*\)/gi, blank);

/** The colors a declaration writes by hand, lower-cased so #FFF and #fff count once. */
const colorsOf = (text) => [...underived(text).matchAll(COLORS)].map((match) => match[0].toLowerCase().replace(/\s+/g, " "));

/** Each spacing property in a style string, a JSX style object or a stylesheet whose length is written by hand. */
function handSpacing(text) {
  const found = new Map();
  for (const [, property, value] of text.matchAll(SPACING_CSS)) if (byHand(value)) found.set(property, `${property}: ${value.trim()}`);
  for (const [, property, raw] of text.matchAll(SPACING_JS)) {
    // A bare number in a JSX style object is pixels.
    const handWritten = /^-?\d/.test(raw) ? Number(raw) !== 0 : byHand(raw.slice(1, -1));
    if (handWritten) found.set(property, `${property}: ${raw}`);
  }
  return [...found.values()];
}

const SPACING_FIX = "Measure with the scale: var(--ml-space-2), var(--ml-space-4)… (get_tokens spacing). A calc() or clamp() of scale steps is fine; a value invented between them is not.";

/** Every opening tag in HTML or JSX, with its string-valued attributes. */
export function tagsOf(markup) {
  const tags = [];
  for (const match of markup.matchAll(/<([A-Za-z][\w.-]*)((?:\s+(?:[^\s"'>={}]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\}))?))*)\s*\/?>/g)) {
    const attributes = new Map();
    for (const attribute of match[2].matchAll(/([^\s"'>={}]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\{(?:[^{}]|\{[^{}]*\})*\})))?/g)) {
      const [, name, double, single, expression] = attribute;
      let value = double ?? single ?? (expression ? /^\{\s*["'`]([^"'`$]*)["'`]\s*\}$/.exec(expression)?.[1] ?? null : "");
      // Markup built in a script string ('<span data-tone="' + tone + '">') is only known at runtime.
      if (typeof value === "string" && /['"`]\s*\+|\+\s*['"`]|\$\{/.test(value)) value = null;
      attributes.set(name, value);
      if (expression) attributes.set(`${name}:raw`, expression);
    }
    const classValue = attributes.get("class") ?? attributes.get("className");
    tags.push({ tag: match[0], index: match.index, attributes, classes: typeof classValue === "string" ? classValue.split(/\s+/).filter(Boolean) : [] });
  }
  return tags;
}

let knownValues = null;
/**
 * The values each element may carry on each shared attribute: the ones its
 * stylesheet draws, the ones its component's props declare, and the ones the
 * component renders in its example. A default such as data-size="md" is
 * rendered but not drawn, and is as correct as any other.
 */
function valuesByElement() {
  if (knownValues) return knownValues;
  knownValues = new Map();
  const add = (cls, attribute, values) => {
    if (!knownValues.has(cls)) knownValues.set(cls, new Map());
    const byAttribute = knownValues.get(cls);
    if (!byAttribute.has(attribute)) byAttribute.set(attribute, new Set());
    for (const value of values) byAttribute.get(attribute).add(value);
  };
  for (const [cls, attributes] of Object.entries(bundled("contract.json")?.elements ?? {})) {
    for (const [attribute, values] of Object.entries(attributes)) add(cls, attribute, values);
  }
  const examples = bundled("examples.json") ?? {};
  // Every value a component's showcase renders, each variant and state.
  for (const example of Object.values(examples)) {
    for (const [cls, attributes] of Object.entries(example.rendered ?? {})) {
      for (const [attribute, list] of Object.entries(attributes)) add(cls, attribute, list);
    }
  }
  for (const item of loadRegistry().items) {
    const classes = examples[item.name]?.elements?.map((element) => element.class) ?? [];
    for (const option of item.options ?? []) {
      for (const cls of classes) add(cls, `data-${option.prop}`, option.values);
    }
  }
  for (const example of Object.values(examples)) {
    for (const html of [example.html, example.behavior?.html]) {
      if (!html) continue;
      for (const { attributes, classes } of tagsOf(html)) {
        for (const [name, value] of attributes) {
          if (!SHARED.has(name) || typeof value !== "string") continue;
          for (const cls of classes) if (cls.startsWith("ml-")) add(cls, name, [value]);
        }
      }
    }
  }
  return knownValues;
}

/**
 * The classes some stylesheets define and the data-* values each element
 * takes: the ones the CSS draws, and the ones the markup renders itself (a
 * default such as data-tone="primary" is drawn by the base rule, and as
 * correct as any other). Pro's classes are not published, so a check learns
 * them this way from the Pro items a project has installed.
 */
export function contractFrom({ stylesheets = [], markups = [] } = {}) {
  const classes = new Set();
  const elements = new Map();
  const add = (cls, attribute, value) => {
    if (!elements.has(cls)) elements.set(cls, new Map());
    if (!elements.get(cls).has(attribute)) elements.get(cls).set(attribute, new Set());
    elements.get(cls).get(attribute).add(value);
  };
  for (const text of stylesheets) {
    const css = text.replace(/\/\*[\s\S]*?\*\//g, "");
    for (const match of css.matchAll(/\.(ml-[a-z0-9-]+)/g)) classes.add(match[1]);
    for (const match of css.matchAll(/\.(ml-[a-z0-9-]+)((?:\[data-[a-z-]+(?:=["']?[^\]"']*["']?)?\])+)/g)) {
      for (const [, attribute, value] of match[2].matchAll(/\[(data-[a-z-]+)=["']?([^\]"']*)["']?\]/g)) add(match[1], attribute, value);
    }
  }
  for (const markup of markups) {
    for (const { attributes, classes: rendered } of tagsOf(markup)) {
      for (const [name, value] of attributes) {
        if (!name.startsWith("data-") || typeof value !== "string" || !value) continue;
        for (const cls of rendered) if (classes.has(cls)) add(cls, name, value);
      }
    }
  }
  return { classes, elements };
}

/**
 * Checks HTML or JSX against the element contract. It reads string-valued
 * class, className, style and data-* attributes; expressions in braces are
 * skipped, since their value is only known at runtime.
 *
 * Each issue names its line, the rule it breaks (`rule`) and, for a color or
 * a spacing written by hand, the values themselves (`values`), which
 * `mlola-ui check` counts as drift across a project.
 *
 * `themes` adds the project's own theme ids; `contract` (from contractFrom)
 * adds the classes and values of the Pro items the project installed.
 */
export function checkMarkup(markup, { themes: ownThemes = [], contract: installed } = {}) {
  const contract = bundled("contract.json");
  const known = new Set([...(contract?.classes ?? []), ...(installed?.classes ?? [])]);
  const proPrefixes = (bundled("catalog.json")?.items ?? []).map((item) => `ml-${item.name}`);
  // The five themes, and the project's own (mlola.theme.json) when the caller knows the project.
  const themeIds = new Set([...themes().map((theme) => theme.id), ...ownThemes]);
  const tokenNames = new Set((designData()?.tokens ?? []).flatMap((group) => group.names));
  const shared = valuesByElement();
  const values = {
    get: (cls) => {
      const own = installed?.elements.get(cls);
      if (!own) return shared.get(cls);
      const merged = new Map(shared.get(cls) ?? []);
      for (const [attribute, list] of own) merged.set(attribute, new Set([...(merged.get(attribute) ?? []), ...list]));
      return merged;
    },
  };
  const issues = [];
  const breaks = [];
  for (let index = markup.indexOf("\n"); index !== -1; index = markup.indexOf("\n", index + 1)) breaks.push(index);
  const lineAt = (offset) => {
    let low = 0;
    let high = breaks.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (breaks[middle] < offset) low = middle + 1;
      else high = middle;
    }
    return low + 1;
  };
  let at = 0;
  const note = (severity, tag, message, fix, rule, values) =>
    issues.push({ severity, line: lineAt(at), rule, element: tag.slice(0, 120), message, ...(fix ? { fix } : {}), ...(values?.length ? { values } : {}) });

  for (const { tag, index, attributes, classes } of tagsOf(markup)) {
    // An issue points at its attribute, so a tag written over several lines reports the right one.
    const attributeAt = (pattern) => {
      const found = tag.search(pattern);
      at = index + Math.max(0, found);
    };
    attributeAt(/\sclass(?:Name)?\s*=/);
    const mlola = classes.filter((cls) => cls.startsWith("ml-") && !MARGIN_UTILITY.test(cls));

    for (const cls of mlola) {
      if (known.has(cls) || proPrefixes.some((prefix) => cls === prefix || cls.startsWith(`${prefix}-`))) continue;
      const base = [...known].find((candidate) => cls.startsWith(`${candidate}-`) && elementsOf(candidate.slice(3)).length);
      note(
        "error",
        tag,
        `"${cls}" is not a Mlola class.`,
        base ? `Mlola has no variant classes: use "${base}" with a data-* attribute (data-variant, data-tone, data-size).` : "Search with search_components, or name your own element with your own prefix (not ml-).",
        base ? "variant-class" : "unknown-class",
      );
    }
    const utilities = classes.filter((cls) => (!cls.startsWith("ml-") || MARGIN_UTILITY.test(cls)) && UTILITY.test(cls));
    if (utilities.length) {
      note("warning", tag, `Utility classes (${utilities.slice(0, 4).join(" ")}) do nothing here: Mlola ships no utility framework.`, "Use a component or composition primitive; for your own CSS, read --ml-* tokens.", "utility-class");
    }
    // Values typed into utility classes are drift whichever framework reads them.
    const arbitraryColors = classes.map((cls) => ARBITRARY_COLOR.exec(cls)).filter(Boolean);
    if (arbitraryColors.length) {
      note("error", tag, `A color is written by hand in a class (${arbitraryColors.map((match) => match.input).slice(0, 4).join(" ")}).`, "Read a token: var(--ml-text), var(--ml-primary-text), var(--ml-surface)… (get_tokens).", "color", arbitraryColors.map((match) => match[1].toLowerCase()));
    }
    const arbitrarySpacing = classes.map((cls) => ARBITRARY_SPACING.exec(cls)).filter(Boolean);
    if (arbitrarySpacing.length) {
      note("warning", tag, `Spacing is written by hand in a class (${arbitrarySpacing.map((match) => match.input).slice(0, 4).join(" ")}).`, SPACING_FIX, "spacing", arbitrarySpacing.map((match) => match[1]));
    }

    for (const [name, value] of attributes) {
      if (!name.startsWith("data-") || typeof value !== "string") continue;
      attributeAt(new RegExp(`\\s${name}\\s*=`));
      if (name === "data-theme" && value && !themeIds.has(value) && !/^th-[0-9a-z]{12}$/.test(value)) {
        note("error", tag, `data-theme="${value}" is not a theme.`, `Use one of: ${[...themeIds].join(", ")}, or a Studio theme id.`, "theme");
      }
      if (name === "data-mode" && !["light", "dark", "system"].includes(value)) {
        note("error", tag, `data-mode is "light", "dark" or "system"; "${value}" belongs in an attribute of your own.`, "data-theme and data-mode belong to the engine. Use data-kind or data-state for a component's own meaning.", "mode");
      }
      if (!SHARED.has(name) || !mlola.length) continue;
      const allowed = new Set();
      for (const cls of mlola) for (const entry of values.get(cls)?.get(name) ?? []) allowed.add(entry);
      if (allowed.size && !allowed.has(value)) {
        note("error", tag, `${name}="${value}" is not a value ${mlola.join(" ")} takes.`, `Allowed: ${[...allowed].sort().join(", ")}.`, "value");
      } else if (!allowed.size && mlola.every((cls) => known.has(cls))) {
        note("warning", tag, `${name} has no effect on ${mlola.join(" ")}.`, `See get_component for the attributes it reacts to.`, "no-effect");
      }
    }

    // A color written by hand in a style string or a JSX style object. A
    // component's own custom property carries data (a swatch's color); a
    // theme token set inline overrides the theme and is flagged too.
    const style = attributes.get("style") ?? attributes.get("style:raw");
    if (typeof style === "string") {
      attributeAt(/\sstyle\s*=/);
      // A custom property is named bare in CSS and quoted in a JSX style object ("--ml-color": …).
      const overridden = [...style.matchAll(/(--ml-[\w-]+)["']?\s*:/g)].map((match) => match[1]).filter((token) => tokenNames.has(token));
      const declarations = underived(style.replace(/["']?--[\w-]+["']?\s*:[^;,}]*/g, ""));
      if (COLOR.test(declarations)) {
        note("error", tag, "A color is written by hand in style.", "Read a token: var(--ml-text), var(--ml-primary-text), var(--ml-surface)… (get_tokens).", "color", colorsOf(declarations));
      }
      if (overridden.length) {
        note("error", tag, `${overridden.join(", ")} is a theme token; setting it inline overrides the theme.`, "Pick a theme, or change the theme's spec (mlola.theme.json), instead of one element's tokens.", "theme-token");
      }
      const spacing = handSpacing(style);
      if (spacing.length) note("warning", tag, `Spacing is written by hand in style (${spacing.join("; ")}).`, SPACING_FIX, "spacing", lengthsOf(spacing));
    }
  }

  // The page's own stylesheet: the same rules hold in a <style> block.
  for (const block of markup.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
    // Comments become blanks of the same length, so every offset still points into the markup.
    const css = block[1].replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
    let offset = block.index + block[0].indexOf(">") + 1;
    for (const rule of css.split("}")) {
      const start = offset;
      offset += rule.length + 1;
      const open = rule.lastIndexOf("{");
      if (open < 0) continue;
      const bodyAt = start + open + 1;
      at = bodyAt;
      const selector = rule.slice(0, open).split("{").pop().trim();
      // A keyframe (from, to, 50%) is a step of an animation, not a rule for text at rest.
      if (/^(from|to|\d+(\.\d+)?%)(\s*,\s*(from|to|\d+(\.\d+)?%))*$/i.test(selector)) continue;
      // url() and custom properties are blanked, not removed, so a match's index is its place in the markup.
      const body = rule.slice(open + 1).replace(/url\([^)]*\)/g, blank);
      const own = underived(body.replace(/--[\w-]+\s*:[^;]*/g, blank));
      const pointAt = (found) => {
        at = bodyAt + Math.max(0, found);
      };
      const where = `<style> ${selector}`;
      const overridden = [...body.matchAll(/(--ml-[\w-]+)\s*:/g)].map((match) => match[1]).filter((token) => tokenNames.has(token));
      if (COLOR.test(own)) {
        pointAt(own.search(COLOR));
        note("error", where, "A color is written by hand in the stylesheet.", "Read a token: var(--ml-text), var(--ml-primary-text), var(--ml-surface)… (get_tokens). The theme then keeps its contrast in every mode.", "color", colorsOf(own));
      }
      if (overridden.length) {
        pointAt(body.indexOf(overridden[0]));
        note("error", where, `${overridden.join(", ")} is a theme token; setting it here overrides the theme.`, "Pick a theme, or change the theme's spec (mlola.theme.json), instead of redefining its tokens.", "theme-token");
      }
      const spacing = handSpacing(body);
      if (spacing.length) pointAt(body.search(new RegExp(`(?:^|[;{\\s])${spacing[0].slice(0, spacing[0].indexOf(":"))}\\s*:`)) + 1);
      if (spacing.length) note("warning", where, `Spacing is written by hand (${spacing.join("; ")}).`, SPACING_FIX, "spacing", lengthsOf(spacing));
      // Faded text: its contrast now depends on the theme behind it.
      // opacity: 0 hides; only a value between 0 and 1 fades what is still read.
      const opacity = /(?:^|;)\s*opacity\s*:\s*(0?\.\d+)\s*(?:;|$)/.exec(body);
      // A shape (an SVG area, line or mark, painted with fill or stroke) holds no text to fade.
      const shape = /(?:^|;)\s*(?:fill|stroke)\s*:/.test(body) || /\b(?:path|rect|circle|ellipse|line|polyline|polygon|svg)\b/.test(selector);
      if (opacity && Number(opacity[1]) > 0 && !shape && !/disabled|:empty|::?placeholder|\[hidden\]|inert/.test(selector)) {
        pointAt(opacity.index + opacity[0].indexOf("opacity"));
        note("warning", where, `opacity: ${opacity[1]} fades whatever text is inside, and how far it falls below the contrast floor depends on the theme and the fill behind it.`, "For quieter text use color: var(--ml-text-muted); on a filled control, its -foreground role. Keep opacity for disabled or decorative parts.", "opacity");
      }
    }
  }
  return issues;
}
