import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { targetRoot } from "./config.js";
import { sha256 } from "./registry.js";

/**
 * Mlola Pro in the CLI.
 *
 * Pro source is never bundled. `mlola-ui login <token>` stores a token made at
 * /account (readable by the current user only); `add` sends it to the Pro
 * endpoint, which returns the items and their Pro dependencies stamped with
 * the licence. In CI, `MLOLA_PRO_TOKEN` takes the place of a login.
 */

export const DEFAULT_HOST = "https://ui.mlola.com";
const TOKEN_PATTERN = /^mlp_[0-9a-z]{40}$/;

export function hostFrom(env, explicit) {
  return (explicit ?? env.MLOLA_STUDIO_URL ?? DEFAULT_HOST).replace(/\/$/, "");
}

export function credentialsPath(env) {
  const base = env.MLOLA_CONFIG_DIR ?? path.join(env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config"), "mlola-ui");
  return path.join(base, "credentials.json");
}

export function readCredentials(env) {
  if (env.MLOLA_PRO_TOKEN) return { token: env.MLOLA_PRO_TOKEN.trim(), host: undefined, from: "MLOLA_PRO_TOKEN" };
  const filename = credentialsPath(env);
  if (!fs.existsSync(filename)) return null;
  try {
    const saved = JSON.parse(fs.readFileSync(filename, "utf8"));
    return typeof saved.token === "string" ? { token: saved.token, host: saved.host, from: filename } : null;
  } catch {
    return null;
  }
}

export function saveCredentials(env, token, host) {
  const filename = credentialsPath(env);
  fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  fs.writeFileSync(filename, `${JSON.stringify({ token, host }, null, 2)}\n`, { mode: 0o600 });
  fs.chmodSync(filename, 0o600);
  return filename;
}

export function clearCredentials(env) {
  const filename = credentialsPath(env);
  if (!fs.existsSync(filename)) return false;
  fs.rmSync(filename);
  return true;
}

async function request(fetcher, url, token, init = {}) {
  let response;
  try {
    response = await fetcher(url, { ...init, headers: { ...init.headers, authorization: `Bearer ${token}` } });
  } catch (error) {
    throw new Error(`Could not reach ${new URL(url).origin}: ${error.message}`);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? `The Pro service answered ${response.status}.`);
  return payload;
}

/** Checks a token with the service before it is saved, so a typo fails at login rather than at add. */
export async function verifyToken(host, token, fetcher) {
  if (!TOKEN_PATTERN.test(token)) throw new Error("That is not a Mlola Pro token. Tokens start with mlp_; create one at /account.");
  return request(fetcher, `${host}/api/pro/licence`, token);
}

/**
 * Fetches Pro items, then checks every file and stylesheet against the
 * integrity the service sent with it.
 */
export async function fetchProItems(host, token, names, fetcher) {
  const payload = await request(fetcher, `${host}/api/pro/items`, token, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ names }),
  });
  if (!Array.isArray(payload.items)) throw new Error("The Pro service sent an unexpected response.");
  for (const item of payload.items) {
    for (const file of item.files ?? []) {
      if (typeof file.content !== "string" || sha256(file.content) !== file.integrity) {
        throw new Error(`Pro source failed integrity validation: ${file.path}`);
      }
    }
  }
  const styles = Array.isArray(payload.styles) ? payload.styles : [];
  for (const style of styles) {
    if (!/^[a-z][a-z0-9-]*$/.test(style.name) || sha256(style.css) !== style.integrity) {
      throw new Error(`Pro stylesheet failed integrity validation: ${style.name}`);
    }
  }
  const guide = payload.guide && typeof payload.guide.content === "string" ? payload.guide : null;
  if (guide && sha256(guide.content) !== guide.integrity) throw new Error("The Pro agent guide failed integrity validation.");
  return { items: payload.items, styles, guide };
}

export const GUIDE_FILENAME = "mlola-pro.agents.md";

/** Pro's guide for coding agents lands at the project root, beside AGENTS.md. */
export function writeProGuide(cwd, guide, { overwrite = false } = {}) {
  if (!guide) return { status: "none" };
  const filename = path.join(cwd, GUIDE_FILENAME);
  if (fs.existsSync(filename)) {
    const current = fs.readFileSync(filename, "utf8");
    if (current === guide.content) return { status: "unchanged" };
    if (!overwrite) return { status: "conflict" };
  }
  fs.writeFileSync(filename, guide.content);
  return { status: "written" };
}

/**
 * Pro stylesheets land in <styles>/mlola-pro/<name>.css, gathered by
 * <styles>/mlola-pro.css, which the project imports once after the engine.
 */
export function writeProStyles(cwd, config, styles, { overwrite = false } = {}) {
  const root = targetRoot(config, "styles");
  const written = [];
  const unchanged = [];
  const conflicts = [];
  for (const style of styles) {
    const relative = path.join(root, "mlola-pro", `${style.name}.css`);
    const filename = path.join(cwd, relative);
    if (fs.existsSync(filename)) {
      if (fs.readFileSync(filename, "utf8") === style.css) {
        unchanged.push(relative);
        continue;
      }
      if (!overwrite) {
        conflicts.push(relative);
        continue;
      }
    }
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, style.css);
    written.push(relative);
  }

  const indexRelative = path.join(root, "mlola-pro.css");
  const indexFile = path.join(cwd, indexRelative);
  let index = fs.existsSync(indexFile) ? fs.readFileSync(indexFile, "utf8") : "/* Mlola Pro styles. Import this file once, after the engine stylesheet. */\n";
  let changed = false;
  for (const style of styles) {
    const line = `@import "./mlola-pro/${style.name}.css";`;
    if (!index.includes(line)) {
      index += `${line}\n`;
      changed = true;
    }
  }
  if (changed) {
    fs.mkdirSync(path.dirname(indexFile), { recursive: true });
    fs.writeFileSync(indexFile, index);
  }
  return { written, unchanged, conflicts, index: styles.length ? indexRelative : null };
}
