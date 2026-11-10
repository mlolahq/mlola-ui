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

test("a file add refuses to replace does not keep back the packages the files it wrote need", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify({ dependencies: {} }));
  const calls = [];
  const installer = (command, args) => {
    calls.push(args.slice(1).map((spec) => spec.slice(0, spec.lastIndexOf("@"))));
    const manifest = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf8"));
    for (const spec of args.slice(1)) manifest.dependencies[spec.slice(0, spec.lastIndexOf("@"))] = spec.slice(spec.lastIndexOf("@") + 1);
    fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify(manifest));
    return { status: 0 };
  };
  const first = capture();
  assert.equal(await run(["init"], { cwd, output: first.output, installer }), 0);
  assert.equal(await run(["add", "card"], { cwd, output: first.output, installer }), 0);
  assert.deepEqual(calls, [["@mlola-ui/engine"]]);
  // The project changed its card; then it adds a button, which brings the card along and needs motion.
  const card = path.join(cwd, "components/ui/card.tsx");
  fs.writeFileSync(card, `${fs.readFileSync(card, "utf8")}\n// ours\n`);
  const second = capture();
  assert.equal(await run(["add", "button", "card"], { cwd, output: second.output, installer }), 1);
  assert.match(second.stderr.join("\n"), /Refused to replace 1 modified file/);
  assert.ok(fs.existsSync(path.join(cwd, "components/ui/button.tsx")));
  assert.ok(fs.readFileSync(card, "utf8").endsWith("// ours\n"), "the changed file is left as it was");
  assert.deepEqual(calls, [["@mlola-ui/engine"], ["@mlola-ui/motion"]], "the button was written, so what it imports is installed");
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
  fs.writeFileSync(path.join(cwd, "src", "fonts.css"), `:root { --font-inter: "Inter"; --font-newsreader: "Newsreader"; --font-jetbrains: "JetBrains Mono"; }`);
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

test("in a Next.js project, init shows the root layout with every theme's fonts and its own stylesheet", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.mkdirSync(path.join(cwd, "src", "app"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify({ dependencies: { next: "^16", react: "^19", "react-dom": "^19" } }));
  const result = capture();
  assert.equal(await run(["init", "--no-agents", "--no-install"], { cwd, output: result.output }), 0);
  const report = result.stdout.join("\n");
  assert.match(report, /In Next\.js, src\/app\/layout\.tsx does all three/);
  // init puts the styles in src/ when the project has one, beside the app it imports them into.
  assert.match(report, /Created src\/styles\/mlola\/index\.css[\s\S]*import "\.\.\/styles\/mlola\/index\.css";/);
  assert.match(report, /<html lang="en" data-theme="graphite" data-mode="system"/);
  for (const binding of ["Inter", "Newsreader", "JetBrains_Mono"]) assert.match(report, new RegExp(`\\b${binding}\\(\\{`), binding);

  // A project without Next.js is not shown a Next.js layout.
  const plain = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  const quiet = capture();
  await run(["init", "--no-agents", "--no-install"], { cwd: plain, output: quiet.output });
  assert.doesNotMatch(quiet.stdout.join("\n"), /next\/font/);
});

test("doctor names the themes' fonts a project never loads, and a theme set below <html>", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.mkdirSync(path.join(cwd, "app", "settings"), { recursive: true });
  fs.writeFileSync(path.join(cwd, "package.json"), JSON.stringify({ dependencies: { next: "^16", react: "^19", "react-dom": "^19", "@mlola-ui/engine": "^1" } }));
  await run(["init", "--no-agents", "--no-install"], { cwd, output: capture().output });
  // What the agent wrote in the 2026-10-22 run: Inter only, the theme on the page's own wrapper.
  fs.writeFileSync(
    path.join(cwd, "app", "settings", "layout.tsx"),
    `const inter = Inter({ variable: "--font-inter" });\nexport default function Layout({ children }) { return <div data-theme="graphite" className={inter.variable}>{children}</div>; }`,
  );
  const result = capture();
  await run(["doctor"], { cwd, output: result.output });
  const report = result.stdout.join("\n");
  assert.match(report, /fonts are not all loaded: --font-jetbrains \(JetBrains Mono, for [^)]*machined[^)]*\); --font-newsreader \(Newsreader, for atelier\)/);
  assert.doesNotMatch(report, /--font-inter \(/);
  assert.match(report, /data-theme is set on an inner element/);

  const { nextLayout } = await import("../src/knowledge.js");
  fs.writeFileSync(path.join(cwd, "app", "layout.tsx"), nextLayout({ stylesheet: "../styles/mlola/index.css" }));
  const fixed = capture();
  await run(["doctor"], { cwd, output: fixed.output });
  assert.match(fixed.stdout.join("\n"), /every theme's fonts are loaded/);
  assert.match(fixed.stdout.join("\n"), /data-theme is set on <html>/);
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

  // Hidden is not faded, an animation's step is not a rule, registering a property styles nothing, a token read with a fallback is a token read, and a script's string is not markup yet.
  assert.deepEqual(
    checkMarkup(`<style>
      .check { opacity: 0 }
      .chart-area { fill: var(--ml-chart-1); opacity: .16 }
      svg path.trend { opacity: .4 }
      .check[aria-checked="true"] { opacity: 1 }
      @keyframes rise { from { opacity: 0 } 50% { opacity: .5 } to { opacity: 1 } }
      @property --ml-surface { syntax: "<color>"; inherits: true; initial-value: #0000 }
      @property --gap { syntax: "<length>"; inherits: false; initial-value: 13px }
      .ghost { background: #0000; border-color: #ffffff00 }
      .divider { background-color: var(--borderColor-default, #d1d9e0); box-shadow: inset 0 -1px 0 0 var(--borderColor-default, var(--color-border, rgb(209 217 224))); padding: var(--gap, 13px) }
    </style>
<p style="color: var(--fgColor-muted, #59636e); margin: var(--gap, 13px)">A token read with a fallback</p>
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
          // On the element the component draws it on, and named, so only the value is in question.
          const tag = example.tags?.[cls]?.[0] ?? "div";
          assert.deepEqual(checkMarkup(`<${tag} class="${cls}" ${attribute}="${value}" aria-label="Example" alt=""></${tag}>`), [], `${name} renders ${cls} ${attribute}="${value}"`);
        }
      }
    }
  }
  assert.ok(checked > 50, "showcases' rendered values are bundled");
  // The states a stylesheet does not draw but a component writes.
  assert.deepEqual(checkMarkup('<div class="ml-checkbox-field" data-state="unchecked"></div>'), []);
  assert.deepEqual(checkMarkup('<button class="ml-toggle-button" data-state="off">Bold</button>'), []);
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
  for (const name of ["get_design_rules", "search_components", "get_component", "get_tokens", "check_markup", "add_components", "audit_page"]) assert.ok(tools.includes(name), name);
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

test("the agents' guide describes every composition primitive, and its markup passes check_markup", async () => {
  const { checkMarkup, designData, designGuide } = await import("../src/knowledge.js");
  const guide = designGuide();
  for (const { name, note } of designData().primitives) {
    assert.ok(note, `.${name} has no description`);
    assert.ok(guide.includes(`- \`.${name}\`: ${note}`), `.${name} is not described in the guide`);
  }
  const blocks = [...guide.matchAll(/```html\n([\s\S]*?)```/g)].map((match) => match[1]);
  assert.ok(blocks.length >= 2);
  for (const html of blocks) assert.deepEqual(checkMarkup(html), [], html);
  assert.match(guide, /## Project setup[\s\S]*--font-newsreader[\s\S]*Newsreader\(\{/);
});

test("the remote MCP server reads, never writes, and never serves Pro source", async () => {
  const handle = remoteMcpHandler({ version: "test" });
  const call = async (method, params) => (await handle({ jsonrpc: "2.0", id: 1, method, params })).result;
  assert.equal((await call("initialize", { protocolVersion: "2025-06-18" })).protocolVersion, "2025-06-18");
  const names = (await call("tools/list")).tools.map((tool) => tool.name);
  assert.ok(names.includes("search_components") && names.includes("check_markup") && names.includes("get_install_command"));
  assert.ok(!names.includes("add_components") && !names.includes("init_project"), "a remote server cannot write to the project");
  assert.ok(!names.includes("audit_page"), "a remote server opens no address in a browser");

  const install = (await call("tools/call", { name: "get_install_command", arguments: { names: ["button", "bot"] } })).content[0].text;
  assert.match(install, /npx mlola-ui login <token>.*bot/s);
  assert.match(install, /npx mlola-ui add button bot/);

  // A page with no build step learns what to load, at this release's version.
  const setup = (await call("tools/call", { name: "get_install_command", arguments: {} })).content[0].text;
  assert.match(setup, /npx mlola-ui init/);
  assert.match(setup, /<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/@mlola-ui\/engine@test\/generated\/mlola\.css">/);
  assert.match(setup, /import \{ observe \} from "https:\/\/cdn\.jsdelivr\.net\/npm\/@mlola-ui\/behavior@test\/src\/index\.js"/);
  assert.match((await call("tools/call", { name: "get_design_rules", arguments: {} })).content[0].text, /data-mode \(light\|dark\|system\) on <html>[\s\S]*--font-newsreader[\s\S]*- \.ml-stack: Children in a column[\s\S]*Without a build step/);
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

/* ── What the check finds beyond classes and colors ─────────────────── */

const rulesOf = (issues) => issues.map((issue) => issue.rule);

test("check_markup refuses a control's class on an element that cannot be operated", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  const [issue] = checkMarkup('<div class="ml-button">Save</div>');
  assert.equal(issue.rule, "element");
  assert.equal(issue.severity, "error");
  assert.match(issue.message, /ml-button is drawn on <button>; on a <div>/);
  assert.match(issue.fix, /<button type="button" class="ml-button">/);
  assert.match(checkMarkup('<span class="ml-input"></span>')[0].fix, /<input class="ml-input">/);
  // A link styled as a button is a control; a role says the author took the keyboard on; a component decides for itself.
  assert.deepEqual(checkMarkup('<a class="ml-button" href="/plans">Plans</a>'), []);
  assert.deepEqual(checkMarkup('<div class="ml-button" role="button" tabindex="0">Save</div>'), []);
  assert.deepEqual(checkMarkup('<Link className="ml-button" href="/plans">Plans</Link>'), []);
  // A class the source also draws on a heading (a sidebar title that does not collapse) is fine on one.
  assert.deepEqual(checkMarkup('<h2 class="ml-sidebar-title">Projects</h2>'), []);
  assert.deepEqual(checkMarkup('<div class="ml-card">Text</div>'), []);
});

test("check_markup finds buttons, links, images and fields with no name", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  const names = (markup) => checkMarkup(markup).filter((issue) => issue.rule === "name").map((issue) => issue.message);
  assert.match(names('<button class="ml-button"><IconTrash /></button>')[0], /button has no name/);
  assert.match(names('<button class="ml-button"><svg aria-hidden="true"></svg></button>')[0], /button has no name/);
  assert.match(names('<a href="/home"><svg></svg></a>')[0], /link has no name/);
  assert.match(names('<img src="/chart.png">')[0], /no alt/);
  assert.match(names('<input class="ml-input" placeholder="Email">')[0], /no label: a placeholder disappears/);
  assert.match(names('<select class="x"></select>')[0], /select has no label/);
  for (const named of [
    '<button class="ml-button">Save</button>',
    '<button class="ml-button" aria-label="Delete project"><IconTrash /></button>',
    '<button class="ml-button"><IconTrash /><span class="ml-visually-hidden">Delete project</span></button>',
    "<button>{label}</button>",
    "<button><Spinner /></button>",
    '<button className="ml-button" {...props} />',
    '<button className="ml-button" aria-hidden="true"><IconX /></button>',
    '<a href="/"><img alt="Home" src="/logo.svg"></a>',
    '<a id="top"></a>',
    '<img src="/a.png" alt="">',
    '<img src="/a.png" role="presentation">',
    '<label>Email <input class="ml-input"></label>',
    '<label for="email">Email</label><input id="email" class="ml-input">',
    '<Label htmlFor="email">Email</Label><input id="email" className="ml-input" />',
    '<input class="ml-input" aria-label="Search">',
    "<input id={id} className=\"ml-input\" />",
    '<input type="hidden" name="token">',
    '<input type="submit" value="Send">',
  ]) {
    assert.deepEqual(names(named), [], named);
  }
  // The second field is outside the label that closed before it.
  assert.equal(names('<label>Name <input></label><input placeholder="Email">').length, 1);
  assert.equal(checkMarkup('\n\n<button><IconX /></button>')[0].line, 3);
});

test("check_markup names a token that does not exist, and the closest that do", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  const tokens = (markup, options) => checkMarkup(markup, options).filter((issue) => issue.rule === "unknown-token");
  const [slip] = tokens('<p style="gap: var(--ml-spacing-4)">x</p>');
  assert.equal(slip.severity, "error");
  assert.match(slip.message, /--ml-spacing-4 is not a Mlola token/);
  assert.match(slip.fix, /Closest: --ml-space-4\./);
  assert.match(tokens('<p style="color: var(--ml-text-secondary)">x</p>')[0].fix, /--ml-text-muted/);
  assert.match(tokens('<p style="color: var(--ml-color-primary)">x</p>')[0].fix, /Closest: --ml-primary\./);
  assert.equal(tokens("<style>.a { color: var(--ml-banana, #fff); }</style>").length, 1, "a fallback does not make the token exist");
  assert.equal(tokens('<div style={{ color: "var(--ml-banana)" }} />').length, 1);
  assert.equal(tokens("<style>.a{color:var(--ml-banana)}.b{background:var(--ml-banana)}</style>").length, 1, "named once");
  // Tokens, a component's own setting, a property the page defines, and one a Pro item or the project defines.
  assert.deepEqual(tokens('<p style="color: var(--ml-text-muted); width: var(--ml-resizable-handle)">x</p>'), []);
  assert.deepEqual(tokens("<style>.a { --ml-glow: 2; opacity: var(--ml-glow); }</style>"), []);
  assert.deepEqual(tokens('<p style="gap: var(--ml-kanban-gap)">x</p>'), [], "a Pro item's property is not published, so not refused");
  assert.deepEqual(tokens('<p style="color: var(--ml-brand-ink)">x</p>', { contract: { classes: new Set(), elements: new Map(), properties: new Set(["--ml-brand-ink"]) } }), []);
  assert.deepEqual(tokens('<p style="color: var(--brand)">x</p>'), [], "only Mlola's namespace is Mlola's to check");
});

test("check_markup counts every measure typed by hand, not only spacing", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  const css = checkMarkup("<style>.a { font-size: 13px; border-radius: 6px; box-shadow: 0 2px 8px var(--ml-shadow-tint); transition: opacity 200ms ease; z-index: 9999; }</style>");
  assert.deepEqual(rulesOf(css).sort(), ["duration", "layer", "radius", "shadow", "type"]);
  assert.ok(css.every((issue) => issue.severity === "warning"));
  assert.deepEqual(css.find((issue) => issue.rule === "type").values, ["13px"]);
  assert.deepEqual(css.find((issue) => issue.rule === "duration").values, ["200ms"]);
  assert.deepEqual(css.find((issue) => issue.rule === "layer").values, ["9999"]);
  const jsx = checkMarkup('<div style={{ fontSize: 13, borderRadius: "6px", zIndex: 50, transition: "opacity 0.2s" }} />');
  assert.deepEqual(rulesOf(jsx).sort(), ["duration", "layer", "radius", "type"]);
  assert.match(jsx.find((issue) => issue.rule === "type").message, /fontSize: 13\)/);
  // The scales, an em tuned to the font, a hairline ring, no transition at all, and the parts of one component in order.
  assert.deepEqual(
    checkMarkup(
      "<style>.a { font-size: var(--ml-type-sm); border-radius: var(--ml-radius-md); box-shadow: 0 0 0 1px var(--ml-border); transition: opacity var(--ml-duration-fast) var(--ml-ease-standard); z-index: var(--ml-layer-modal); }\n.b { font-size: 0.85em; border-radius: 50%; box-shadow: none; transition: none; animation-delay: 0s; z-index: 2; }</style>",
    ),
    [],
  );
});

test("check_markup reads React props and the classes inside an expression", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  const [prop] = checkMarkup('<Button variant="ghost">Save</Button>');
  assert.equal(prop.rule, "value");
  assert.match(prop.message, /variant="ghost" is not a value Button takes/);
  assert.match(prop.fix, /Allowed: primary, secondary, subtle, danger, outline, link\./);
  assert.deepEqual(checkMarkup('<Button variant="outline" size="sm">Save</Button><Button variant={kind}>Save</Button>'), []);
  // Another library's Button, in a project that is not Mlola's.
  assert.deepEqual(checkMarkup('<Button variant="ghost">Save</Button>', { react: false }), []);
  // A project that added the variant to its own copy has it.
  assert.deepEqual(checkMarkup('<Button variant="ghost">Save</Button>', { contract: { classes: new Set(), elements: new Map(), properties: new Set(), words: new Set(["ghost"]) } }), []);
  const written = checkMarkup('<div className={cx("ml-card", active && "ml-card-active", "ml-badg")} />');
  assert.deepEqual(rulesOf(written), ["variant-class", "unknown-class"]);
  assert.deepEqual(checkMarkup('<div className={cx("ml-card", wide && "ml-4", className)} />'), []);
});

test("check_markup says which class was meant", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  const fix = (cls) => checkMarkup(`<div class="${cls}"></div>`)[0].fix;
  assert.match(fix("ml-tab"), /Closest: ml-tabs, ml-tabs-/);
  assert.match(fix("ml-buton"), /Closest: ml-button\./);
  assert.match(fix("ml-dialog-title"), /Closest: ml-modal-title, ml-modal\./);
  assert.match(fix("ml-drawer"), /Closest: ml-sheet-/);
  assert.doesNotMatch(fix("ml-zzzzzzzz"), /Closest/);
});

test("check_markup checks the outline of a whole document only", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  const skipped = checkMarkup("<html><body><h1>Plans</h1><h3>Monthly</h3><h4>Seats</h4><h2>Yearly</h2></body></html>");
  assert.deepEqual(skipped.map((issue) => issue.message), ["This heading skips from h1 to h3."]);
  assert.deepEqual(checkMarkup("<section><h3>Monthly</h3></section>"), [], "a fragment's place in the outline is its page's to know");
});

test("the new rules read hostile input once", async () => {
  const { checkMarkup } = await import("../src/knowledge.js");
  // Each is near the size a page may be. The limit is the one the site's check holds (tests/site-check.test.ts);
  // a runner is about eight times slower than a laptop, so a case that takes over 150 ms here is too near it.
  const cases = {
    "buttons never closed": "<button>".repeat(110_000),
    "one button, no end of tags": `<button>${"<".repeat(900_000)}</button>`,
    "fields with no label": "<input>".repeat(120_000),
    "labels never closed": "<label><input>".repeat(60_000),
    "tokens that do not exist": Array.from({ length: 40_000 }, (_, index) => `var(--ml-q${index})`).join(" "),
    "names run together": "--ml-a".repeat(150_000),
    "classes that do not exist": Array.from({ length: 20_000 }, (_, index) => `<i class="ml-zz${index}">`).join(""),
    "variants that do not exist": Array.from({ length: 20_000 }, (_, index) => `<i class="ml-button-q${index}">`).join(""),
    "props that do not exist": '<Button variant="x">'.repeat(40_000),
    "a declaration with no end": `<style>.a{font-size:${"1px ".repeat(200_000)}}</style>`,
  };
  for (const [name, markup] of Object.entries(cases)) {
    const started = performance.now();
    checkMarkup(markup);
    const took = performance.now() - started;
    assert.ok(took < 1500, `${name}: ${Math.round(took)} ms`);
  }
});

test("search knows other names for what Mlola has, and what a long question is about", async () => {
  const { SYNONYMS, allItems, searchItems } = await import("../src/knowledge.js");
  const names = new Set(allItems().map((item) => item.name));
  for (const [word, items] of Object.entries(SYNONYMS)) for (const item of items) assert.ok(names.has(item), `${word} names ${item}, which is an item`);
  const found = (query) => searchItems({ query }).map((item) => item.name);
  assert.deepEqual(found("popup").slice(0, 2), ["modal", "popover"]);
  assert.equal(found("drawer")[0], "sheet");
  assert.equal(found("snackbar")[0], "toast");
  assert.equal(found("autocomplete")[0], "combobox");
  assert.equal(found("sidebar")[0], "app-shell");
  assert.equal(found("a sidebar navigation for the dashboard")[0], "app-shell");
  assert.ok(found("table with sorting").slice(0, 3).includes("table"));
  assert.equal(found("date range")[0], "date-picker");
});

test("check --fix puts lengths that are steps of the scale back on it, and leaves the rest", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.mkdirSync(path.join(cwd, "src"));
  fs.writeFileSync(path.join(cwd, "src/app.css"), ".card { padding: 1rem 32px; gap: 5px; margin: -24px 0 calc(8px + 2px); inset: var(--offset, 4px); width: 16px; }\n");
  fs.writeFileSync(
    path.join(cwd, "src/page.tsx"),
    `const chart = { padding: 16 };\nexport const Page = () => (\n  <div className="ml-stack" style={{ padding: 16, gap: "8px 13px" }}>\n    <p style="margin: 0 0 0.5rem">Text</p>\n  </div>\n);\n`,
  );
  const first = capture();
  assert.equal(await run(["check", "--fix"], { cwd, env: {}, output: first.output }), 0);
  assert.equal(
    fs.readFileSync(path.join(cwd, "src/app.css"), "utf8"),
    ".card { padding: var(--ml-space-4) var(--ml-space-8); gap: 5px; margin: calc(var(--ml-space-6) * -1) 0 calc(var(--ml-space-2) + var(--ml-space-0-5)); inset: var(--offset, 4px); width: 16px; }\n",
  );
  const page = fs.readFileSync(path.join(cwd, "src/page.tsx"), "utf8");
  assert.match(page, /const chart = \{ padding: 16 \};/, "an object that is not a style is not Mlola's to rewrite");
  assert.match(page, /style=\{\{ padding: "var\(--ml-space-4\)", gap: "var\(--ml-space-2\) 13px" \}\}/);
  assert.match(page, /style="margin: 0 0 var\(--ml-space-2\)"/);
  assert.match(first.stdout.join("\n"), /Put 8 lengths back on the spacing scale in 2 files/);
  assert.match(first.stdout.join("\n"), /2 spacing values: 13px, 5px/);
  const again = capture();
  await run(["check", "--fix"], { cwd, env: {}, output: again.output });
  assert.match(again.stdout.join("\n"), /Nothing to fix/);
});

test("check --hook hands an edited file's issues back to the agent, and stays out of the way otherwise", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.mkdirSync(path.join(cwd, "src"));
  fs.writeFileSync(path.join(cwd, "src/bad.tsx"), 'export const Bad = () => <button className="ml-button"><IconTrash /></button>;\n');
  fs.writeFileSync(path.join(cwd, "src/good.tsx"), 'export const Good = () => <button className="ml-button">Save</button>;\n');
  fs.writeFileSync(path.join(cwd, "notes.md"), "# Notes\n");
  const hook = async (stdin) => {
    const io = capture();
    return { code: await run(["check", "--hook"], { cwd, env: {}, output: io.output, stdin }), ...io };
  };
  const bad = await hook(JSON.stringify({ tool_name: "Edit", tool_input: { file_path: path.join(cwd, "src/bad.tsx") } }));
  assert.equal(bad.code, 2, "2 is what hands the report back to the agent");
  assert.deepEqual(bad.stdout, [], "the report goes where the agent reads it");
  assert.match(bad.stderr.join("\n"), /1 error and 0 warnings in src\/bad\.tsx[\s\S]*line 1, error: This button has no name/);
  for (const quiet of [
    JSON.stringify({ tool_input: { file_path: path.join(cwd, "src/good.tsx") } }),
    JSON.stringify({ tool_input: { file_path: path.join(cwd, "notes.md") } }),
    JSON.stringify({ tool_input: { file_path: path.join(cwd, "src/gone.tsx") } }),
    JSON.stringify({ tool_input: { file_path: "/etc/hosts.html" } }),
    JSON.stringify({ tool_input: {} }),
    "not json",
    "",
  ]) {
    const result = await hook(quiet);
    assert.equal(result.code, 0, quiet);
    assert.deepEqual([...result.stdout, ...result.stderr], [], quiet);
  }
});

test("init gives Claude Code the check as a hook, once, beside what is there", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  fs.mkdirSync(path.join(cwd, ".claude"));
  fs.writeFileSync(path.join(cwd, ".claude/settings.json"), JSON.stringify({ permissions: { allow: ["Bash(npm test)"] }, hooks: { PostToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "echo done" }] }] } }));
  const first = capture();
  assert.equal(await run(["init", "--no-install"], { cwd, output: first.output }), 0);
  const settings = JSON.parse(fs.readFileSync(path.join(cwd, ".claude/settings.json"), "utf8"));
  assert.deepEqual(settings.permissions, { allow: ["Bash(npm test)"] });
  assert.equal(settings.hooks.PostToolUse.length, 2);
  assert.deepEqual(settings.hooks.PostToolUse[1], { matcher: "Edit|Write|MultiEdit", hooks: [{ type: "command", command: "npx -y mlola-ui check --hook" }] });
  assert.match(first.stdout.join("\n"), /Claude Code checks each file it edits/);
  assert.ok(!fs.existsSync(path.join(cwd, ".github")), "no workflow unless asked for");
  await run(["agents"], { cwd, output: capture().output });
  assert.equal(JSON.parse(fs.readFileSync(path.join(cwd, ".claude/settings.json"), "utf8")).hooks.PostToolUse.length, 2, "running again adds no second hook");

  const bare = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  assert.equal(await run(["agents", "--no-hooks", "--ci"], { cwd: bare, output: capture().output }), 0);
  assert.ok(!fs.existsSync(path.join(bare, ".claude")));
  const workflow = fs.readFileSync(path.join(bare, ".github/workflows/mlola-check.yml"), "utf8");
  assert.match(workflow, /on:\n {2}pull_request:/);
  assert.match(workflow, /run: npx -y mlola-ui check\n/);
  fs.writeFileSync(path.join(bare, ".github/workflows/mlola-check.yml"), "# mine\n");
  await run(["agents", "--no-hooks", "--ci"], { cwd: bare, output: capture().output });
  assert.equal(fs.readFileSync(path.join(bare, ".github/workflows/mlola-check.yml"), "utf8"), "# mine\n", "a workflow that is there is the project's");
});

/** A browser that draws nothing: each page answers the audit's two questions with what the test gives it. */
function fakeBrowser(answers) {
  const opened = [];
  return {
    opened,
    launch: async () => ({
      newContext: async (settings) => ({
        newPage: async () => {
          let asked = 0;
          return {
            on: () => {},
            goto: async (url) => {
              opened.push({ url, width: settings.viewport.width, colorScheme: settings.colorScheme });
              if (answers.unreachable) throw new Error("net::ERR_CONNECTION_REFUSED at http://localhost:3000/\nCall log:");
            },
            // In order: fonts, the theme attributes, the layout, the contrast.
            evaluate: async () => [undefined, true, answers.layout?.(settings) ?? [], answers.contrast?.(settings) ?? []][asked++],
            waitForTimeout: async () => {},
            screenshot: async () => {},
          };
        },
        close: async () => {},
      }),
      close: async () => {},
    }),
  };
}

test("audit opens the page on a desktop and a phone, light and dark, and reports each problem once", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  const browser = fakeBrowser({
    layout: (settings) => (settings.viewport.width < 600 ? [{ kind: "sideways", detail: "the page scrolls 40px sideways" }] : []),
    contrast: () => [{ where: "p.note", text: "Saved", ratio: 2.1, need: 4.5, fg: "rgb(180,180,180)", bg: "rgb(255,255,255)" }],
  });
  const io = capture();
  assert.equal(await run(["audit", "localhost:3000/settings"], { cwd, output: io.output, launch: browser.launch }), 1);
  assert.deepEqual(browser.opened.map((view) => `${view.width}/${view.colorScheme}`), ["1280/light", "1280/dark", "390/light", "390/dark"]);
  assert.ok(browser.opened.every((view) => view.url === "http://localhost:3000/settings"));
  const printed = io.stdout.join("\n");
  assert.match(printed, /Sideways scroll\n {2}the page scrolls 40px sideways {2}\[phone\/light, phone\/dark\]/);
  assert.match(printed, /p\.note "Saved" is 2\.1:1 and needs 4\.5:1 \(rgb\(180,180,180\) on rgb\(255,255,255\)\) {2}\[every view\]/);
  assert.match(printed, /Opened in 4 views \(desktop and phone, light and dark\): 2 problems\./);

  const clean = capture();
  assert.equal(await run(["audit", "http://localhost:3000", "--modes", "light", "--json"], { cwd, output: clean.output, launch: fakeBrowser({}).launch }), 0);
  const report = JSON.parse(clean.stdout.join("\n"));
  assert.deepEqual(report.views, ["desktop/light", "phone/light"]);
  assert.deepEqual(report.problems, []);

  const themed = fakeBrowser({});
  await run(["audit", "http://localhost:3000", "--themes", "all", "--modes", "light"], { cwd, output: capture().output, launch: themed.launch });
  assert.equal(themed.opened.length, 10, "five themes, a desktop and a phone");

  const down = capture();
  assert.equal(await run(["audit", "http://localhost:3000"], { cwd, output: down.output, launch: fakeBrowser({ unreachable: true }).launch }), 1);
  assert.match(down.stdout.join("\n"), /could not be opened: net::ERR_CONNECTION_REFUSED at http:\/\/localhost:3000\/ {2}\[every view\]/);
});

test("audit says what it needs when it has no page or no browser to open", async () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-cli-"));
  const failing = async (argv, options = {}) => {
    const io = capture();
    assert.equal(await run(argv, { cwd, output: io.output, ...options }), 1);
    return io.stderr.join("\n");
  };
  const launch = fakeBrowser({}).launch;
  assert.match(await failing(["audit"], { launch }), /Name the page to open/);
  assert.match(await failing(["audit", "settings"], { launch }), /not a file here, and not an address/);
  assert.match(await failing(["audit", "ftp://example.com/page"], { launch }), /opens http, https and file addresses/);
  assert.match(await failing(["audit", "http://localhost:3000", "--themes", "neon"], { launch }), /neon is not a theme\. Themes: graphite/);
  assert.match(await failing(["audit", "http://localhost:3000", "--modes", "sepia"], { launch }), /--modes takes light, dark or both/);
  assert.match(
    await failing(["audit", "http://localhost:3000"], { launch: async () => { throw new Error("browserType.launch: Executable doesn't exist at /ms-playwright/chromium"); } }),
    /Run: npx playwright install chromium/,
  );
  fs.writeFileSync(path.join(cwd, "page.html"), "<!doctype html><title>Page</title>");
  const local = fakeBrowser({});
  assert.equal(await run(["audit", "page.html"], { cwd, output: capture().output, launch: local.launch }), 0);
  assert.match(local.opened[0].url, /^file:\/\/.*page\.html$/);
});
