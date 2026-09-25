import fs from "node:fs";
import path from "node:path";

export const CONFIG_FILENAME = "mlola.config.json";

export const DEFAULT_CONFIG = {
  $schema: "https://ui.mlola.com/schema/mlola.config.json",
  version: 1,
  theme: "graphite",
  aliases: {
    components: "@/components/ui",
    blocks: "@/components/blocks",
    pages: "@/app/pages",
    templates: "@/app/templates",
    lib: "@/lib/mlola",
    styles: "@/styles",
  },
  targets: {
    components: "components/ui",
    blocks: "components/blocks",
    pages: "app/pages",
    templates: "app/templates",
    lib: "lib/mlola",
    styles: "styles",
    assets: "public/mlola",
  },
  engine: {
    engine: "@mlola-ui/engine",
    tokens: "@mlola-ui/tokens",
    motion: "@mlola-ui/motion",
    scene: "@mlola-ui/scene",
    icons: "@mlola-ui/icons",
    behavior: "@mlola-ui/behavior",
  },
};

const REQUIRED_ALIASES = ["components", "blocks", "templates", "lib", "styles"];
const THEMES = new Set(["graphite", "atelier", "machined", "aerogel", "nordic"]);

export function configPath(cwd) {
  return path.join(cwd, CONFIG_FILENAME);
}

export function validateConfig(config) {
  const errors = [];
  if (!config || typeof config !== "object") return ["configuration must be an object"];
  if (config.version !== 1) errors.push(`version must be 1 (received ${config.version})`);
  if (!THEMES.has(config.theme)) errors.push(`theme must be one of ${[...THEMES].join(", ")}`);
  for (const key of REQUIRED_ALIASES) {
    if (typeof config.aliases?.[key] !== "string" || !config.aliases[key]) {
      errors.push(`aliases.${key} must be a non-empty string`);
    }
  }
  if (!config.engine || typeof config.engine !== "object") {
    errors.push("engine mappings are required");
  }
  return errors;
}

export function loadConfig(cwd) {
  const filename = configPath(cwd);
  if (!fs.existsSync(filename)) {
    throw new Error(`No ${CONFIG_FILENAME} found. Run "npx mlola-ui init" first.`);
  }
  let config;
  try {
    config = JSON.parse(fs.readFileSync(filename, "utf8"));
  } catch (error) {
    throw new Error(`Cannot parse ${CONFIG_FILENAME}: ${error.message}`);
  }
  const errors = validateConfig(config);
  if (errors.length) {
    throw new Error(`Invalid ${CONFIG_FILENAME}:\n  - ${errors.join("\n  - ")}`);
  }
  return config;
}

function safeRelative(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty path.`);
  }
  let relative = value.trim().replaceAll("\\", "/");
  if (relative.startsWith("@/") || relative.startsWith("~/")) relative = relative.slice(2);
  relative = relative.replace(/^\.?\//, "");
  if (path.isAbsolute(relative) || relative.split("/").includes("..")) {
    throw new Error(`${label} must stay inside the project: ${value}`);
  }
  return relative;
}

export function targetRoot(config, key) {
  const configured = config.targets?.[key] ?? config.aliases?.[key] ?? DEFAULT_CONFIG.targets[key];
  return safeRelative(configured, `target ${key}`);
}

export function interpolateTarget(template, config, mode = "filesystem") {
  const match = /^\{\{aliases\.([a-z]+)\}\}\/(.+)$/.exec(template);
  if (!match) throw new Error(`Invalid registry target template: ${template}`);
  const [, key, remainder] = match;
  const base =
    mode === "import"
      ? config.aliases?.[key] ?? DEFAULT_CONFIG.aliases[key]
      : targetRoot(config, key);
  if (!base) throw new Error(`No configured alias for "${key}".`);
  return `${base.replace(/\/$/, "")}/${remainder}`;
}

export function writeDefaultConfig(cwd, { force = false } = {}) {
  const filename = configPath(cwd);
  if (fs.existsSync(filename) && !force) {
    return { filename, created: false };
  }
  fs.writeFileSync(filename, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`);
  return { filename, created: true };
}
