import fs from "node:fs";
import path from "node:path";
import { listFiles } from "./check.js";
import { BUNDLED_REGISTRY_ROOT, readJson } from "./registry.js";

/**
 * `mlola-ui migrate`: moves a project from shadcn/ui to Mlola, the part a
 * machine can do without guessing. Mlola installs a component at the same
 * path (components/ui/button.tsx), so most imports stay as they are; what
 * changes is the props: variant="destructive" becomes variant="danger",
 * a Badge's variant becomes its tone, toast.error becomes toast.danger, and
 * lucide-react icons come from @mlola-ui/icons. Only literal values are
 * rewritten. A value computed at runtime, a component whose API differs
 * (Dialog, Select, Dropdown Menu…) and a cva() helper are listed with what
 * to do, never changed. It reads by default and writes only with --write.
 */

const GUIDE = "https://ui.mlola.com/docs/migrate-from-shadcn";

/** Each prop value, as the attributes it becomes ([] drops the attribute: the default). */
const BUTTON = {
  variant: { default: [["variant", "primary"]], destructive: [["variant", "danger"]], ghost: [["variant", "subtle"]], secondary: [["variant", "secondary"]], outline: [["variant", "outline"]], link: [["variant", "link"]] },
  size: { default: [["size", "md"]], sm: [["size", "sm"]], lg: [["size", "lg"]], icon: [["size", "icon"]], "icon-sm": [["size", "icon"]], "icon-lg": [["size", "icon"]] },
};
const BADGE = {
  variant: { default: [["tone", "primary"], ["variant", "solid"]], secondary: [["tone", "neutral"]], destructive: [["tone", "danger"], ["variant", "solid"]], outline: [["variant", "outline"]] },
};
const ALERT = { variant: { default: [], destructive: [["tone", "danger"]] } };

/**
 * shadcn/ui's modules (the file under components/ui), and what each is in
 * Mlola: the item to add, the module when its name differs, the props that
 * change, or, when the API differs, what to do by hand.
 */
export const MODULES = {
  accordion: { item: "accordion" },
  alert: { item: "alert", props: { Alert: ALERT } },
  badge: { item: "badge", props: { Badge: BADGE } },
  breadcrumb: { item: "breadcrumb" },
  button: { item: "button", props: { Button: BUTTON } },
  card: { item: "card" },
  checkbox: { item: "checkbox" },
  input: { item: "input" },
  kbd: { item: "kbd" },
  pagination: { item: "pagination" },
  progress: { item: "progress" },
  "radio-group": { item: "radio-group" },
  skeleton: { item: "skeleton" },
  sonner: { item: "toast", module: "toast" },
  toaster: { item: "toast", module: "toast" },
  "use-toast": { item: "toast", module: "toast" },
  switch: { item: "toggle", module: "toggle" },
  table: { item: "table" },
  tabs: { item: "tabs" },
  textarea: { item: "textarea" },
  "alert-dialog": { item: "modal", manual: 'Alert Dialog becomes Modal with role="alertdialog": ModalHeader, ModalBody and ModalFooter.' },
  "aspect-ratio": { manual: "Use the native CSS aspect-ratio." },
  avatar: { item: "avatar", manual: "Avatar takes name and src as props; AvatarImage and AvatarFallback go away." },
  calendar: { item: "calendar", manual: "mode is single, multiple or range; check the selected value's shape." },
  carousel: { item: "carousel", manual: "Rebuild with Carousel's own parts." },
  chart: { item: "chart", manual: "Use Chart, LineChart, BarChart or DonutChart: native SVG, with no charting library." },
  collapsible: { item: "accordion", manual: "Use an Accordion with one item, or a native <details>." },
  combobox: { item: "combobox", manual: "Options are data passed as a prop." },
  command: { item: "command-menu", manual: "Command becomes CommandMenu; its items are data." },
  "context-menu": { item: "context-menu", manual: "Items are data passed as items, not children." },
  dialog: { item: "modal", manual: "Dialog becomes Modal, with ModalHeader, ModalBody and ModalFooter." },
  drawer: { item: "sheet", manual: 'Drawer becomes Sheet with side="bottom".' },
  "dropdown-menu": { item: "dropdown-menu", manual: "Items are data passed as items, not children." },
  form: { item: "input", manual: "Field wires the label, hint and error; keep your form library, Input forwards its ref." },
  "hover-card": { item: "hover-card", manual: "Rebuild with HoverCard's props." },
  "input-otp": { item: "otp-input", manual: "Input OTP becomes OtpInput." },
  label: { item: "input", manual: "Pass label to Input, Select or Textarea; Field wires it." },
  menubar: { item: "dropdown-menu", manual: "One DropdownMenu per menu." },
  "navigation-menu": { item: "app-shell", manual: "For application navigation, use the app shell's Sidebar." },
  popover: { item: "popover", manual: "The trigger and the content are props." },
  resizable: { item: "resizable", manual: "Rebuild with Resizable's panels." },
  "scroll-area": { manual: "Native scrolling: scroll areas inside components already use thin, themed scrollbars." },
  select: { item: "select", manual: "Options are data; searchable, clearable and multiple are props." },
  separator: { manual: 'Use the ml-divider primitive: <hr class="ml-divider" />.' },
  sheet: { item: "sheet", manual: "Rebuild with Sheet's props: side, and the content as children." },
  sidebar: { item: "app-shell", manual: "Sidebar, SidebarSection and SidebarItem, with a drawer on phones." },
  slider: { item: "slider", manual: "value is a number, not an array of one." },
  toggle: { item: "button", manual: 'Use Button with variant="subtle" or "secondary" and aria-pressed.' },
  "toggle-group": { item: "segmented-control", manual: "Toggle Group becomes SegmentedControl; options are data." },
  tooltip: { item: "tooltip", manual: "The text is the content prop; there is no TooltipContent." },
};

const SOURCE = new Set([".tsx", ".jsx", ".ts", ".js", ".mjs"]);

/** The project's components alias, from shadcn's components.json: "@/components/ui" unless it says otherwise. */
function uiAlias(cwd) {
  try {
    const config = JSON.parse(fs.readFileSync(path.join(cwd, "components.json"), "utf8"));
    return config?.aliases?.ui ?? `${config?.aliases?.components ?? "@/components"}/ui`;
  } catch {
    return "@/components/ui";
  }
}

let iconNames = null;
/** Every name @mlola-ui/icons exports. */
function mlolaIcons() {
  const filename = path.join(BUNDLED_REGISTRY_ROOT, "icons.json");
  iconNames ??= new Set(fs.existsSync(filename) ? (readJson(filename).names ?? []) : []);
  return iconNames;
}

/** Glyphs lucide-react renamed, by their old names, as Mlola names them. */
const LUCIDE_RENAMED = { AlertTriangle: "TriangleAlert", AlertCircle: "CircleAlert", CheckCircle: "CircleCheck", CheckCircle2: "CircleCheck", XCircle: "CircleX", HelpCircle: "CircleHelp", Edit: "Pencil", Trash2: "Trash" };

/** The Mlola name a lucide-react import stands for (XIcon and LucideX are both X; LucideProps is IconProps), or null. */
function lucideName(name, icons) {
  if (name === "LucideProps") return "IconProps";
  const bare = name.replace(/^Lucide(?=[A-Z])/, "").replace(/(?<=.)Icon$/, "");
  const renamed = LUCIDE_RENAMED[bare] ?? bare;
  if (icons.has(renamed)) return renamed;
  return icons.has(`Icon${renamed}`) ? `Icon${renamed}` : null;
}

/** A call's object of string literals ({ variant: "ghost", size: "sm" }), or null when anything in it is computed. */
function literalObject(text) {
  const pairs = {};
  const rest = text.replace(/(\w+)\s*:\s*(?:"([^"\\]*)"|'([^'\\]*)'|`([^`$\\]*)`)/g, (_, key, double, single, template) => {
    pairs[key] = double ?? single ?? template;
    return "";
  });
  return /^[\s,]*$/.test(rest) ? pairs : null;
}

/** The text between the parentheses of a call whose "(" is at `open`, and where it ends, or null when it does not close. */
function argumentsAt(source, open) {
  let depth = 0;
  let quote = null;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === quote && source[index - 1] !== "\\") quote = null;
    } else if (char === '"' || char === "'" || char === "`") quote = char;
    else if (char === "(") depth += 1;
    else if (char === ")" && (depth -= 1) === 0) return { text: source.slice(open + 1, index), end: index };
  }
  return null;
}

/** Where an import's specifiers are, and each one's imported and local name. */
function specifiersOf(clause) {
  const named = /\{([\s\S]*)\}/.exec(clause);
  if (!named) return null;
  return named[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [imported, local] = part.replace(/^type\s+/, "").split(/\s+as\s+/);
      return { imported: imported.trim(), local: (local ?? imported).trim(), type: part.startsWith("type ") };
    });
}

/** The end of the JSX opening tag that starts at `start` (its "<"), past strings and braces. */
function openingTagEnd(source, start) {
  let depth = 0;
  let quote = null;
  for (let index = start + 1; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === quote && source[index - 1] !== "\\") quote = null;
    } else if (char === '"' || char === "'" || char === "`") quote = char;
    else if (char === "{") depth += 1;
    else if (char === "}") depth -= 1;
    else if (char === ">" && depth === 0) return index;
  }
  return -1;
}

const lineOf = (source, index) => source.slice(0, index).split("\n").length;

/**
 * One file's migration: the source after it, each change made, and each
 * thing left to do by hand, with its line. `alias` is the project's ui alias.
 */
export function migrateSource(source, { alias = "@/components/ui", icons = mlolaIcons() } = {}) {
  const changes = [];
  const manual = [];
  const items = new Set();
  let needsIcons = false;
  let output = source;
  // Edits are collected against the original and applied from the end, so every index stays true.
  const edits = [];
  const edit = (start, end, text) => edits.push({ start, end, text });

  const uiPath = new RegExp(`^(?:${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}|\\.{1,2}(?:/\\.\\.)*(?:/components)?/ui)/([a-z-]+)$`);
  const localProps = new Map();

  for (const match of source.matchAll(/import\s+([\s\S]*?)\s+from\s+(["'])([^"']+)\2/g)) {
    const [whole, clause, quote, from] = match;
    const fromAt = match.index + whole.lastIndexOf(from) - 1;
    const line = lineOf(source, match.index);

    if (from === "sonner") {
      edit(fromAt, fromAt + from.length + 2, `${quote}${alias}/toast${quote}`);
      changes.push({ line, text: `toast from "sonner" → "${alias}/toast"` });
      items.add("toast");
      continue;
    }

    if (from === "lucide-react") {
      const specifiers = specifiersOf(clause);
      if (!specifiers) continue;
      // The glyphs Mlola has move; the rest stay on lucide-react, named, until someone picks theirs.
      const moved = specifiers.filter((specifier) => lucideName(specifier.imported, icons));
      const kept = specifiers.filter((specifier) => !lucideName(specifier.imported, icons));
      if (!moved.length) {
        manual.push({ line, text: `lucide-react: ${kept.map((specifier) => specifier.imported).join(", ")} ${kept.length === 1 ? "has" : "have"} no glyph of the same name in @mlola-ui/icons. Pick one at https://ui.mlola.com/assets, or keep lucide-react for ${kept.length === 1 ? "it" : "them"}.` });
        continue;
      }
      // Written the way the project writes imports: one per line when it did, a semicolon when it uses them.
      const multiline = clause.includes("\n");
      const semicolon = source[match.index + whole.length] === ";" ? ";" : "";
      const write = (list, module) => {
        const names = list.map(({ imported, local, type }) => `${type ? "type " : ""}${imported === local ? imported : `${imported} as ${local}`}`);
        const body = multiline ? `{\n${names.map((name) => `  ${name},`).join("\n")}\n}` : `{ ${names.join(", ")} }`;
        return `import ${body} from ${quote}${module}${quote}`;
      };
      const mlola = moved.map(({ imported, local, type }) => ({ imported: lucideName(imported, icons), local, type }));
      const statement = kept.length ? `${write(mlola, "@mlola-ui/icons")}${semicolon}\n${write(kept, "lucide-react")}` : write(mlola, "@mlola-ui/icons");
      edit(match.index, match.index + whole.length, statement);
      changes.push({ line, text: `${moved.length} ${moved.length === 1 ? "icon" : "icons"} from lucide-react → @mlola-ui/icons` });
      if (kept.length) manual.push({ line, text: `lucide-react: ${kept.map((specifier) => specifier.imported).join(", ")} ${kept.length === 1 ? "has" : "have"} no glyph of the same name in @mlola-ui/icons, so ${kept.length === 1 ? "it stays" : "they stay"} on lucide-react. Pick ${kept.length === 1 ? "one" : "them"} at https://ui.mlola.com/assets.` });
      needsIcons = true;
      continue;
    }

    const module = uiPath.exec(from)?.[1];
    if (!module) continue;
    const entry = MODULES[module];
    if (!entry) {
      manual.push({ line, text: `${from}: Mlola has no component by this name. See ${GUIDE}#components.` });
      continue;
    }
    if (entry.item) items.add(entry.item);
    if (entry.manual) {
      manual.push({ line, text: `${module}: ${entry.manual} ${GUIDE}#components` });
      continue;
    }
    const specifiers = specifiersOf(clause) ?? [];
    // cva helpers (buttonVariants) have no Mlola counterpart: variants are data-* attributes. Each call is named with what replaces it.
    for (const specifier of specifiers.filter((entry) => /Variants$/.test(entry.imported))) {
      const props = entry.props?.[specifier.imported.replace(/Variants$/, "").replace(/^./, (first) => first.toUpperCase())] ?? {};
      for (const call of source.matchAll(new RegExp(`\\b${specifier.local}\\(`, "g"))) {
        const args = argumentsAt(source, call.index + specifier.local.length);
        const written = args ? literalObject(args.text.trim().replace(/^\{|\}$/g, "")) : null;
        // A call with no variant draws the default one, which Mlola names: "default" is primary.
        const given = written && props.variant?.default ? { variant: "default", ...written } : written;
        const attributes = given
          ? Object.entries(given).flatMap(([prop, value]) => props[prop]?.[value] ?? [[prop, value]]).map(([name, value]) => ` data-${name}="${value}"`).join("")
          : ' data-variant="…"';
        manual.push({ line: lineOf(source, call.index), text: `${specifier.local}(): Mlola has no class-string helper. Write className="ml-${module}"${attributes} on the element (keep its other classes), or use the component itself.` });
      }
    }
    if (module === "use-toast" && specifiers.some((specifier) => specifier.imported === "useToast")) {
      manual.push({ line, text: `useToast: Mlola's toast needs no hook. import { toast } from "${alias}/toast" and call it where the hook was read.` });
    }
    if (entry.module) {
      edit(fromAt, fromAt + from.length + 2, `${quote}${from.replace(/[a-z-]+$/, entry.module)}${quote}`);
      changes.push({ line, text: `"${from}" → "${from.replace(/[a-z-]+$/, entry.module)}"` });
    }
    for (const { imported, local } of specifiers) if (entry.props?.[imported]) localProps.set(local, entry.props[imported]);
  }

  // Props on the components imported above, where their values are written out.
  for (const [local, props] of localProps) {
    for (const match of source.matchAll(new RegExp(`<${local}(?=[\\s/>])`, "g"))) {
      const end = openingTagEnd(source, match.index);
      if (end < 0) continue;
      const tag = source.slice(match.index, end + 1);
      const line = lineOf(source, match.index);
      for (const [prop, values] of Object.entries(props)) {
        const attribute = new RegExp(`(\\s)${prop}=(?:"([^"]*)"|'([^']*)'|\\{\\s*["']([^"']*)["']\\s*\\}|(\\{[^}]*\\}))`).exec(tag);
        if (!attribute) continue;
        const value = attribute[2] ?? attribute[3] ?? attribute[4];
        const at = match.index + attribute.index + attribute[1].length;
        const length = attribute[0].length - attribute[1].length;
        if (value === undefined) {
          manual.push({ line, text: `<${local} ${prop}=${attribute[5]}>: the value is only known at runtime. Map it yourself: ${Object.entries(values).map(([from, to]) => `${from} → ${to.map(([name, next]) => `${name}="${next}"`).join(" ") || "(default)"}`).join(", ")}.` });
          continue;
        }
        const next = values[value];
        if (!next) continue;
        const text = next.map(([name, nextValue]) => `${name}="${nextValue}"`).join(" ");
        if (text === `${prop}="${value}"`) continue;
        edit(text ? at : at - attribute[1].length, at + length, text);
        changes.push({ line, text: `<${local} ${prop}="${value}"> → ${text ? `<${local} ${text}>` : `<${local}> (the default)`}` });
      }
    }
  }

  if (items.has("toast")) {
    // sonner's toast.error is toast.danger.
    for (const match of source.matchAll(/\btoast\.error\(/g)) {
      edit(match.index, match.index + "toast.error".length, "toast.danger");
      changes.push({ line: lineOf(source, match.index), text: "toast.error → toast.danger" });
    }
    // The older use-toast takes one object: toast({ title, description, variant }) is toast(title, { description }), by tone.
    for (const match of source.matchAll(/\btoast\(\s*\{/g)) {
      const open = match.index + "toast".length;
      const args = argumentsAt(source, open);
      const line = lineOf(source, match.index);
      const given = args ? literalObject(args.text.trim().replace(/^\{|\}$/g, "")) : null;
      const known = given && given.title !== undefined && Object.keys(given).every((key) => ["title", "description", "variant"].includes(key));
      if (!known) {
        manual.push({ line, text: 'toast({ … }): Mlola takes the message first. Write toast(title, { description }), and toast.danger(…) for variant: "destructive".' });
        continue;
      }
      const call = `toast${given.variant === "destructive" ? ".danger" : ""}(${JSON.stringify(given.title)}${given.description !== undefined ? `, { description: ${JSON.stringify(given.description)} }` : ""})`;
      edit(match.index, args.end + 1, call);
      changes.push({ line, text: `toast({ title… }) → ${call.length > 60 ? `${call.slice(0, 57)}…` : call}` });
    }
  }

  for (const { start, end, text } of edits.sort((a, b) => b.start - a.start)) output = output.slice(0, start) + text + output.slice(end);
  return { output, changes: changes.sort((a, b) => a.line - b.line), manual: manual.sort((a, b) => a.line - b.line), items: [...items], needsIcons };
}

/** The project's own source files under the targets, leaving out the shadcn/ui components being replaced. */
function sourceFiles(cwd, targets, alias) {
  const uiDirectory = alias.replace(/^[@~]\//, "").replace(/^\.\//, "");
  const roots = [uiDirectory, `src/${uiDirectory}`];
  return listFiles(cwd, targets).filter((file) => {
    const normalized = file.split(path.sep).join("/");
    return SOURCE.has(path.extname(file)) && !roots.some((root) => normalized.startsWith(`${root}/`)) && !/\.d\.ts$/.test(file);
  });
}

/** Reads (and with `write`, rewrites) every source file, and returns what it found. */
export function migrateProject(cwd, { targets = ["."], write = false } = {}) {
  const alias = uiAlias(cwd);
  const files = [];
  const items = new Set();
  let needsIcons = false;
  for (const file of sourceFiles(cwd, targets, alias)) {
    const absolute = path.join(cwd, file);
    const source = fs.readFileSync(absolute, "utf8");
    if (!/components\/ui\/|lucide-react|["']sonner["']/.test(source)) continue;
    const result = migrateSource(source, { alias });
    if (!result.changes.length && !result.manual.length && !result.items.length) continue;
    result.items.forEach((item) => items.add(item));
    needsIcons ||= result.needsIcons;
    if (write && result.output !== source) fs.writeFileSync(absolute, result.output);
    files.push({ file, changes: result.changes, manual: result.manual });
  }
  return { alias, files, items: [...items].sort(), needsIcons, written: write };
}

export function printMigration(result, output = console) {
  const changes = result.files.reduce((sum, file) => sum + file.changes.length, 0);
  const manual = result.files.reduce((sum, file) => sum + file.manual.length, 0);
  if (!result.files.length) {
    output.log("Nothing to migrate: no file imports shadcn/ui components, sonner or lucide-react.");
    return;
  }
  for (const file of result.files) {
    if (!file.changes.length) continue;
    output.log(file.file);
    for (const change of file.changes) output.log(`  ${String(change.line).padStart(4)}  ${change.text}`);
  }
  if (manual) {
    output.log(`\nTo do by hand (${manual}):`);
    for (const file of result.files) for (const entry of file.manual) output.log(`  ${file.file}:${entry.line}  ${entry.text}`);
  }
  output.log("");
  if (result.written) output.log(`✓ Made ${changes} ${changes === 1 ? "change" : "changes"} in ${result.files.filter((file) => file.changes.length).length} files.`);
  else if (changes) output.log(`${changes} ${changes === 1 ? "change" : "changes"} to make. Nothing was written: run again with --write to make them.`);
  if (result.items.length) {
    output.log(`${result.written ? "Next" : "Then"}, put Mlola's components where shadcn/ui's are (the same files):`);
    output.log(`  npx mlola-ui add ${result.items.join(" ")} --overwrite`);
  }
  if (result.needsIcons) output.log("  npm install @mlola-ui/icons");
  output.log(`And check what you have: npx mlola-ui check. The guide: ${GUIDE}`);
}
