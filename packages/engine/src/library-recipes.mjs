import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Assemble the library's stylesheets from the CSS files their owners keep.
 *
 * Each component carries its own `<name>.css` next to its source, so a
 * component's markup, behaviour and styling are reviewed and copied together.
 * The engine only concatenates them, in a stable order, into the published
 * layers:
 *
 *   - recipes: the engine's composition primitives (`css/base.css`) and every
 *     free component. This ships in `@mlola-ui/engine`.
 *   - Pro: Pro components' styles, and the catalog's, are assembled into the
 *     unpublished catalog stylesheet or loaded by the component itself; they
 *     never ship in the engine.
 *   - catalog: blocks, pages and templates. These are the commercial catalog,
 *     so their CSS is assembled separately and never published by the engine.
 *
 * Node-only: this reads the filesystem at build time. Browser code renders
 * themes through `theme-css.mjs`, which has no such dependency.
 */

const engineDirectory = dirname(dirname(fileURLToPath(import.meta.url)));
const packagesDirectory = dirname(engineDirectory);

function ownedCss(root) {
  let entries = [];
  try {
    entries = readdirSync(root).sort();
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const folder = join(root, entry);
    if (!statSync(folder).isDirectory()) continue;
    const own = join(folder, `${entry.replace(/^_/, "")}.css`);
    try {
      files.push({ owner: `${root.split("/").pop()}/${entry}`, css: readFileSync(own, "utf8") });
    } catch {
      // A folder without its own stylesheet contributes nothing.
    }
  }
  return files;
}

const section = ({ owner, css }) => `/* ${owner} */\n${css.trim()}`;

export function readEngineCss(name) {
  return readFileSync(join(engineDirectory, "css", `${name}.css`), "utf8").trim();
}

/**
 * Pro components are the ones the commercial catalog's index lists. Their
 * styles never ship in the published engine: they travel with Pro source.
 */
function proComponents() {
  try {
    return new Set(JSON.parse(readFileSync(join(packagesDirectory, "registry", "catalog", "index.json"), "utf8")).components ?? []);
  } catch {
    return new Set();
  }
}

/**
 * A component that imports its own stylesheet (`import "./name.css"`) loads
 * it only where it renders, so no aggregate carries it. The canvas family does
 * this; such a stylesheet wraps itself in the recipes layer.
 */
function loadsOwnCss(name) {
  try {
    return readFileSync(join(packagesDirectory, "components", name, `${name}.tsx`), "utf8").includes(`import "./${name}.css"`);
  } catch {
    return false;
  }
}

const componentCss = () => ownedCss(join(packagesDirectory, "components"));
const componentName = (owner) => owner.split("/").pop();

/** Composition primitives and every free component: the published, critical bundle. */
export function renderLibraryRecipesCss() {
  const pro = proComponents();
  const parts = [{ owner: "engine/base", css: readEngineCss("base") }, ...componentCss().filter((part) => !pro.has(componentName(part.owner)))];
  return `/* Library recipes — owned by Mlola, no utility framework. */\n\n${parts.map(section).join("\n\n")}\n`;
}

/** Every component stylesheet, free and Pro, unlayered: what audits and the contract read. */
export function renderAllLibraryCss() {
  const parts = [{ owner: "engine/base", css: readEngineCss("base") }, ...componentCss()];
  return `${parts.map(section).join("\n\n")}\n`;
}

/** Pro components (those not loading their own CSS), blocks, pages and templates: the Pro styles. */
export function renderCatalogCss() {
  const pro = proComponents();
  const parts = [
    ...componentCss().filter((part) => pro.has(componentName(part.owner)) && !loadsOwnCss(componentName(part.owner))),
    ...["blocks", "pages", "templates"].flatMap((group) => ownedCss(join(packagesDirectory, group))),
  ];
  return `/* Mlola Pro styles — Pro components, blocks, pages and templates. Not published by @mlola-ui/engine. */\n@layer mlola.recipes {\n\n${parts.map(section).join("\n\n")}\n\n}\n`;
}
