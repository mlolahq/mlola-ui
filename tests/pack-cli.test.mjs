import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI_PACKAGE = path.join(ROOT, "packages/cli");

test("packed CLI tarball can init and add without a repository checkout", async () => {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-pack-"));
  const packDir = path.join(workspace, "pack");
  const appDir = path.join(workspace, "app");
  fs.mkdirSync(packDir);
  fs.mkdirSync(appDir);

  const packed = spawnSync("npm", ["pack", "--pack-destination", packDir], {
    cwd: CLI_PACKAGE,
    encoding: "utf8",
  });
  assert.equal(packed.status, 0, packed.stderr || packed.stdout);
  const tarball = fs.readdirSync(packDir).find((name) => name.endsWith(".tgz"));
  assert.ok(tarball, "npm pack did not emit a tarball");

  fs.writeFileSync(
    path.join(appDir, "package.json"),
    JSON.stringify({ name: "mlola-pack-fixture", private: true, type: "module" }, null, 2),
  );
  const install = spawnSync("npm", ["install", path.join(packDir, tarball)], {
    cwd: appDir,
    encoding: "utf8",
  });
  assert.equal(install.status, 0, install.stderr || install.stdout);

  // Offline: this proves the copy works from the tarball alone. Installing the
  // engine would ask npm for a version that is not published until this passes.
  const init = spawnSync("npx", ["mlola-ui", "init", "--no-install"], { cwd: appDir, encoding: "utf8" });
  assert.equal(init.status, 0, init.stderr || init.stdout);
  assert.match(fs.readFileSync(path.join(appDir, "styles/mlola/index.css"), "utf8"), /@mlola-ui\/engine/);

  const add = spawnSync("npx", ["mlola-ui", "add", "button", "--no-install"], { cwd: appDir, encoding: "utf8" });
  assert.equal(add.status, 0, add.stderr || add.stdout);
  assert.ok(fs.existsSync(path.join(appDir, "components/ui/button.tsx")));

  const doctor = spawnSync("npx", ["mlola-ui", "doctor"], { cwd: appDir, encoding: "utf8" });
  assert.equal(doctor.status, 0, doctor.stderr || doctor.stdout);
});
