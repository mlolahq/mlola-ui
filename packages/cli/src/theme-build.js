import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { DEFAULT_CONFIG, loadConfig, targetRoot } from "./config.js";
import { ensureImport } from "./theme-pull.js";

/**
 * `mlola-ui theme build`: render the project's own theme, offline.
 *
 * Reads mlola.theme.json (written by hand or pulled from the Studio) and
 * renders it with the engine installed in the project, the same function
 * that renders every canonical theme, so its palette is solved for contrast
 * the same way. Writes <styles>/mlola/theme.css, imported from index.css,
 * which is where `theme pull` puts a Studio theme.
 */

export const THEME_FILENAME = "mlola.theme.json";

/** The engine's theme renderer, from the project's own node_modules. */
async function projectEngine(cwd, engine) {
  const require = createRequire(path.join(cwd, "package.json"));
  let resolved;
  try {
    resolved = require.resolve(`${engine}/theme`);
  } catch {
    throw new Error(`Building a theme needs ${engine} 1.1 or later in this project. Install it: npm install ${engine}@latest`);
  }
  return import(pathToFileURL(resolved).href);
}

export async function buildTheme(cwd, { file = THEME_FILENAME, output = console, loadEngine = projectEngine } = {}) {
  const themeFile = path.resolve(cwd, file);
  if (!fs.existsSync(themeFile)) {
    throw new Error(`No ${file} in ${cwd}. Write one (https://ui.mlola.com/docs/theming#custom) or pull one from the Studio: mlola-ui theme pull <theme-id>`);
  }
  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(themeFile, "utf8"));
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }

  const config = fs.existsSync(path.join(cwd, "mlola.config.json")) ? loadConfig(cwd) : DEFAULT_CONFIG;
  const engine = await loadEngine(cwd, config.engine?.engine ?? "@mlola-ui/engine");
  const { id } = engine.defineTheme(spec);
  const css = engine.renderThemeCss(spec);

  const stylesDirectory = path.join(cwd, targetRoot(config, "styles"), "mlola");
  fs.mkdirSync(stylesDirectory, { recursive: true });
  fs.writeFileSync(path.join(stylesDirectory, "theme.css"), css);
  const imported = ensureImport(path.join(stylesDirectory, "index.css"), '@import "./theme.css";');

  const stylesRelative = path.relative(cwd, stylesDirectory);
  output.log(`✓ Built ${path.join(stylesRelative, "theme.css")} from ${path.relative(cwd, themeFile)}`);
  if (imported) output.log(`✓ Imported it from ${path.join(stylesRelative, "index.css")}`);
  if (config.theme !== id) output.log(`Set "theme": "${id}" in mlola.config.json, and data-theme="${id}" on <html> or any container.`);
  else output.log(`Set data-theme="${id}" on <html> or any container.`);
  return { id };
}
