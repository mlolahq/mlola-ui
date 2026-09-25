import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const BUNDLED_REGISTRY_ROOT = path.join(CLI_ROOT, "registry");

export function sha256(content) {
  return `sha256-${createHash("sha256").update(content).digest("base64")}`;
}

export function readJson(filename) {
  return JSON.parse(fs.readFileSync(filename, "utf8"));
}

export function loadRegistry() {
  const filename = path.join(BUNDLED_REGISTRY_ROOT, "index.json");
  if (!fs.existsSync(filename)) {
    throw new Error(
      `Bundled registry is missing at ${filename}. Reinstall mlola-ui; this package is incomplete.`,
    );
  }
  const registry = readJson(filename);
  if (registry.schemaVersion !== 2 || !Array.isArray(registry.items)) {
    throw new Error("Bundled registry is not a valid Registry v2 snapshot.");
  }
  return registry;
}

/** Names in the commercial catalog, so the CLI can say so instead of "unknown". */
export function loadCatalogNames() {
  const filename = path.join(BUNDLED_REGISTRY_ROOT, "catalog.json");
  if (!fs.existsSync(filename)) return new Set();
  const catalog = readJson(filename);
  return new Set([
    ...(catalog.components ?? []),
    ...(catalog.blocks ?? []),
    ...(catalog.pages ?? []),
    ...(catalog.templates ?? []),
  ]);
}

export function sourcePath(relativePath) {
  const filename = path.resolve(BUNDLED_REGISTRY_ROOT, "source", relativePath);
  const sourceRoot = path.resolve(BUNDLED_REGISTRY_ROOT, "source");
  if (filename !== sourceRoot && !filename.startsWith(`${sourceRoot}${path.sep}`)) {
    throw new Error(`Unsafe registry source path: ${relativePath}`);
  }
  return filename;
}

export function itemMap(registry) {
  return new Map(registry.items.map((item) => [item.name, item]));
}

export function resolveItems(registry, requestedNames, catalogNames = loadCatalogNames()) {
  const byName = itemMap(registry);
  const ordered = [];
  const visited = new Set();
  const visiting = new Set();

  function visit(name, chain = []) {
    const item = byName.get(name);
    if (!item) {
      if (catalogNames.has(name)) {
        throw new Error(
          `"${name}" is part of Mlola Pro, not the free registry. ` +
            `See https://ui.mlola.com/pricing to get Pro.`,
        );
      }
      const suggestions = [...byName.keys()]
        .filter((candidate) => candidate.includes(name) || name.includes(candidate))
        .slice(0, 4);
      const hint = suggestions.length ? ` Did you mean ${suggestions.join(", ")}?` : "";
      throw new Error(`Registry item "${name}" does not exist.${hint}`);
    }
    if (visiting.has(name)) {
      throw new Error(`Registry dependency cycle: ${[...chain, name].join(" -> ")}`);
    }
    if (visited.has(name)) return;
    visiting.add(name);
    for (const dependency of item.registryDependencies) visit(dependency, [...chain, name]);
    visiting.delete(name);
    visited.add(name);
    ordered.push(item);
  }

  for (const name of requestedNames) visit(name);
  return ordered;
}
