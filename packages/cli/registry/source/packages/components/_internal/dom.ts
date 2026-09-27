/**
 * DOM reads that work wherever the component runs, including test
 * environments such as jsdom, which have no `CSS` object.
 */

/** Whether the browser supports a CSS declaration; false where it cannot say. */
export function supportsCss(property: string, value: string) {
  return typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports(property, value);
}

/** A selector for an element whose attribute holds exactly `value`, whatever characters it contains. */
export function byAttribute(name: string, value: string) {
  return `[${name}="${value.replace(/["\\]/g, "\\$&").replace(/\n/g, "\\a ")}"]`;
}
