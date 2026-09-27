import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

/**
 * The rules in packages/assets/README.md, for every asset, however it was
 * made. The builders check some of them as they write; a hand-made asset
 * skips the builders, so the rules are checked here too.
 */

const ROOT = path.resolve(import.meta.dirname, "..");
const ASSETS = path.join(ROOT, "packages/assets");
const ROLES = new Set(["primary", "accent", "surface", "ink", "neutral", "metal"]);

const directories = (kind) =>
  fs
    .readdirSync(path.join(ASSETS, kind), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

/** Every --ml-* custom property the engine defines, in any theme or mode. */
function definedTokens() {
  const tokens = new Set();
  for (const directory of ["packages/engine/generated", "packages/engine/css"]) {
    for (const file of fs.readdirSync(path.join(ROOT, directory)).filter((name) => name.endsWith(".css"))) {
      for (const [, token] of fs.readFileSync(path.join(ROOT, directory, file), "utf8").matchAll(/(--ml-[a-z0-9-]+)\s*:/g)) tokens.add(token);
    }
  }
  return tokens;
}

/** The material names inside a binary glTF. */
function glbMaterials(file) {
  const buffer = fs.readFileSync(file);
  const length = buffer.readUInt32LE(12);
  const json = JSON.parse(buffer.subarray(20, 20 + length).toString("utf8"));
  return (json.materials ?? []).map((material) => material.name);
}

test("every 2D asset paints with theme tokens, stays self-contained and under budget", () => {
  const tokens = definedTokens();
  for (const id of directories("2d")) {
    const directory = path.join(ASSETS, "2d", id);
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, "asset.json"), "utf8"));
    assert.equal(manifest.id, id, `${id}: asset.json names its directory`);
    assert.equal(manifest.kind, "2d", `${id}: kind`);
    assert.equal(manifest.license, "MIT", `${id}: license`);
    for (const file of manifest.files) assert.ok(fs.existsSync(path.join(directory, file.path)), `${id}: ${file.path} is listed and present`);

    const svg = fs.readFileSync(path.join(directory, `${id}.svg`), "utf8");
    assert.ok(Buffer.byteLength(svg) <= 30 * 1024, `${id}: over the 30 KB budget`);
    assert.match(svg, /viewBox=/, `${id}: has a viewBox`);
    assert.doesNotMatch(svg, /<text|<filter|<image|<script|<style|font-family|xlink:href/, `${id}: no text, filters, images, scripts or fonts`);
    assert.doesNotMatch(svg, /\sid="/, `${id}: no ids, so two copies on a page never collide`);

    // A color is a token with a fallback for <img>; never a bare value.
    const bare = svg.replace(/var\(--ml-[a-z0-9-]+,\s*#[0-9a-fA-F]{3,8}\)/g, "");
    assert.deepEqual(bare.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|\b(?:white|black)\b/g) ?? [], [], `${id}: a color outside var(--ml-…)`);
    for (const [, token] of svg.matchAll(/var\((--ml-[a-z0-9-]+)/g)) assert.ok(tokens.has(token), `${id}: ${token} is not an engine token`);

    const component = fs.readFileSync(path.join(directory, `${id}.tsx`), "utf8");
    assert.match(component, /aria-hidden/, `${id}: the component is decorative unless named`);
  }
});

test("every 3D asset has a poster, stays under budget and names its materials by role", () => {
  for (const id of directories("3d")) {
    const directory = path.join(ASSETS, "3d", id);
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, "asset.json"), "utf8"));
    assert.equal(manifest.id, id, `${id}: asset.json names its directory`);
    assert.equal(manifest.license, "MIT", `${id}: license`);
    for (const file of manifest.files) assert.ok(fs.existsSync(path.join(directory, file.path)), `${id}: ${file.path} is listed and present`);

    const model = path.join(directory, `${id}.glb`);
    const poster = path.join(directory, `${id}-poster.webp`);
    assert.ok(fs.statSync(model).size <= 1.5 * 1024 * 1024, `${id}: model over the 1.5 MB budget`);
    assert.ok(fs.existsSync(poster), `${id}: every model needs a poster`);
    assert.ok(fs.statSync(poster).size <= 40 * 1024, `${id}: poster over the 40 KB budget`);

    const materials = glbMaterials(model);
    for (const name of materials) assert.ok(ROLES.has(name), `${id}: material "${name}" is not a theme role`);
    assert.deepEqual([...new Set(materials)].sort(), [...new Set(manifest.materials)].sort(), `${id}: asset.json lists the model's materials`);
  }
});
