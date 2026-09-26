import fs from "node:fs";
import path from "node:path";
import { interpolateTarget } from "./config.js";
import { sha256, sourcePath } from "./registry.js";

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const IMPORT_PATTERN =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function importsFrom(content) {
  return [...content.matchAll(IMPORT_PATTERN)].map((match) => match[1] ?? match[2]);
}

function sourceImportCandidates(fromSource, specifier) {
  const unresolved = path.posix.normalize(path.posix.join(path.posix.dirname(fromSource), specifier));
  return [
    unresolved,
    ...SOURCE_EXTENSIONS.map((extension) => `${unresolved}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => `${unresolved}/index${extension}`),
  ];
}

function withoutSourceExtension(value) {
  const extension = SOURCE_EXTENSIONS.find((candidate) => value.endsWith(candidate));
  const clean = extension ? value.slice(0, -extension.length) : value;
  return clean.endsWith("/index") ? clean.slice(0, -"/index".length) : clean;
}

function relativeImport(from, to) {
  const relative = path.posix.relative(path.posix.dirname(from), to);
  return relative.startsWith(".") ? relative : `./${relative}`;
}

export function createTransformContext(registry, config) {
  const filesBySource = new Map();
  for (const item of registry.items) {
    for (const file of item.files) filesBySource.set(file.path, file);
  }
  return { filesBySource, config };
}

export function transformSource(content, sourceFile, context) {
  const replacements = new Map();
  for (const specifier of importsFrom(content)) {
    if (specifier.startsWith(".")) {
      const importedSource = sourceImportCandidates(sourceFile.path, specifier).find((candidate) =>
        context.filesBySource.has(candidate),
      );
      if (importedSource) {
        const importedFile = context.filesBySource.get(importedSource);
        const target =
          context.config.imports === "relative"
            ? relativeImport(interpolateTarget(sourceFile.target, context.config), interpolateTarget(importedFile.target, context.config))
            : interpolateTarget(importedFile.target, context.config, "import");
        replacements.set(specifier, withoutSourceExtension(target));
      }
      continue;
    }

    if (specifier.startsWith("@mlola-ui/")) {
      const [, packageName, ...subpath] = specifier.split("/");
      const configured = context.config.engine?.[packageName];
      if (configured) {
        replacements.set(specifier, [configured, ...subpath].join("/"));
      }
    }
  }

  if (!replacements.size) return content;
  return content.replace(/(["'])([^"']+)\1/g, (match, quote, specifier) => {
    const replacement = replacements.get(specifier);
    return replacement ? `${quote}${replacement}${quote}` : match;
  });
}

export function expectedFile(file, context) {
  // Pro files arrive with their content, already checked against their integrity.
  if (typeof file.content === "string") {
    if (sha256(file.content) !== file.integrity) throw new Error(`Pro source failed integrity validation: ${file.path}`);
    return transformSource(file.content, file, context);
  }
  const bundledSource = sourcePath(file.path);
  if (!fs.existsSync(bundledSource)) {
    throw new Error(`Bundled source is missing for ${file.path}. Reinstall mlola-ui.`);
  }
  const original = fs.readFileSync(bundledSource, "utf8");
  if (sha256(original) !== file.integrity) {
    throw new Error(`Bundled source failed integrity validation: ${file.path}`);
  }
  return transformSource(original, file, context);
}

export function installItems(cwd, registry, items, config, { overwrite = false } = {}) {
  const context = createTransformContext(registry, config);
  const written = [];
  const unchanged = [];
  const conflicts = [];
  const seenDestinations = new Set();

  for (const item of items) {
    for (const file of item.files) {
      const relativeDestination = interpolateTarget(file.target, config);
      const destination = path.resolve(cwd, relativeDestination);
      if (destination !== cwd && !destination.startsWith(`${path.resolve(cwd)}${path.sep}`)) {
        throw new Error(`Refusing to write outside the project: ${relativeDestination}`);
      }
      if (seenDestinations.has(destination)) continue;
      seenDestinations.add(destination);

      const content = expectedFile(file, context);
      if (fs.existsSync(destination)) {
        if (fs.readFileSync(destination, "utf8") === content) {
          unchanged.push(relativeDestination);
          continue;
        }
        if (!overwrite) {
          conflicts.push(relativeDestination);
          continue;
        }
      }
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, content);
      written.push(relativeDestination);
    }
  }
  return { written, unchanged, conflicts };
}

export function collectEngineDependencies(items) {
  const dependencies = new Map();
  for (const item of items) {
    for (const [name, range] of Object.entries(item.engineDependencies)) {
      dependencies.set(name, range);
    }
  }
  return dependencies;
}
