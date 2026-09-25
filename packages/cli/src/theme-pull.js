import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CONFIG, loadConfig, targetRoot } from "./config.js";

/**
 * `mlola-ui theme pull <id | url>`: copy a Studio theme into the project.
 *
 * Writes the spec to mlola.theme.json (the record, and what the engine build
 * reads) and the rendered stylesheet to <styles>/mlola/theme.css, imported
 * from index.css. The CSS is fetched pinned to the exact version the spec
 * came from, so the two files always agree.
 */

export const DEFAULT_STUDIO_URL = "https://ui.mlola.com";
const THEME_ID = /^th-[0-9a-z]{12}$/;

/** Accepts `th-…`, `th-…@3`, or a hosted URL such as https://host/t/th-….css. */
export function parseThemeReference(reference, host = DEFAULT_STUDIO_URL) {
  if (!reference) throw new Error("Name the theme to pull: mlola-ui theme pull <theme-id | url>");
  let base = host;
  let token = reference;
  if (/^https?:\/\//.test(reference)) {
    const url = new URL(reference);
    const match = /\/t\/([^/]+)$/.exec(url.pathname);
    if (!match) throw new Error(`Not a hosted theme URL: ${reference}`);
    base = url.origin;
    token = match[1];
  }
  const match = /^(th-[0-9a-z]{12})(?:@([1-9]\d*))?(?:\.(?:css|json))?$/.exec(token);
  if (!match || !THEME_ID.test(match[1])) throw new Error(`Not a theme id: ${token}`);
  return { base: base.replace(/\/$/, ""), id: match[1], version: match[2] ? Number(match[2]) : undefined };
}

async function fetchText(url, fetcher) {
  let response;
  try {
    response = await fetcher(url);
  } catch (error) {
    throw new Error(`Could not reach ${new URL(url).origin}: ${error.message}`);
  }
  if (response.status === 404) {
    throw new Error("No shared theme at that id. Private themes cannot be pulled; set it to Link or Public in the Studio.");
  }
  if (!response.ok) throw new Error(`${url} answered ${response.status}.`);
  return response.text();
}

function ensureImport(indexFile, line) {
  const current = fs.existsSync(indexFile) ? fs.readFileSync(indexFile, "utf8") : "";
  if (current.includes(line)) return false;
  fs.mkdirSync(path.dirname(indexFile), { recursive: true });
  fs.writeFileSync(indexFile, `${current}${current && !current.endsWith("\n") ? "\n" : ""}${line}\n`);
  return true;
}

export async function pullTheme(cwd, reference, { host, overwrite = false, fetcher = fetch, output = console } = {}) {
  const { base, id, version } = parseThemeReference(reference, host);
  const pinned = (extension, at) => `${base}/t/${id}@${at}.${extension}`;

  const record = JSON.parse(await fetchText(version ? pinned("json", version) : `${base}/t/${id}.json`, fetcher));
  if (!record?.spec || typeof record.version !== "number") throw new Error("The server returned an unexpected theme record.");
  const css = await fetchText(pinned("css", record.version), fetcher);

  const themeFile = path.join(cwd, "mlola.theme.json");
  if (fs.existsSync(themeFile) && !overwrite) {
    const existing = JSON.parse(fs.readFileSync(themeFile, "utf8"));
    if (existing?.studio?.id !== id) {
      throw new Error("mlola.theme.json already holds another theme. Re-run with --overwrite to replace it.");
    }
  }
  const spec = {
    $schema: "https://unpkg.com/@mlola-ui/engine/generated/theme-spec.schema.json",
    ...record.spec,
    id: record.selector,
    studio: { id, version: record.version, source: pinned("json", record.version) },
  };
  fs.writeFileSync(themeFile, `${JSON.stringify(spec, null, 2)}\n`);

  const config = fs.existsSync(path.join(cwd, "mlola.config.json")) ? loadConfig(cwd) : DEFAULT_CONFIG;
  const stylesDirectory = path.join(cwd, targetRoot(config, "styles"), "mlola");
  fs.mkdirSync(stylesDirectory, { recursive: true });
  fs.writeFileSync(path.join(stylesDirectory, "theme.css"), css);
  const imported = ensureImport(path.join(stylesDirectory, "index.css"), '@import "./theme.css";');

  const stylesRelative = path.relative(cwd, stylesDirectory);
  output.log(`✓ Pulled ${record.name} (${id}@${record.version})`);
  output.log(`✓ Wrote mlola.theme.json and ${path.join(stylesRelative, "theme.css")}`);
  if (imported) output.log(`✓ Imported it from ${path.join(stylesRelative, "index.css")}`);
  output.log(`Set data-theme="${record.selector}" on <html> or any container.`);
  return { id, version: record.version, selector: record.selector };
}
