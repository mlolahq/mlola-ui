import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";

// What an app installs from npm has to run as it is: no TypeScript source
// behind an entry point, and every entry resolvable once the package is built.
const root = path.resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const PACKAGES = ["engine", "tokens", "behavior", "motion", "scene", "icons", "registry", "cli"];
const manifest = (name) => JSON.parse(fs.readFileSync(path.join(root, "packages", name, "package.json"), "utf8"));

function entries(value) {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") return Object.values(value).flatMap(entries);
  return [];
}

test("no published entry point is TypeScript source", () => {
  for (const name of PACKAGES) {
    const pkg = manifest(name);
    const targets = [pkg.main, pkg.module, ...entries(pkg.exports)].filter(Boolean);
    for (const target of targets) {
      if (target.endsWith(".d.ts")) continue;
      assert.doesNotMatch(target, /\.(ts|tsx|mts|cts)$/, `${pkg.name} points ${target} at source an app cannot run`);
    }
  }
});

test("the built React packages import by name, with their named exports", async () => {
  const tsc = require.resolve("typescript/bin/tsc");
  for (const name of ["motion", "scene", "icons"]) {
    execFileSync(process.execPath, [tsc, "-p", path.join(root, "packages", name, "tsconfig.json")], { stdio: "inherit" });
    const pkg = manifest(name);
    for (const [subpath, target] of Object.entries(pkg.exports)) {
      if (typeof target === "string") continue; // stylesheets
      assert.ok(fs.existsSync(path.join(root, "packages", name, target.types)), `${pkg.name}${subpath.slice(1)} has types`);
    }
  }
  const motion = await import("@mlola-ui/motion");
  assert.equal(typeof motion.Magnetic, "object");
  assert.equal(typeof (await import("@mlola-ui/motion/physics")).integrateSpring, "function");
  assert.equal(typeof (await import("@mlola-ui/scene")).Stage3D, "object");
  const icons = await import("@mlola-ui/icons");
  assert.equal(typeof icons.IconCheck, "object");
});
