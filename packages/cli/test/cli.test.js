import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { run } from "../src/cli.js";
import { DEFAULT_CONFIG } from "../src/config.js";
import { loadRegistry, resolveItems } from "../src/registry.js";
import { readFileSync } from "node:fs";

function capture() {
  const stdout = [];
  const stderr = [];
  return {
    stdout,
    stderr,
    output: {
      log: (...parts) => stdout.push(parts.join(" ")),
      error: (...parts) => stderr.push(parts.join(" ")),
    },
  };
}

test("dependency resolution is topological and deduplicated", () => {
  const registry = {
    items: [
      { name: "button", registryDependencies: [] },
      { name: "card", registryDependencies: ["button"] },
      { name: "landing", registryDependencies: ["card", "button"] },
    ],
  };
  assert.deepEqual(
    resolveItems(registry, ["landing"]).map((item) => item.name),
    ["button", "card", "landing"],
  );
});

test("init creates portable configuration and styles", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  const result = capture();
  assert.equal(await run(["init"], { cwd, output: result.output }), 0);
  const config = JSON.parse(fs.readFileSync(path.join(cwd, "mlola.config.json"), "utf8"));
  assert.equal(config.theme, "graphite");
  assert.match(
    fs.readFileSync(path.join(cwd, "styles/mlola/index.css"), "utf8"),
    /@mlola-ui\/engine/,
  );
});

test("adding a catalog item explains that it is commercial", () => {
  const registry = loadRegistry();
  assert.throws(
    () => resolveItems(registry, ["landing"]),
    /part of Mlola Pro/,
  );
});

test("the default config maps every engine package the registry uses", () => {
  const registry = loadRegistry();
  const used = new Set();
  for (const item of registry.items) {
    for (const name of Object.keys(item.engineDependencies ?? {})) used.add(name);
  }
  for (const name of used) {
    const key = name.replace(/^@mlola-ui\//, "");
    assert.ok(
      DEFAULT_CONFIG.engine[key],
      `mlola.config.json is missing an engine mapping for ${name}`,
    );
  }
  assert.ok(
    !("core" in DEFAULT_CONFIG.engine),
    "the retired @mlola-ui/core must not appear in the default engine map",
  );
});

test("add copies from bundled snapshot without a repository checkout", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  const result = capture();
  await run(["init"], { cwd, output: result.output });
  assert.equal(await run(["add", "card"], { cwd, output: result.output }), 0);
  assert.ok(fs.existsSync(path.join(cwd, "components/ui/card.tsx")));
  assert.equal(result.stderr.length, 0);
});

test("list exposes every registry item as JSON", async () => {
  const result = capture();
  assert.equal(await run(["list", "--json"], { output: result.output }), 0);
  const listed = JSON.parse(result.stdout.join("\n"));
  // Compare against the index rather than a frozen number: the library is
  // meant to grow, and a hardcoded count only fails on the commit that adds.
  const index = JSON.parse(
    readFileSync(new URL("../registry/index.json", import.meta.url), "utf8"),
  );
  const expected =
    index.components.length + index.blocks.length + index.pages.length + index.templates.length;
  assert.equal(listed.length, expected);
  assert.ok(listed.every((item) => typeof item.name === "string" && item.name));
});

test("theme pull writes the spec and its pinned stylesheet", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  const requested = [];
  const record = { id: "th-abcdefghjkmn", selector: "terracotta-pages", name: "Terracotta Pages", version: 3, spec: { specVersion: 1, id: "x", label: "Terracotta Pages" } };
  const fetcher = async (url) => {
    requested.push(url);
    if (url.endsWith(".json")) return new Response(JSON.stringify(record));
    return new Response('[data-theme="terracotta-pages"] { --ml-primary: red; }');
  };
  const result = capture();
  await run(["init"], { cwd, output: result.output });
  assert.equal(await run(["theme", "pull", "https://studio.test/t/th-abcdefghjkmn.css"], { cwd, output: result.output, fetch: fetcher }), 0);
  assert.deepEqual(requested, ["https://studio.test/t/th-abcdefghjkmn.json", "https://studio.test/t/th-abcdefghjkmn@3.css"]);
  const spec = JSON.parse(fs.readFileSync(path.join(cwd, "mlola.theme.json"), "utf8"));
  assert.equal(spec.id, "terracotta-pages");
  assert.deepEqual(spec.studio.version, 3);
  assert.match(fs.readFileSync(path.join(cwd, "styles/mlola/index.css"), "utf8"), /@import "\.\/theme\.css";\n$/);
  assert.match(fs.readFileSync(path.join(cwd, "styles/mlola/theme.css"), "utf8"), /terracotta-pages/);

  // A second pull of the same theme is fine; a different theme needs --overwrite.
  assert.equal(await run(["theme", "pull", "th-abcdefghjkmn", "--host", "https://studio.test"], { cwd, output: result.output, fetch: fetcher }), 0);
  assert.equal((fs.readFileSync(path.join(cwd, "styles/mlola/index.css"), "utf8").match(/theme\.css/g) ?? []).length, 1);
  const other = { ...record, id: "th-zzzzzzzzzzzz" };
  const otherFetcher = async (url) => (url.endsWith(".json") ? new Response(JSON.stringify(other)) : new Response(""));
  assert.equal(await run(["theme", "pull", "th-zzzzzzzzzzzz", "--host", "https://studio.test"], { cwd, output: result.output, fetch: otherFetcher }), 1);
  assert.match(result.stderr.at(-1), /--overwrite/);
});

test("theme pull rejects references that are not theme ids", async () => {
  const result = capture();
  assert.equal(await run(["theme", "pull", "../../etc/passwd"], { cwd: os.tmpdir(), output: result.output, fetch: async () => { throw new Error("must not fetch"); } }), 1);
  assert.match(result.stderr.at(-1), /Not a theme id/);
});

/* ── Mlola Pro ─────────────────────────────────────────────────────── */

import { createHash } from "node:crypto";

const integrity = (content) => `sha256-${createHash("sha256").update(content).digest("base64")}`;
const TOKEN = `mlp_${"a".repeat(40)}`;

function proProject() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-pro-"));
  const env = { MLOLA_CONFIG_DIR: path.join(cwd, ".config") };
  return { cwd, env };
}

/** A stand-in for the Pro service: one component with a Pro dependency, stamped. */
function proService({ tamper = false } = {}) {
  const calls = [];
  const file = (name, body) => {
    const content = `/* Mlola Pro · licence lic_test */\n${body}`;
    return { path: `packages/components/${name}/${name}.tsx`, target: `{{aliases.components}}/${name}.tsx`, type: "registry:ui", content, integrity: integrity(tamper ? `${content}!` : content) };
  };
  const css = "@layer mlola.recipes {\n.ml-bot { color: red; }\n}\n";
  const guide = "<!-- Mlola Pro · licence lic_test -->\n# Mlola Pro for code generation\n";
  const fetcher = async (url, init = {}) => {
    calls.push({ url, init });
    if (init.headers?.authorization !== `Bearer ${TOKEN}`) return new Response(JSON.stringify({ error: "This token is not valid." }), { status: 401 });
    if (url.endsWith("/api/pro/licence")) return Response.json({ licence: { id: "lic_test", plan: "personal", status: "active" } });
    return Response.json({
      items: [
        { name: "halo", type: "registry:ui", registryDependencies: [], engineDependencies: {}, files: [file("halo", 'export const Halo = () => null;\n')] },
        { name: "bot", type: "registry:ui", registryDependencies: ["halo", "button"], engineDependencies: {}, files: [file("bot", 'import { Halo } from "../halo/halo";\nexport const Bot = () => Halo;\n')] },
      ],
      styles: [{ name: "bot", css, integrity: integrity(css) }],
      guide: { content: guide, integrity: integrity(tamper ? `${guide}!` : guide) },
    });
  };
  return { fetcher, calls };
}

test("login checks the token with the service and saves it for this user only", async () => {
  const { cwd, env } = proProject();
  const service = proService();
  const result = capture();
  assert.equal(await run(["login", TOKEN, "--host", "https://pro.test"], { cwd, env, output: result.output, fetch: service.fetcher }), 0);
  const filename = path.join(env.MLOLA_CONFIG_DIR, "credentials.json");
  assert.equal(JSON.parse(fs.readFileSync(filename, "utf8")).token, TOKEN);
  if (process.platform !== "win32") assert.equal(fs.statSync(filename).mode & 0o777, 0o600);
  assert.equal(await run(["logout"], { cwd, env, output: result.output }), 0);
  assert.ok(!fs.existsSync(filename));
});

test("login refuses something that is not a token without calling the service", async () => {
  const { cwd, env } = proProject();
  const result = capture();
  assert.equal(await run(["login", "hunter2"], { cwd, env, output: result.output, fetch: async () => { throw new Error("must not fetch"); } }), 1);
  assert.match(result.stderr.join("\n"), /not a Mlola Pro token/);
});

test("adding a Pro item without a login says how to get one", async () => {
  const { cwd, env } = proProject();
  const result = capture();
  await run(["init"], { cwd, env, output: result.output });
  assert.equal(await run(["add", "conversation"], { cwd, env, output: result.output, fetch: async () => { throw new Error("must not fetch"); } }), 1);
  assert.match(result.stderr.join("\n"), /part of Mlola Pro.*mlola-ui login/s);
});

test("a Pro install writes stamped source, rewrites imports, and gathers its styles", async () => {
  const { cwd, env } = proProject();
  const service = proService();
  const result = capture();
  await run(["init"], { cwd, env, output: result.output });
  const proEnv = { ...env, MLOLA_PRO_TOKEN: TOKEN, MLOLA_STUDIO_URL: "https://pro.test" };
  assert.equal(await run(["add", "bot"], { cwd, env: proEnv, output: result.output, fetch: service.fetcher }), 0, result.stderr.join("\n"));
  const bot = fs.readFileSync(path.join(cwd, "components/ui/bot.tsx"), "utf8");
  assert.match(bot, /Mlola Pro · licence lic_test/);
  assert.match(bot, /from "@\/components\/ui\/halo"/);
  assert.ok(fs.existsSync(path.join(cwd, "components/ui/halo.tsx")), "Pro dependencies come from the service");
  assert.ok(fs.existsSync(path.join(cwd, "components/ui/button.tsx")), "free dependencies come from the bundle");
  assert.match(fs.readFileSync(path.join(cwd, "styles/mlola-pro.css"), "utf8"), /@import "\.\/mlola-pro\/bot\.css";/);
  assert.ok(fs.existsSync(path.join(cwd, "styles/mlola-pro/bot.css")));
  assert.match(fs.readFileSync(path.join(cwd, "mlola-pro.agents.md"), "utf8"), /Mlola Pro for code generation/);
  const call = service.calls.at(-1);
  assert.equal(call.url, "https://pro.test/api/pro/items");
  assert.deepEqual(JSON.parse(call.init.body), { names: ["bot"] });
});

test("Pro source that fails its integrity check is not written", async () => {
  const { cwd, env } = proProject();
  const service = proService({ tamper: true });
  const result = capture();
  await run(["init"], { cwd, env, output: result.output });
  const proEnv = { ...env, MLOLA_PRO_TOKEN: TOKEN, MLOLA_STUDIO_URL: "https://pro.test" };
  assert.equal(await run(["add", "bot"], { cwd, env: proEnv, output: result.output, fetch: service.fetcher }), 1);
  assert.match(result.stderr.join("\n"), /integrity/);
  assert.ok(!fs.existsSync(path.join(cwd, "components/ui/bot.tsx")));
});

test("login explains a pasted token prefix instead of calling the service", async () => {
  const { cwd, env } = proProject();
  const result = capture();
  assert.equal(await run(["login", "mlp_bqcs0f…"], { cwd, env, output: result.output, fetch: async () => { throw new Error("must not fetch"); } }), 1);
  assert.match(result.stderr.join("\n"), /only the start of a token/);
});

/** Serves asset files from the repository, the way the site does. */
function assetFetch(tamper) {
  const root = path.resolve(import.meta.dirname, "..", "..", "assets");
  return async (url) => {
    const [, kind, id, file] = /asset-files\/(2d|3d)\/([^/]+)\/([^/]+)$/.exec(url) ?? [];
    const filename = kind ? path.join(root, kind, id, file) : null;
    if (!filename || !fs.existsSync(filename)) return new Response("Not found", { status: 404 });
    const bytes = fs.readFileSync(filename);
    if (tamper) bytes[0] ^= 1;
    return new Response(bytes);
  };
}

test("add asset downloads, verifies and places 2D and 3D files", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  await run(["init"], { cwd, output: capture().output });
  const result = capture();
  const code = await run(["add", "asset", "empty-inbox", "orb"], { cwd, output: result.output, fetch: assetFetch(), env: {} });
  assert.equal(code, 0, result.stderr.join("\n"));
  for (const file of ["public/mlola/2d/empty-inbox.svg", "components/ui/illustrations/empty-inbox.tsx", "public/mlola/3d/orb.glb", "public/mlola/3d/orb-poster.webp"]) {
    assert.ok(fs.existsSync(path.join(cwd, file)), `${file} was written`);
  }
  assert.match(result.stdout.join("\n"), /EmptyInboxIllustration/);
  const again = capture();
  assert.equal(await run(["add", "asset", "orb"], { cwd, output: again.output, fetch: assetFetch(), env: {} }), 0);
  assert.match(again.stdout.join("\n"), /already up to date/);
});

test("an asset that fails its integrity check writes nothing", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  await run(["init"], { cwd, output: capture().output });
  const result = capture();
  assert.equal(await run(["add", "asset", "orb"], { cwd, output: result.output, fetch: assetFetch(true), env: {} }), 1);
  assert.match(result.stderr.join("\n"), /integrity/);
  assert.ok(!fs.existsSync(path.join(cwd, "public/mlola")));
});

test("list --kind asset names every illustration and model", async () => {
  const result = capture();
  assert.equal(await run(["list", "--kind", "asset"], { output: result.output }), 0);
  const text = result.stdout.join("\n");
  assert.match(text, /Illustrations \(\d+\)/);
  assert.match(text, /3D models \(\d+\)/);
});
