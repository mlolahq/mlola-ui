import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { run } from "../src/cli.js";
import { remoteMcpHandler } from "../src/mcp.js";
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

test("init and add install what the copied code imports, with the project's package manager", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify({ dependencies: { react: "^19.0.0" } }));
  fs.writeFileSync(path.join(cwd, "pnpm-lock.yaml"), "");
  const calls = [];
  const installer = (command, args) => {
    calls.push([command, ...args]);
    const manifest = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
    for (const spec of args.slice(1)) manifest.dependencies[spec.slice(0, spec.lastIndexOf("@"))] = spec.slice(spec.lastIndexOf("@") + 1);
    fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify(manifest));
    return { status: 0 };
  };
  const result = capture();
  assert.equal(await run(["init"], { cwd, output: result.output, installer }), 0);
  assert.equal(await run(["add", "button"], { cwd, output: result.output, installer }), 0);
  assert.equal(await run(["add", "card"], { cwd, output: result.output, installer }), 0);
  // The engine once, motion when Button needs it, and nothing twice.
  assert.deepEqual(calls.map((call) => call.map((part) => part.replace(/@\^[\d.]+$/, ""))), [
    ["pnpm", "add", "@mlola-ui/engine"],
    ["pnpm", "add", "@mlola-ui/motion"],
  ]);
});

test("add raises a package the project declares at an older range than the copied code needs", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify({ dependencies: { "@mlola-ui/engine": "^0.9.0", "@mlola-ui/motion": "workspace:*" } }));
  const calls = [];
  const installer = (command, args) => {
    calls.push([command, ...args]);
    return { status: 0 };
  };
  const result = capture();
  assert.equal(await run(["init"], { cwd, output: result.output, installer }), 0);
  assert.equal(await run(["add", "button"], { cwd, output: result.output, installer }), 0);
  // The engine range is behind, twice; a workspace link is the project's call.
  assert.equal(calls.length, 2);
  for (const call of calls) assert.deepEqual(call.map((part) => part.replace(/@\^[\d.]+$/, "")), ["npm", "install", "@mlola-ui/engine"]);
  assert.match(calls[0][2], /@\^\d+\.\d+\.\d+$/);
  assert.notEqual(calls[0][2], "@mlola-ui/engine@^0.9.0");
});

test("--no-install and projects without package.json only name the packages", async () => {
  const installer = () => assert.fail("must not install");
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  const plain = capture();
  assert.equal(await run(["init"], { cwd: bare, output: plain.output, installer }), 0);
  assert.match(plain.stdout.join("\n"), /Install what this needs: npm install @mlola-ui\/engine@\^/);

  const project = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.writeFileSync(path.join(project, "package.json"), "{}");
  const declined = capture();
  assert.equal(await run(["init", "--no-install"], { cwd: project, output: declined.output, installer }), 0);
  assert.equal(await run(["add", "button", "--no-install"], { cwd: project, output: declined.output, installer }), 0);
  assert.match(declined.stdout.join("\n"), /npm install @mlola-ui\/engine@\^[\d.]+ @mlola-ui\/motion@\^[\d.]+/);
});

test("a failed install says what to run", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.writeFileSync(path.join(cwd, "package.json"), "{}");
  const result = capture();
  assert.equal(await run(["init"], { cwd, output: result.output, installer: () => ({ status: 1 }) }), 1);
  assert.match(result.stderr.join("\n"), /Run it yourself: npm install @mlola-ui\/engine@\^/);
});

test("init follows the project's @/ alias, comments and all", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.mkdirSync(path.join(cwd, "src"));
  fs.writeFileSync(
    path.join(cwd, "tsconfig.json"),
    `{
      // Next.js with a src folder
      "compilerOptions": { "paths": { "@/*": ["./src/*"], }, },
    }`,
  );
  assert.equal(await run(["init", "--no-agents"], { cwd, output: capture().output }), 0);
  const config = JSON.parse(fs.readFileSync(path.join(cwd, "mlola.config.json"), "utf8"));
  assert.equal(config.imports, undefined);
  assert.equal(config.targets.components, "src/components/ui");
  assert.equal(config.targets.assets, "public/mlola");
  assert.ok(fs.existsSync(path.join(cwd, "src/styles/mlola/index.css")));
  assert.equal(await run(["add", "button"], { cwd, output: capture().output }), 0);
  assert.match(fs.readFileSync(path.join(cwd, "src/components/ui/button.tsx"), "utf8"), /from "@\/components\/ui\/spinner"/);
});

test("without an @/ alias, as in a new Vite app, copied files import each other by relative path", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.mkdirSync(path.join(cwd, "src"));
  fs.writeFileSync(path.join(cwd, "tsconfig.json"), JSON.stringify({ files: [], references: [{ path: "./tsconfig.app.json" }] }));
  fs.writeFileSync(path.join(cwd, "tsconfig.app.json"), `{ /* Bundler mode */ "compilerOptions": { "jsx": "react-jsx" }, "include": ["src"] }`);
  assert.equal(await run(["init", "--no-agents"], { cwd, output: capture().output }), 0);
  const config = JSON.parse(fs.readFileSync(path.join(cwd, "mlola.config.json"), "utf8"));
  assert.equal(config.imports, "relative");
  assert.equal(await run(["add", "button", "copy-button"], { cwd, output: capture().output }), 0);
  const button = fs.readFileSync(path.join(cwd, "src/components/ui/button.tsx"), "utf8");
  assert.match(button, /from "\.\/spinner"/);
  assert.match(button, /from "\.\/_internal\/react"/);
  assert.doesNotMatch(button, /"@\//);
  assert.doesNotMatch(fs.readFileSync(path.join(cwd, "src/components/ui/copy-button.tsx"), "utf8"), /"@\//);
});

test("doctor judges the installed items, finds the theme in index.html and accepts Tailwind", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.mkdirSync(path.join(cwd, "src"));
  fs.writeFileSync(path.join(cwd, "index.html"), `<html lang="en" data-theme="graphite"></html>`);
  fs.writeFileSync(
    path.join(cwd, "package.json"),
    JSON.stringify({ dependencies: { react: "^19", "react-dom": "^19", "@mlola-ui/engine": "^1" }, devDependencies: { tailwindcss: "^4" } }),
  );
  await run(["init", "--no-agents", "--no-install"], { cwd, output: capture().output });
  await run(["add", "card", "--no-install"], { cwd, output: capture().output });
  const result = capture();
  assert.equal(await run(["doctor"], { cwd, output: result.output }), 0);
  const report = result.stdout.join("\n");
  assert.doesNotMatch(report, /^! /m, report);
  assert.match(report, /Tailwind is declared/);

  await run(["add", "button", "--no-install"], { cwd, output: capture().output });
  const after = capture();
  await run(["doctor"], { cwd, output: after.output });
  assert.match(after.stdout.join("\n"), /not declared: @mlola-ui\/motion$/m);
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

test("theme build renders mlola.theme.json offline, with the project's engine, and a project theme is a valid config theme", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  const result = capture();
  await run(["init", "--no-install", "--no-agents"], { cwd, output: result.output });

  // Without the engine installed, it says what to install.
  fs.writeFileSync(path.join(cwd, "mlola.theme.json"), JSON.stringify({ id: "datafawn", label: "DataFawn", inherit: "graphite", color: { primary: { hue: 150, chroma: 0.14, lightness: 0.52 } } }));
  assert.equal(await run(["theme", "build"], { cwd, output: result.output, fetch: async () => { throw new Error("must not fetch"); } }), 1);
  assert.match(result.stderr.at(-1), /npm install @mlola-ui\/engine@latest/);

  // With it, the theme renders through the engine, no network involved.
  fs.mkdirSync(path.join(cwd, "node_modules/@mlola-ui"), { recursive: true });
  fs.symlinkSync(path.resolve(import.meta.dirname, "../../engine"), path.join(cwd, "node_modules/@mlola-ui/engine"), "dir");
  assert.equal(await run(["theme", "build"], { cwd, output: result.output, fetch: async () => { throw new Error("must not fetch"); } }), 0);
  const css = fs.readFileSync(path.join(cwd, "styles/mlola/theme.css"), "utf8");
  assert.match(css, /\[data-theme="datafawn"\]/);
  assert.match(css, /--ml-primary-foreground:/);
  assert.match(fs.readFileSync(path.join(cwd, "styles/mlola/index.css"), "utf8"), /@import "\.\/theme\.css";/);
  assert.match(result.stdout.at(-1), /"theme": "datafawn"/);

  // The config takes the project theme, and doctor finds it rendered.
  const configFile = path.join(cwd, "mlola.config.json");
  fs.writeFileSync(configFile, JSON.stringify({ ...JSON.parse(fs.readFileSync(configFile, "utf8")), theme: "datafawn" }));
  assert.equal(await run(["doctor"], { cwd, output: result.output }), 0);
  assert.ok(result.stdout.some((line) => line.includes('the project theme "datafawn" is rendered')));
  fs.writeFileSync(configFile, JSON.stringify({ ...JSON.parse(fs.readFileSync(configFile, "utf8")), theme: "Not A Theme" }));
  assert.equal(await run(["doctor"], { cwd, output: result.output }), 1);
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
    const content = `/* Mlola Pro · license lic_test */\n${body}`;
    return { path: `packages/components/${name}/${name}.tsx`, target: `{{aliases.components}}/${name}.tsx`, type: "registry:ui", content, integrity: integrity(tamper ? `${content}!` : content) };
  };
  const css = "@layer mlola.recipes {\n.ml-bot { color: red; }\n}\n";
  const blockSource = "/* Mlola Pro · license lic_test */\nexport const Navbar = () => null;\n";
  const blockCss = "/* Mlola Pro · license lic_test */\n.ml-navbar { display: grid; }\n";
  const guide = "<!-- Mlola Pro · license lic_test -->\n# Mlola Pro for code generation\n";
  const fetcher = async (url, init = {}) => {
    calls.push({ url, init });
    if (init.headers?.authorization !== `Bearer ${TOKEN}`) return new Response(JSON.stringify({ error: "This token is not valid." }), { status: 401 });
    if (url.endsWith("/api/pro/licence")) return Response.json({ licence: { id: "lic_test", plan: "personal", status: "active" } });
    return Response.json({
      items: [
        { name: "halo", type: "registry:ui", registryDependencies: [], engineDependencies: {}, files: [file("halo", 'export const Halo = () => null;\n')] },
        { name: "bot", type: "registry:ui", registryDependencies: ["halo", "button"], engineDependencies: {}, files: [file("bot", 'import { Halo } from "../halo/halo";\nexport const Bot = () => Halo;\n')] },
        {
          name: "navbar",
          type: "registry:block",
          registryDependencies: [],
          engineDependencies: {},
          files: [
            { path: "packages/blocks/navbar/navbar.tsx", target: "{{aliases.blocks}}/navbar.tsx", type: "registry:block", content: blockSource, integrity: integrity(blockSource) },
            { path: "packages/blocks/navbar/navbar.css", target: "{{aliases.blocks}}/navbar.css", type: "registry:block", content: blockCss, integrity: integrity(blockCss) },
          ],
        },
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
  // A Next.js-style alias, so imports go through it.
  fs.writeFileSync(path.join(cwd, "tsconfig.json"), JSON.stringify({ compilerOptions: { paths: { "@/*": ["./*"] } } }));
  const service = proService();
  const result = capture();
  await run(["init"], { cwd, env, output: result.output });
  const proEnv = { ...env, MLOLA_PRO_TOKEN: TOKEN, MLOLA_STUDIO_URL: "https://pro.test" };
  assert.equal(await run(["add", "bot"], { cwd, env: proEnv, output: result.output, fetch: service.fetcher }), 0, result.stderr.join("\n"));
  const bot = fs.readFileSync(path.join(cwd, "components/ui/bot.tsx"), "utf8");
  assert.match(bot, /Mlola Pro · license lic_test/);
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

test("a block's stylesheet is gathered with the Pro styles, so importing the index styles it", async () => {
  const { cwd, env } = proProject();
  fs.writeFileSync(path.join(cwd, "tsconfig.json"), JSON.stringify({ compilerOptions: { paths: { "@/*": ["./*"] } } }));
  const service = proService();
  const result = capture();
  await run(["init"], { cwd, env, output: result.output });
  const proEnv = { ...env, MLOLA_PRO_TOKEN: TOKEN, MLOLA_STUDIO_URL: "https://pro.test" };
  assert.equal(await run(["add", "navbar"], { cwd, env: proEnv, output: result.output, fetch: service.fetcher }), 0, result.stderr.join("\n"));
  assert.ok(fs.existsSync(path.join(cwd, "components/blocks/navbar.css")));
  const index = fs.readFileSync(path.join(cwd, "styles/mlola-pro.css"), "utf8");
  assert.match(index, /@import "\.\.\/components\/blocks\/navbar\.css";/);
  assert.ok(result.stdout.some((line) => line.includes("Pro styles are gathered in")), "the CLI says to import the index");
  // Adding it again does not repeat the line.
  assert.equal(await run(["add", "navbar"], { cwd, env: proEnv, output: result.output, fetch: service.fetcher }), 0);
  assert.equal(fs.readFileSync(path.join(cwd, "styles/mlola-pro.css"), "utf8").match(/navbar\.css/g).length, 1);
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
    const [, kind, id, file, integrity] = /asset-files\/(2d|3d)\/([^/]+)\/([^/?]+)\?integrity=([^&]+)$/.exec(url) ?? [];
    const filename = kind && decodeURIComponent(integrity).startsWith("sha256-") ? path.join(root, kind, id, file) : null;
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

test("init tells coding agents about Mlola, merging with what is there", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.mkdirSync(path.join(cwd, ".cursor"));
  fs.writeFileSync(path.join(cwd, "AGENTS.md"), "# Notes\n\nKeep this.\n");
  fs.writeFileSync(path.join(cwd, ".mcp.json"), JSON.stringify({ mcpServers: { other: { command: "x" } } }));
  assert.equal(await run(["init"], { cwd, output: capture().output }), 0);
  const agents = fs.readFileSync(path.join(cwd, "AGENTS.md"), "utf8");
  assert.match(agents, /Keep this\./);
  assert.match(agents, /mlola-ui:start[\s\S]*mlola\.agents\.md[\s\S]*mlola-ui:end/);
  assert.match(fs.readFileSync(path.join(cwd, "CLAUDE.md"), "utf8"), /@AGENTS\.md/);
  const mcp = JSON.parse(fs.readFileSync(path.join(cwd, ".mcp.json"), "utf8"));
  assert.deepEqual(Object.keys(mcp.mcpServers).sort(), ["mlola", "other"]);
  assert.ok(fs.existsSync(path.join(cwd, "mlola.agents.md")));
  assert.ok(fs.existsSync(path.join(cwd, ".cursor", "rules", "mlola.mdc")));
  assert.ok(!fs.existsSync(path.join(cwd, ".vscode")), "no VS Code folder is invented");
  const again = capture();
  assert.equal(await run(["agents"], { cwd, output: again.output }), 0);
  assert.match(again.stdout.join("\n"), /up to date/);
  assert.equal(fs.readFileSync(path.join(cwd, "AGENTS.md"), "utf8"), agents, "running again changes nothing");
});

test("init --no-agents leaves agent files alone", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  assert.equal(await run(["init", "--no-agents"], { cwd, output: capture().output }), 0);
  assert.ok(!fs.existsSync(path.join(cwd, "AGENTS.md")));
  assert.ok(!fs.existsSync(path.join(cwd, ".mcp.json")));
});

test("check_markup finds invented classes, wrong values, utilities, colors and borrowed modes", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  assert.deepEqual(checkMarkup(`<button class="ml-button" data-variant="primary" data-size="sm">Save</button>`), []);
  const issues = checkMarkup(`<div data-mode="note"><button className="ml-button ml-button-primary flex p-4" data-variant="huge" style={{ color: "#f00" }}>Go</button></div>`);
  const messages = issues.map((issue) => issue.message).join("\n");
  assert.match(messages, /data-mode is "light", "dark" or "system"/);
  assert.match(messages, /"ml-button-primary" is not a Mlola class/);
  assert.match(messages, /Utility classes/);
  assert.match(messages, /data-variant="huge"/);
  assert.match(messages, /color is written by hand/);
});

test("check_markup flags spacing written by hand, and lets the scale, zero, auto and percentages be", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  const spacing = (markup) => checkMarkup(markup).filter((issue) => /Spacing is written by hand/.test(issue.message)).map((issue) => issue.message);
  assert.match(spacing(`<div class="ml-card" style="padding: 13px; margin: 0 auto">x</div>`).join(), /padding: 13px/);
  assert.match(spacing(`<div className="ml-card" style={{ padding: 12, marginTop: 0 }}>x</div>`).join(), /padding: 12/);
  assert.match(spacing(`<div className="ml-card" style={{ gap: 8 }}>x</div>`).join(), /gap: 8/);
  assert.match(spacing(`<div className="ml-card" style={{ paddingInline: "1.5rem" }}>x</div>`).join(), /paddingInline/);
  assert.match(spacing(`<style>.hero { padding: 24px 32px; margin-block: -12px }</style>`).join(), /padding: 24px 32px; margin-block: -12px/);
  // A length beside a token, or inside a calc() of one, was still typed by hand.
  assert.match(spacing(`<div class="ml-card" style="padding: var(--ml-space-2) 13px">x</div>`).join(), /13px/);
  assert.match(spacing(`<style>.a { gap: calc(var(--ml-space-3) + 2.25rem) }</style>`).join(), /2\.25rem/);
  // A clamp() with ends of its own is a fluid value invented; the fluid steps are the scale for it.
  assert.match(spacing(`<style>.hero { padding-block: clamp(3.5rem, 8vw, 6.5rem) }</style>`).join(), /clamp\(3\.5rem/);
  // The scale and a calc() or clamp() of its steps, the fluid steps, an em tuned to the font, a 1px
  // hairline, and values no one invented pass: the rule the library's own scale audit holds its CSS to.
  assert.deepEqual(spacing(`<div class="ml-card" style="padding: var(--ml-space-3); gap: calc(var(--ml-space-2) * 2)">x</div>`), []);
  assert.deepEqual(spacing(`<style>.a { padding: clamp(var(--ml-space-2), 2vw, var(--ml-space-4)); margin: 0; inset: 10% }</style>`), []);
  assert.deepEqual(spacing(`<style>.hero { padding-block: var(--ml-space-fluid-xl); margin-top: .15em; gap: 1px }</style>`), []);
  assert.deepEqual(spacing(`<div class="ml-card" style="margin: auto; padding: 5%; padding-top: 0px">x</div>`), []);
  assert.deepEqual(spacing(`<div className="ml-card" style={{ marginTop: 0, gap: "var(--ml-space-2)", borderSpacing: 1, padding: 1 }}>x</div>`), []);
});

test("one rule decides what spacing is written by hand, for projects and for the library", async () => {
  const { handWrittenLengths } = await import("../src/knowledge.js");
  assert.deepEqual(handWrittenLengths("var(--ml-space-2) 13px"), ["13px"]);
  assert.deepEqual(handWrittenLengths("-2px .5rem"), ["-2px", ".5rem"]);
  assert.deepEqual(handWrittenLengths("clamp(2rem, 5vw, 4rem)"), ["2rem", "4rem"]);
  assert.deepEqual(handWrittenLengths("clamp(var(--ml-space-8), 5vw, var(--ml-space-16))"), []);
  assert.deepEqual(handWrittenLengths("var(--ml-space-fluid-lg) var(--ml-type-display-md)"), []);
  assert.deepEqual(handWrittenLengths("0.15em 1px -1px 0 0px"), []);
});

test("check_markup accepts the system mode and reads the page's own stylesheet", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  assert.deepEqual(checkMarkup('<html data-theme="graphite" data-mode="system"><body></body></html>'), []);
  const issues = checkMarkup(`<style>
    .count { color: inherit; opacity: .8 }
    .row:disabled { opacity: .5 }
    .promo { background: #1f6feb }
    :root { --ml-primary: red }
    .ok { color: var(--ml-text); background: url(#grain) }
    @media (max-width: 40rem) { .note { color: rgb(1, 2, 3) } }
  </style>`);
  const found = issues.map((issue) => `${issue.severity} ${issue.element}: ${issue.message}`);
  assert.equal(found.length, 4, found.join("\n"));
  assert.match(found.join("\n"), /warning <style> \.count: opacity/);
  assert.match(found.join("\n"), /error <style> \.promo: A color is written by hand/);
  assert.match(found.join("\n"), /error <style> :root: --ml-primary is a theme token/);
  assert.match(found.join("\n"), /error <style> \.note: A color is written by hand/);

  // Hidden is not faded, an animation's step is not a rule, and a script's string is not markup yet.
  assert.deepEqual(
    checkMarkup(`<style>
      .check { opacity: 0 }
      .chart-area { fill: var(--ml-chart-1); opacity: .16 }
      svg path.trend { opacity: .4 }
      .check[aria-checked="true"] { opacity: 1 }
      @keyframes rise { from { opacity: 0 } 50% { opacity: .5 } to { opacity: 1 } }
    </style>
    <script>row.innerHTML = '<span class="ml-badge" data-tone="' + tone + '">' + label + '</span>'; cell.innerHTML = \`<span class="ml-badge" data-tone="\${tone}">\`;</script>`),
    [],
  );
});

test("check_markup accepts every value the library itself renders", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  const examples = JSON.parse(fs.readFileSync(new URL("../registry/examples.json", import.meta.url), "utf8"));
  let checked = 0;
  for (const [name, example] of Object.entries(examples)) {
    for (const [cls, attributes] of Object.entries(example.rendered ?? {})) {
      for (const [attribute, values] of Object.entries(attributes)) {
        for (const value of values) {
          checked += 1;
          assert.deepEqual(checkMarkup(`<div class="${cls}" ${attribute}="${value}"></div>`), [], `${name} renders ${cls} ${attribute}="${value}"`);
        }
      }
    }
  }
  assert.ok(checked > 50, "showcases' rendered values are bundled");
  // The states a stylesheet does not draw but a component writes.
  assert.deepEqual(checkMarkup('<div class="ml-checkbox-field" data-state="unchecked"></div>'), []);
  assert.deepEqual(checkMarkup('<button class="ml-toggle-button" data-state="off"></button>'), []);
  // @mlola-ui/motion's classes exist; an invented one does not.
  assert.deepEqual(checkMarkup('<div class="ml-motion-magnetic"></div>'), []);
  assert.match(checkMarkup('<div class="ml-motion-bogus"></div>')[0].message, /not a Mlola class/);
  assert.match(checkMarkup('<div class="ml-checkbox-field" data-state="bogus"></div>')[0].message, /not a value/);
});

test("check_markup names each issue's line and rule, and the values typed by hand", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  const issues = checkMarkup(`<main>
  <div class="ml-card">
    <p style="color: #FAFAFA; padding: 13px 1.5rem">x</p>
  </div>
  <style>
    .hero { margin-top: 18px; background: rgb(1, 2, 3) }
  </style>
</main>`);
  const found = issues.map((issue) => [issue.line, issue.rule, issue.values]);
  assert.deepEqual(found, [
    [3, "color", ["#fafafa"]],
    [3, "spacing", ["13px", "1.5rem"]],
    [6, "color", ["rgb(1, 2, 3)"]],
    [6, "spacing", ["18px"]],
  ]);
  // A tag written over several lines points at the attribute; a stylesheet, at the declaration.
  const spread = checkMarkup(`<button
  className="ml-button"
  data-variant="huge"
  style={{ color: "#fff" }}
>Go</button>
<style>
  .promo {
    margin-top: 18px;
    color: #6b7280;
  }
</style>`);
  assert.deepEqual(spread.map((issue) => [issue.line, issue.rule]), [[3, "value"], [4, "color"], [9, "color"], [8, "spacing"]]);
  // Values typed into utility classes are drift too; a font size is not spacing.
  const utility = checkMarkup(`<div className="bg-[#FAFAFA] p-[13px] hover:mt-[2rem] text-[13px]">x</div>`);
  assert.deepEqual(
    utility.filter((issue) => issue.values).map((issue) => [issue.rule, issue.values]),
    [["color", ["#fafafa"]], ["spacing", ["13px", "2rem"]]],
  );
});

test("check_markup knows installed Pro items, derived colors, quoted custom properties, margin utilities and a project's own theme", async () => {
  const { checkMarkup, contractFrom } = await import("../src/knowledge.js");
  // Pro's classes are not published: a check learns them from what a project installed, its
  // stylesheets and the values its source renders (a default no rule draws, like data-tone="primary").
  const installed = contractFrom({
    stylesheets: [`.ml-acme-row { display: grid } .ml-acme-event[data-tone="info"] { color: var(--ml-info-text) }`],
    markups: [`<div className="ml-acme-event" data-tone="primary" />`],
  });
  assert.equal(checkMarkup('<div class="ml-acme-row"></div>')[0].rule, "unknown-class");
  assert.deepEqual(checkMarkup('<div class="ml-acme-row"></div>', { contract: installed }), []);
  assert.deepEqual(checkMarkup('<div class="ml-acme-event" data-tone="primary"></div>', { contract: installed }), []);
  assert.deepEqual(checkMarkup('<div class="ml-acme-event" data-tone="info"></div>', { contract: installed }), []);
  assert.equal(checkMarkup('<div class="ml-acme-event" data-tone="loud"></div>', { contract: installed })[0].rule, "value");
  // A color derived from a token, and a component's own custom property in a JSX style object, follow the theme.
  assert.deepEqual(checkMarkup('<p style="color: oklch(from var(--ml-primary-text) l c h / 50%)">x</p>'), []);
  assert.deepEqual(checkMarkup('<span style={{ "--ml-color-ink": "#fff" }}>x</span>'), []);
  // ml-4 is a margin-left utility, not an invented Mlola class.
  assert.deepEqual(checkMarkup('<div className="ml-4">x</div>').map((issue) => issue.rule), ["utility-class"]);
  // A theme the project builds from mlola.theme.json is a theme where the caller knows the project.
  assert.equal(checkMarkup('<html data-theme="acme"></html>')[0].rule, "theme");
  assert.deepEqual(checkMarkup('<html data-theme="acme"></html>', { themes: ["acme"] }), []);
});

test("check reports a project's drift, fails on errors and leaves out what Mlola installed", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-check-"));
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    fs.writeFileSync(path.join(cwd, file), text);
  };
  write("mlola.config.json", JSON.stringify({ ...DEFAULT_CONFIG, theme: "acme" }));
  write("src/page.tsx", `export function Page() {
  return (
    <main data-theme="acme">
      <section style={{ background: "#FAFAFA", padding: 13 }}>One</section>
      <section style={{ background: "#fafafa" }}>Two</section>
    </main>
  );
}
`);
  write("src/app.css", ".hero {\n  margin: 18px;\n}\n");
  write("components/ui/card.tsx", `export const Card = () => <div style={{ color: "#f00" }} />;\n`);
  // A Pro item the project installed: its stylesheet teaches the check its classes.
  write("styles/mlola-pro/acme.css", ".ml-acme-row { display: grid }\n");
  // Mlola's own stylesheets are held by the library's gates, so they are never checked either.
  write("components/blocks/promo.css", ".promo {\n  color: #123456;\n}\n");
  // The theme Mlola builds is where the tokens are defined, so it is never checked.
  write("styles/mlola/theme.css", ":root {\n  --ml-primary: #1f6feb;\n}\n");
  write("src/pro.tsx", `export const Pro = () => <div className="ml-acme-row" />;\n`);
  write("node_modules/some-package/index.html", `<div style="color: #123456">x</div>`);

  const plain = capture();
  assert.equal(await run(["check"], { cwd, output: plain.output, env: {} }), 1);
  const text = plain.stdout.join("\n");
  assert.match(text, /src\/page\.tsx\n\s+4\s+error\s+A color is written by hand in style\./);
  assert.match(text, /1 color: #fafafa ×2/);
  assert.match(text, /2 spacing values: 13px, 18px/);
  assert.match(text, /Left out what Mlola installed \(styles\/mlola, components\/ui, components\/blocks, styles\/mlola-pro\); --all checks the copied source too\./);
  assert.doesNotMatch(text, /card\.tsx|node_modules|#123456/);

  const json = capture();
  await run(["check", "--json"], { cwd, output: json.output, env: {} });
  const report = JSON.parse(json.stdout.join("\n"));
  assert.equal(report.files, 3);
  assert.deepEqual(report.issues.map((issue) => `${issue.file}:${issue.line} ${issue.rule}`), ["src/app.css:2 spacing", "src/page.tsx:4 color", "src/page.tsx:4 spacing", "src/page.tsx:5 color"]);
  assert.deepEqual(report.drift.colors, [{ value: "#fafafa", count: 2 }]);

  // Warnings pass a CI step unless it asks for --strict.
  assert.equal(await run(["check", "src/app.css"], { cwd, output: capture().output, env: {} }), 0);
  assert.equal(await run(["check", "src/app.css", "--strict"], { cwd, output: capture().output, env: {} }), 1);
  // --all takes in what Mlola installed.
  const all = capture();
  await run(["check", "--all", "--json"], { cwd, output: all.output, env: {} });
  const everything = JSON.parse(all.stdout.join("\n"));
  assert.ok(everything.issues.some((issue) => issue.file === "components/ui/card.tsx"));
  assert.ok(!everything.issues.some((issue) => issue.file.startsWith("styles/") || issue.file.endsWith(".css") && issue.file.startsWith("components/")));
  assert.deepEqual(everything.skipped, ["styles/mlola"]);

  // On GitHub Actions each issue is also an annotation on the pull request.
  const github = capture();
  await run(["check", "src/page.tsx"], { cwd, output: github.output, env: { GITHUB_ACTIONS: "true" } });
  assert.match(github.stdout.join("\n"), /^::error file=src\/page\.tsx,line=4,title=Mlola%3A color::A color is written by hand/m);

  const missing = capture();
  assert.equal(await run(["check", "nowhere"], { cwd, output: missing.output, env: {} }), 1);
  assert.match(missing.stderr.join("\n"), /nowhere does not exist/);
});

test("check leaves utility classes alone where a utility framework reads them", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-check-"));
  fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify({ devDependencies: { tailwindcss: "^4.0.0" } }));
  fs.writeFileSync(path.join(cwd, "page.jsx"), `export const Page = () => <div className="flex p-4 ml-2 bg-[#0f172a]">x</div>;\n`);
  const result = capture();
  await run(["check", "--json"], { cwd, output: result.output, env: {} });
  const report = JSON.parse(result.stdout.join("\n"));
  assert.equal(report.utilities, "tailwindcss");
  assert.deepEqual(report.issues.map((issue) => [issue.rule, issue.values]), [["color", ["#0f172a"]]]);
});

test("search finds what agents ask for in their own words", async () => {
  const { searchItems, describeItem } = await import("../src/knowledge.js");
  const first = (query) => searchItems({ query }).map((item) => item.name);
  assert.equal(first("switch")[0], "toggle");
  assert.ok(first("drawer").slice(0, 3).includes("sheet"), "a drawer is a sheet (and the app shell's navigation)");
  assert.equal(first("dropdown")[0], "dropdown-menu");
  assert.ok(first("radio card").includes("radio-group"), "a query with one unmatched word still finds the rest");
  assert.equal(first("kpi")[0], "card");
  assert.equal(first("stat-card")[0], "card");
  assert.ok(first("chips").includes("badge"), "a plural finds its singular");
  assert.equal(first("date")[0], "date-picker", "a query every word of which matches still ranks as before");
  assert.equal(describeItem("ml-button").name, "button");
  assert.equal(describeItem("Date picker").name, "date-picker");
  assert.throws(() => describeItem("stat-card"), /Did you mean: card/);
});

test("the MCP server speaks the protocol over stdio", async () => {
  const { spawn } = await import("node:child_process");
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  const server = spawn(process.execPath, [path.resolve(import.meta.dirname, "..", "bin", "index.js"), "mcp"], { cwd, stdio: ["pipe", "pipe", "pipe"] });
  const replies = new Map();
  let buffer = "";
  server.stdout.on("data", (chunk) => {
    buffer += chunk;
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const message = JSON.parse(buffer.slice(0, index));
      buffer = buffer.slice(index + 1);
      replies.get(message.id)?.(message);
    }
  });
  let next = 0;
  const call = (method, params) =>
    new Promise((resolve) => {
      const id = ++next;
      replies.set(id, resolve);
      server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    });
  const init = await call("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "1" } });
  assert.equal(init.result.protocolVersion, "2025-06-18");
  assert.equal(init.result.serverInfo.name, "mlola-ui");
  server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);
  const tools = (await call("tools/list", {})).result.tools.map((tool) => tool.name);
  for (const name of ["get_design_rules", "search_components", "get_component", "get_tokens", "check_markup", "add_components"]) assert.ok(tools.includes(name), name);
  const found = await call("tools/call", { name: "search_components", arguments: { query: "date" } });
  assert.match(found.result.content[0].text, /date-picker/);
  const missing = await call("tools/call", { name: "get_component", arguments: { name: "no-such-thing" } });
  assert.equal(missing.result.isError, true);
  assert.equal((await call("unknown/method", {})).error.code, -32601);
  server.stdin.end();
  await new Promise((resolve) => server.on("close", resolve));
});

test("the library's own examples pass check_markup, and an invented value does not", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  const examples = JSON.parse(fs.readFileSync(new URL("../registry/examples.json", import.meta.url), "utf8"));
  assert.ok(Object.keys(examples).length >= 50);
  for (const [name, example] of Object.entries(examples)) {
    for (const html of [example.html, example.behavior?.html].filter(Boolean)) {
      assert.deepEqual(checkMarkup(html), [], `${name} renders markup its own contract rejects`);
    }
  }
  // A default the stylesheet does not draw is still correct; a value no component has is not.
  assert.deepEqual(checkMarkup('<button class="ml-button" data-size="md">Save</button>'), []);
  assert.match(checkMarkup('<button class="ml-button" data-size="huge">Save</button>')[0].message, /data-size="huge"/);
  assert.match(checkMarkup('<div class="ml-card" style="--ml-primary: red"></div>')[0].message, /theme token/);
});

test("the remote MCP server reads, never writes, and never serves Pro source", async () => {
  const handle = remoteMcpHandler({ version: "test" });
  const call = async (method, params) => (await handle({ jsonrpc: "2.0", id: 1, method, params })).result;
  assert.equal((await call("initialize", { protocolVersion: "2025-06-18" })).protocolVersion, "2025-06-18");
  const names = (await call("tools/list")).tools.map((tool) => tool.name);
  assert.ok(names.includes("search_components") && names.includes("check_markup") && names.includes("get_install_command"));
  assert.ok(!names.includes("add_components") && !names.includes("init_project"), "a remote server cannot write to the project");

  const install = (await call("tools/call", { name: "get_install_command", arguments: { names: ["button", "bot"] } })).content[0].text;
  assert.match(install, /npx mlola-ui login <token>.*bot/s);
  assert.match(install, /npx mlola-ui add button bot/);

  // A page with no build step learns what to load, at this release's version.
  const setup = (await call("tools/call", { name: "get_install_command", arguments: {} })).content[0].text;
  assert.match(setup, /npx mlola-ui init/);
  assert.match(setup, /<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/@mlola-ui\/engine@test\/generated\/mlola\.css">/);
  assert.match(setup, /import \{ observe \} from "https:\/\/cdn\.jsdelivr\.net\/npm\/@mlola-ui\/behavior@test\/src\/index\.js"/);
  assert.match((await call("tools/call", { name: "get_design_rules", arguments: {} })).content[0].text, /data-mode light\|dark\|system[\s\S]*Without a build step/);
  const unknown = await call("tools/call", { name: "get_install_command", arguments: { names: ["switch"] } });
  assert.equal(unknown.isError, true);
  assert.match(unknown.content[0].text, /No Mlola item is called switch\. Did you mean: toggle/);

  // A call that does not fit a tool's schema says how to fix it, instead of failing inside the tool.
  const missing = await call("tools/call", { name: "get_component", arguments: {} });
  assert.equal(missing.isError, true);
  assert.match(missing.content[0].text, /get_component needs "name" \(string\), for example \{"name": "…"\}/);
  assert.match((await call("tools/call", { name: "get_install_command", arguments: { names: "button" } })).content[0].text, /"names" should be an array, not a string/);
  assert.match((await call("tools/call", { name: "search_components", arguments: { kind: "widget" } })).content[0].text, /"kind" is one of: component, block, page, template/);
  assert.match((await call("tools/call", { name: "get_tokens", arguments: { name: "x" } })).content[0].text, /get_tokens does not take "name"\. It takes: group/);

  const pro = (await call("tools/call", { name: "get_component", arguments: { name: "bot", include_source: true } })).content[0].text;
  assert.match(pro, /Part of Mlola Pro/);
  assert.doesNotMatch(pro, /export function|forwardRef/, "Pro source stays behind the license");
  assert.equal(await handle({ jsonrpc: "2.0", method: "notifications/initialized" }), null, "a notification gets no reply");
});
