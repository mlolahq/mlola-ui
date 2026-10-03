import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { MODULES, migrateProject, migrateSource } from "../src/migrate.js";
import { loadRegistry } from "../src/registry.js";

const ICONS = new Set(["X", "Check", "IconCheck", "Search", "TriangleAlert", "IconProps", "IconTrash"]);

test("written-out props become Mlola's, and the components to add are named", () => {
  const source = `import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle } from "@/components/ui/alert";

export function Row() {
  return (
    <div>
      <Button variant="destructive" size="sm" onClick={() => remove(id)}>Delete</Button>
      <Button variant='ghost' size="icon" aria-label="Close"><X /></Button>
      <Button variant={"default"}>Save</Button>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="destructive">Late</Badge>
      <Alert variant="destructive"><AlertTitle>Could not save</AlertTitle></Alert>
      <Alert variant="default">Saved</Alert>
    </div>
  );
}`;
  const { output, changes, manual, items } = migrateSource(source, { icons: ICONS });
  assert.match(output, /<Button variant="danger" size="sm" onClick=\{\(\) => remove\(id\)\}>Delete<\/Button>/);
  assert.match(output, /<Button variant="subtle" size="icon" aria-label="Close">/);
  assert.match(output, /<Button variant="primary">Save<\/Button>/);
  assert.match(output, /<Badge tone="neutral">Draft<\/Badge>/);
  assert.match(output, /<Badge tone="danger" variant="solid">Late<\/Badge>/);
  assert.match(output, /<Alert tone="danger"><AlertTitle>/);
  assert.match(output, /<Alert>Saved<\/Alert>/);
  // Imports keep their path: Mlola installs at the same files.
  assert.match(output, /from "@\/components\/ui\/button"/);
  assert.equal(changes.length, 7);
  assert.deepEqual(manual, []);
  assert.deepEqual(items.sort(), ["alert", "badge", "button"]);
});

test("a value known only at runtime, a cva helper and a component whose API differs are listed, not changed", () => {
  const source = `import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Danger = ({ tone }) => <Button variant={tone}>Go</Button>;
export const link = buttonVariants({ variant: "outline" });`;
  const { output, manual, items } = migrateSource(source, { icons: ICONS });
  assert.equal(output, source);
  assert.equal(manual.length, 3);
  assert.match(manual.find((entry) => entry.line === 5).text, /buttonVariants\(\): .*className="ml-button" data-variant="outline"/);
  assert.match(manual.find((entry) => entry.line === 2).text, /Dialog becomes Modal/);
  assert.match(manual.find((entry) => entry.line === 4).text, /only known at runtime.*destructive → variant="danger"/);
  assert.deepEqual(items.sort(), ["button", "modal"]);
});

test("sonner, switch and lucide-react move to Mlola's modules, and toast.error is toast.danger", () => {
  const source = `import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { X, CheckIcon as Done } from "lucide-react";
import { Sparkle } from "lucide-react";

toast.error("Could not save");
toast.success("Saved");
toast.dismiss(id);`;
  const { output, manual, items, needsIcons } = migrateSource(source, { icons: ICONS });
  assert.match(output, /import \{ toast \} from "@\/components\/ui\/toast";/);
  assert.match(output, /import \{ Switch \} from "@\/components\/ui\/toggle";/);
  assert.match(output, /import \{ Toaster \} from "@\/components\/ui\/toast";/);
  assert.match(output, /import \{ X, Check as Done \} from "@mlola-ui\/icons";/);
  // Matched loosely around the quotes, so the dependency audit does not read the pattern as an import.
  assert.match(output, /import \{ Sparkle \} from .lucide-react.;/);
  assert.match(output, /toast\.danger\("Could not save"\)/);
  assert.match(output, /toast\.success\("Saved"\)/);
  assert.ok(manual.some((entry) => entry.line === 5 && /Sparkle has no glyph/.test(entry.text)));
  // Mlola's toast has dismiss too.
  assert.match(output, /toast\.dismiss\(id\)/);
  assert.ok(!manual.some((entry) => entry.line === 9));
  assert.deepEqual(items.sort(), ["toast", "toggle"]);
  assert.equal(needsIcons, true);
});

test("a project's own ui alias from components.json is followed, and relative imports are read too", () => {
  // The relative path is put together so the mirror's export check does not read the sample as an import of its own.
  const relative = ["..", "ui", "card"].join("/");
  const source = `import { Button } from "~/ui/button";
import { Card } from "${relative}";
const a = <Button variant="ghost">A</Button>;`;
  const { output, items } = migrateSource(source, { alias: "~/ui", icons: ICONS });
  assert.match(output, /variant="subtle"/);
  assert.deepEqual(items.sort(), ["button", "card"]);
});

test("every component the migration names is in the registry, free or Pro", () => {
  const catalog = JSON.parse(fs.readFileSync(new URL("../registry/catalog.json", import.meta.url), "utf8"));
  const names = new Set([...loadRegistry().items, ...catalog.items].map((item) => item.name));
  for (const [module, entry] of Object.entries(MODULES)) {
    if (entry.item) assert.ok(names.has(entry.item), `${module} names ${entry.item}, which the registry does not have`);
  }
});

test("a project is read without --write and rewritten with it, leaving shadcn/ui's own files alone", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "mlola-migrate-"));
  fs.mkdirSync(path.join(cwd, "components", "ui"), { recursive: true });
  fs.mkdirSync(path.join(cwd, "app"), { recursive: true });
  const page = `import { Button } from "@/components/ui/button";\nexport default () => <Button variant="destructive">Delete</Button>;\n`;
  fs.writeFileSync(path.join(cwd, "app", "page.tsx"), page);
  const own = `export function Button({ variant = "default" }) { return <button data-variant={variant} />; }\n`;
  fs.writeFileSync(path.join(cwd, "components", "ui", "button.tsx"), own);

  const dry = migrateProject(cwd);
  assert.equal(dry.written, false);
  assert.deepEqual(dry.files.map((file) => file.file), [path.join("app", "page.tsx")]);
  assert.equal(fs.readFileSync(path.join(cwd, "app", "page.tsx"), "utf8"), page);

  const wet = migrateProject(cwd, { write: true });
  assert.deepEqual(wet.items, ["button"]);
  assert.match(fs.readFileSync(path.join(cwd, "app", "page.tsx"), "utf8"), /variant="danger"/);
  assert.equal(fs.readFileSync(path.join(cwd, "components", "ui", "button.tsx"), "utf8"), own);
});

test("the older use-toast's object becomes a message, and a destructive one a danger toast", () => {
  const source = `import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

toast({ title: "Saved", description: "Your changes are live." });
toast({ title: "Something went wrong.", description: "Try again.", variant: "destructive" });
toast({ title: name, description: "Hi" });`;
  const { output, manual, items } = migrateSource(source, { icons: ICONS });
  assert.match(output, /import \{ toast \} from "@\/components\/ui\/toast";/);
  assert.match(output, /import \{ Toaster \} from "@\/components\/ui\/toast";/);
  assert.match(output, /toast\("Saved", \{ description: "Your changes are live\." \}\);/);
  assert.match(output, /toast\.danger\("Something went wrong\.", \{ description: "Try again\." \}\);/);
  assert.match(output, /toast\(\{ title: name, description: "Hi" \}\);/);
  assert.ok(manual.some((entry) => entry.line === 6 && /message first/.test(entry.text)));
  assert.deepEqual(items, ["toast"]);
});

test("lucide icons Mlola has move, renamed ones by their new name, and the rest stay named on lucide-react", () => {
  const source = `import { AlertTriangle, Pizza, Trash, type LucideProps, X } from "lucide-react";`;
  const { output, manual } = migrateSource(source, { icons: ICONS });
  assert.equal(output, `import { TriangleAlert as AlertTriangle, IconTrash as Trash, type IconProps as LucideProps, X } from "@mlola-ui/icons";\nimport { Pizza } from "lucide-react";`);
  assert.match(manual[0].text, /Pizza has no glyph.*stays on lucide-react/);
  // One name per line, and no semicolons, when that is how the project writes them.
  const stacked = migrateSource(`import {\n  Check,\n  Pizza,\n} from "lucide-react"\n`, { icons: ICONS }).output;
  assert.equal(stacked, `import {\n  Check,\n} from "@mlola-ui/icons"\nimport {\n  Pizza,\n} from "lucide-react"\n`);
});

test("a cva call is named at each use with the attributes that replace it", () => {
  const source = `import { buttonVariants } from "@/components/ui/button";
const a = <Link className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-4")} href="/">Home</Link>;
const b = <Link className={buttonVariants()} href="/">Home</Link>;`;
  const { manual } = migrateSource(source, { icons: ICONS });
  assert.match(manual.find((entry) => entry.line === 2).text, /className="ml-button" data-variant="subtle" data-size="sm"/);
  assert.match(manual.find((entry) => entry.line === 3).text, /className="ml-button" data-variant="primary" on the element/);
});
