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

/** Items matching a query: every word must appear in the name, title, description, category or tags. */
export function searchItems({ query = "", kind, category, tier } = {}) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return allItems()
    .filter((item) => (!kind || item.kind === kind) && (!category || item.category === category) && (!tier || item.tier === tier))
    .map((item) => {
      const haystack = [item.name, item.title, item.description, item.category, ...item.tags].join(" ").toLowerCase();
      const score = words.reduce((sum, word) => sum + (item.name === word ? 5 : item.name.includes(word) ? 3 : haystack.includes(word) ? 1 : -100), 0);
      return { item, score };
    })
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .map(({ item }) => item);
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
export function describeItem(name, { cwd = process.cwd(), includeSource = false } = {}) {
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
    const close = allItems().filter((entry) => entry.name.includes(name) || name.includes(entry.name)).map((entry) => entry.name).slice(0, 5);
    throw new Error(`No item named "${name}".${close.length ? ` Did you mean: ${close.join(", ")}?` : ""} Search with search_components.`);
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
    usage,
    install: `npx mlola-ui add ${name}`,
    dependsOn: item.registryDependencies ?? [],
    engineDependencies: item.engineDependencies ?? {},
    elements: elementsOf(name),
  };
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

/**
 * Checks HTML or JSX against the element contract. It reads string-valued
 * class, className, style and data-* attributes; expressions in braces are
 * skipped, since their value is only known at runtime.
 */
export function checkMarkup(markup) {
  const contract = bundled("contract.json");
  const known = new Set(contract?.classes ?? []);
  const proPrefixes = (bundled("catalog.json")?.items ?? []).map((item) => `ml-${item.name}`);
  const themeIds = new Set(themes().map((theme) => theme.id));
  const issues = [];
  const note = (severity, tag, message, fix) => issues.push({ severity, element: tag.slice(0, 120), message, ...(fix ? { fix } : {}) });

  for (const match of markup.matchAll(/<([A-Za-z][\w.-]*)((?:\s+(?:[^\s"'>={}]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|\{(?:[^{}]|\{[^{}]*\})*\}))?))*)\s*\/?>/g)) {
    const tag = match[0];
    const attributes = new Map();
    for (const attribute of match[2].matchAll(/([^\s"'>={}]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\{(?:[^{}]|\{[^{}]*\})*\})))?/g)) {
      const [, name, double, single, expression] = attribute;
      const value = double ?? single ?? (expression ? /^\{\s*["'`]([^"'`$]*)["'`]\s*\}$/.exec(expression)?.[1] ?? null : "");
      attributes.set(name, value);
      if (expression) attributes.set(`${name}:raw`, expression);
    }
    const classValue = attributes.get("class") ?? attributes.get("className");
    const classes = typeof classValue === "string" ? classValue.split(/\s+/).filter(Boolean) : [];
    const mlola = classes.filter((cls) => cls.startsWith("ml-"));

    for (const cls of mlola) {
      if (known.has(cls) || proPrefixes.some((prefix) => cls === prefix || cls.startsWith(`${prefix}-`))) continue;
      const base = [...known].find((candidate) => cls.startsWith(`${candidate}-`) && elementsOf(candidate.slice(3)).length);
      note(
        "error",
        tag,
        `"${cls}" is not a Mlola class.`,
        base ? `Mlola has no variant classes: use "${base}" with a data-* attribute (data-variant, data-tone, data-size).` : "Search with search_components, or name your own element with your own prefix (not ml-).",
      );
    }
    const utilities = classes.filter((cls) => !cls.startsWith("ml-") && UTILITY.test(cls));
    if (utilities.length) {
      note("warning", tag, `Utility classes (${utilities.slice(0, 4).join(" ")}) do nothing here: Mlola ships no utility framework.`, "Use a component or composition primitive; for your own CSS, read --ml-* tokens.");
    }

    for (const [name, value] of attributes) {
      if (!name.startsWith("data-") || typeof value !== "string") continue;
      if (name === "data-theme" && value && !themeIds.has(value) && !/^th-[0-9a-z]{12}$/.test(value)) {
        note("error", tag, `data-theme="${value}" is not a theme.`, `Use one of: ${[...themeIds].join(", ")}, or a Studio theme id.`);
      }
      if (name === "data-mode" && !["light", "dark"].includes(value)) {
        note("error", tag, `data-mode is "light" or "dark"; "${value}" belongs in an attribute of your own.`, "data-theme and data-mode belong to the engine. Use data-kind or data-state for a component's own meaning.");
      }
      if (!SHARED.has(name) || !mlola.length) continue;
      const allowed = new Set();
      let reacts = false;
      for (const cls of mlola) {
        const values = contract?.elements?.[cls]?.[name];
        if (values) {
          reacts = true;
          for (const entry of values) allowed.add(entry);
        }
      }
      if (reacts && allowed.size && !allowed.has(value)) {
        note("error", tag, `${name}="${value}" is not a value ${mlola.join(" ")} reacts to.`, `Allowed: ${[...allowed].sort().join(", ")}.`);
      } else if (!reacts && mlola.every((cls) => known.has(cls))) {
        note("warning", tag, `${name} has no effect on ${mlola.join(" ")}.`, `See get_component for the attributes it reacts to.`);
      }
    }

    // A style string, or a JSX style object, with a color written into it.
    const style = attributes.get("style") ?? attributes.get("style:raw");
    if (typeof style === "string" && COLOR.test(style)) {
      note("error", tag, "A color is written by hand in style.", "Read a token: var(--ml-text), var(--ml-primary-text), var(--ml-surface)… (get_tokens).");
    }
  }
  return issues;
}
