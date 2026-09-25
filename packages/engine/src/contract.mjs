import { renderAllLibraryCss, renderCatalogCss, renderLibraryRecipesCss } from "./library-recipes.mjs";
import { behaviors } from "./behavior-spec.mjs";

/**
 * The portable contract.
 *
 * Styling is already framework-free: recipes react only to `data-*` and
 * `aria-*`. So the attribute half of the contract is derived from the CSS
 * rather than written by hand, which means it cannot drift from what the
 * library actually renders. Any renderer in any language that emits these
 * classes and attributes gets the correct visuals.
 *
 * The behaviour half — which attribute flips on which event, and the keyboard
 * map — cannot be read out of CSS, so it is authored in behavior-spec.mjs and
 * audited against this derived data.
 */

const SELECTOR_ATTRIBUTES =
  /\.(ml-[a-z0-9-]+)((?:\[[a-zA-Z-]+(?:=(?:"[^"]*"|'[^']*'))?\])+)/g;
const SINGLE_ATTRIBUTE = /\[([a-zA-Z-]+)(?:=(?:"([^"]*)"|'([^']*)'))?\]/g;

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function selectorsOf(css) {
  const selectors = [];
  for (const match of stripComments(css).matchAll(/([^{}]+)\{[^{}]*\}/g)) {
    const head = match[1].trim();
    if (!head || head.startsWith("@")) continue;
    for (const part of head.split(",")) selectors.push(part.trim());
  }
  return selectors;
}

/**
 * class -> attribute -> sorted values ("" means the attribute is a flag).
 * By default it reads the published stylesheet: the free library. Audits pass
 * the whole library, Pro included.
 */
export function deriveAttributeContract(css = renderLibraryRecipesCss()) {
  const contract = new Map();
  for (const selector of selectorsOf(css)) {
    for (const match of selector.matchAll(SELECTOR_ATTRIBUTES)) {
      const [, className, attributeBlock] = match;
      for (const attribute of attributeBlock.matchAll(SINGLE_ATTRIBUTE)) {
        const name = attribute[1];
        if (!name.startsWith("data-") && !name.startsWith("aria-")) continue;
        const value = attribute[2] ?? attribute[3] ?? "";
        if (!contract.has(className)) contract.set(className, new Map());
        const attributes = contract.get(className);
        if (!attributes.has(name)) attributes.set(name, new Set());
        if (value) attributes.get(name).add(value);
      }
    }
  }
  return contract;
}

function toElements(derived) {
  const elements = {};
  for (const [className, attributes] of [...derived].sort(([a], [b]) => a.localeCompare(b))) {
    const entry = {};
    for (const [name, values] of [...attributes].sort(([a], [b]) => a.localeCompare(b))) {
      entry[name] = [...values].sort();
    }
    elements[className] = entry;
  }
  return elements;
}

/** The published contract: every class and attribute of the free library. */
export function renderContract() {
  const elements = toElements(deriveAttributeContract());
  return {
    $schema: "./contract.schema.json",
    version: 1,
    description:
      "Classes and the data-/aria- attributes the stylesheet reacts to. Emit these from any language or framework and the visuals are correct. Derived from the stylesheet, not hand written.",
    styling: { attributeSource: "data-theme, data-mode", elements },
    behavior: behaviors,
  };
}

/**
 * The Pro contract: only the classes the free library does not style. It is
 * written beside the Pro catalog, never into the published engine, so the
 * shape of Pro's API travels with Pro source.
 */
export function proAttributeContract() {
  // A class the published stylesheet names at all is public, attributes or not.
  const published = new Set([...stripComments(renderLibraryRecipesCss()).matchAll(/\.(ml-[a-z0-9-]+)/g)].map((match) => match[1]));
  const everything = deriveAttributeContract(`${renderAllLibraryCss()}\n${renderCatalogCss()}`);
  return new Map([...everything].filter(([className]) => !published.has(className)));
}

export function renderProContract() {
  return {
    version: 1,
    description: "Mlola Pro classes and the data-/aria- attributes their stylesheets react to. Not published; delivered with Pro source.",
    styling: { attributeSource: "data-theme, data-mode", elements: toElements(proAttributeContract()) },
  };
}
