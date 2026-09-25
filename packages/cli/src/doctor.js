import fs from "node:fs";
import path from "node:path";
import { interpolateTarget, loadConfig, targetRoot } from "./config.js";
import { createTransformContext, expectedFile } from "./installer.js";
import { loadRegistry, readJson, sha256, sourcePath } from "./registry.js";

const FORBIDDEN_DEPENDENCIES = [
  "clsx",
  "tailwind-merge",
  "tailwindcss",
  "@tailwindcss/postcss",
  "lucide-react",
];

function finding(level, message) {
  return { level, message };
}

function projectDependencies(cwd) {
  const filename = path.join(cwd, "package.json");
  if (!fs.existsSync(filename)) return {};
  const manifest = readJson(filename);
  return {
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
  };
}

function projectContains(cwd, pattern) {
  const roots = ["app", "src", "pages"]
    .map((directory) => path.join(cwd, directory))
    .filter((directory) => fs.existsSync(directory));
  let inspected = 0;
  const queue = [...roots];
  while (queue.length && inspected < 500) {
    const current = queue.shift();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      const filename = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(filename);
      } else if (/\.(?:tsx?|jsx?|html)$/.test(entry.name)) {
        inspected += 1;
        if (pattern.test(fs.readFileSync(filename, "utf8"))) return true;
      }
    }
  }
  return false;
}

export function runDoctor(cwd) {
  const findings = [];
  let config;
  let registry;
  try {
    config = loadConfig(cwd);
    findings.push(finding("pass", "mlola.config.json is valid"));
  } catch (error) {
    findings.push(finding("error", error.message));
    return findings;
  }
  try {
    registry = loadRegistry();
    const seen = new Set();
    for (const item of registry.items) {
      for (const file of item.files) {
        if (seen.has(file.path)) continue;
        seen.add(file.path);
        const filename = sourcePath(file.path);
        if (!fs.existsSync(filename) || sha256(fs.readFileSync(filename)) !== file.integrity) {
          throw new Error(`Integrity mismatch for ${file.path}`);
        }
      }
    }
    findings.push(finding("pass", `bundled Registry v2 snapshot is valid (${registry.items.length} items)`));
  } catch (error) {
    findings.push(finding("error", error.message));
    return findings;
  }

  const dependencies = projectDependencies(cwd);
  const forbidden = FORBIDDEN_DEPENDENCIES.filter((name) => dependencies[name]);
  if (forbidden.length) {
    findings.push(finding("warn", `forbidden styling dependencies declared: ${forbidden.join(", ")}`));
  } else {
    findings.push(finding("pass", "no forbidden styling dependencies are declared"));
  }

  const requiredEngines = new Set();
  for (const item of registry.items) {
    for (const name of Object.keys(item.engineDependencies)) requiredEngines.add(name);
  }
  const missingEngines = [...requiredEngines].filter((name) => !dependencies[name]);
  if (missingEngines.length) {
    findings.push(
      finding("warn", `engine packages used by the registry are not declared: ${missingEngines.join(", ")}`),
    );
  } else if (requiredEngines.size) {
    findings.push(finding("pass", "registry engine packages are declared"));
  }
  if (!dependencies.react) findings.push(finding("warn", "React is not declared in package.json"));
  if (!dependencies["react-dom"]) findings.push(finding("warn", "ReactDOM is not declared in package.json"));

  const styleFile = path.join(cwd, targetRoot(config, "styles"), "mlola", "index.css");
  if (!fs.existsSync(styleFile)) {
    findings.push(finding("warn", `missing ${path.relative(cwd, styleFile)}; rerun init`));
  } else {
    const css = fs.readFileSync(styleFile, "utf8");
    if (!css.includes(config.engine.engine ?? "@mlola-ui/engine") && !css.includes(config.engine.tokens)) {
      findings.push(finding("warn", "Mlola stylesheet does not import the configured engine"));
    } else {
      findings.push(finding("pass", "Mlola engine stylesheet import is present"));
    }
  }

  if (projectContains(cwd, /\bdata-theme\s*=/)) {
    findings.push(finding("pass", "data-theme is present in application source"));
  } else if (projectContains(cwd, /\bdata-skin\s*=/)) {
    findings.push(finding("warn", "data-skin is legacy; set data-theme on the document root"));
  } else {
    findings.push(
      finding("warn", `set data-theme="${config.theme}" on <html> or an application container`),
    );
  }

  const context = createTransformContext(registry, config);
  let installedItems = 0;
  let modifiedFiles = 0;
  for (const item of registry.items) {
    const primary = item.files.find((file) =>
      file.path.endsWith(`/${item.name}/${item.name}.tsx`),
    );
    if (!primary) continue;
    const primaryDestination = path.join(cwd, interpolateTarget(primary.target, config));
    if (!fs.existsSync(primaryDestination)) continue;
    installedItems += 1;
    for (const file of item.files) {
      const destination = path.join(cwd, interpolateTarget(file.target, config));
      if (!fs.existsSync(destination) || fs.readFileSync(destination, "utf8") !== expectedFile(file, context)) {
        modifiedFiles += 1;
      }
    }
  }
  if (modifiedFiles) {
    findings.push(
      finding(
        "warn",
        `${modifiedFiles} installed registry file(s) differ from the deterministic snapshot`,
      ),
    );
  } else {
    findings.push(finding("pass", `${installedItems} installed item(s) match the registry snapshot`));
  }
  return findings;
}
