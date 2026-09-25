import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { targetRoot } from "./config.js";
import { BUNDLED_REGISTRY_ROOT, readJson } from "./registry.js";

/**
 * 2D and 3D assets.
 *
 * Their files are not bundled with the CLI: a project wants three of them,
 * not every model. The bundled index lists each file with its integrity; the
 * files download from the site and are checked before anything is written.
 *
 * Static files (SVG, GLB, posters) land in the `assets` target, public/mlola
 * by default, so a web app serves them as /mlola/2d/… and /mlola/3d/…. A 2D
 * asset's React component lands beside your components, in illustrations/.
 */

export function loadAssetIndex() {
  const filename = path.join(BUNDLED_REGISTRY_ROOT, "assets.json");
  if (!fs.existsSync(filename)) return { items: [] };
  return readJson(filename);
}

const integrityOf = (bytes) => `sha256-${createHash("sha256").update(bytes).digest("base64")}`;

/** Where each of an asset's files goes in the project. */
export function assetTarget(config, item, file) {
  if (file.role === "react") return path.join(targetRoot(config, "components"), "illustrations", file.path);
  return path.join(targetRoot(config, "assets"), item.kind, file.path);
}

export async function addAssets(cwd, config, ids, { source, fetcher, overwrite = false }) {
  const index = loadAssetIndex();
  const known = new Map(index.items.map((item) => [item.id, item]));
  const unknown = ids.filter((id) => !known.has(id));
  if (unknown.length) {
    throw new Error(`No asset named ${unknown.map((id) => `"${id}"`).join(", ")}. See them all with "npx mlola-ui list --kind asset".`);
  }

  // Download and verify everything first, so a failure writes nothing.
  const planned = [];
  for (const id of ids) {
    const item = known.get(id);
    for (const file of item.files) {
      const url = `${source}/${item.kind}/${item.id}/${file.path}`;
      let response;
      try {
        response = await fetcher(url);
      } catch (error) {
        throw new Error(`Could not download ${url}: ${error.message}`);
      }
      if (!response.ok) throw new Error(`Could not download ${url}: the server answered ${response.status}.`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (integrityOf(bytes) !== file.integrity) throw new Error(`${item.id}/${file.path} failed integrity validation; nothing was written.`);
      planned.push({ item, file, bytes, relative: assetTarget(config, item, file) });
    }
  }

  const result = { written: [], unchanged: [], conflicts: [], items: ids.map((id) => known.get(id)) };
  for (const { bytes, relative } of planned) {
    const filename = path.join(cwd, relative);
    if (fs.existsSync(filename)) {
      if (fs.readFileSync(filename).equals(bytes)) {
        result.unchanged.push(relative);
        continue;
      }
      if (!overwrite) {
        result.conflicts.push(relative);
        continue;
      }
    }
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, bytes);
    result.written.push(relative);
  }
  return result;
}

/** A line on how to use each added asset. */
export function assetHint(config, item) {
  const pascal = item.id.replace(/(^|-)([a-z0-9])/g, (_, __, letter) => letter.toUpperCase());
  const assets = targetRoot(config, "assets");
  const publicPath = assets.startsWith("public/") ? `/${assets.slice("public/".length)}` : `/${assets}`;
  if (item.kind === "2d") {
    const alias = (config.aliases?.components ?? "@/components/ui").replace(/\/$/, "");
    return `${item.id}: import { ${pascal}Illustration } from "${alias}/illustrations/${item.id}"; it follows your theme. As a plain image: ${publicPath}/2d/${item.id}.svg`;
  }
  return `${item.id}: ${publicPath}/3d/${item.id}.glb, with its poster at ${publicPath}/3d/${item.id}-poster.webp. Materials are named primary, surface, accent, ink, neutral and metal, so a viewer can paint them from your theme.`;
}
