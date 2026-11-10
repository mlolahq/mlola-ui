import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { CONFIG_FILENAME } from "./config.js";
import { checkMarkup, contractFrom, fixSpacing, mlProperties } from "./knowledge.js";

/**
 * `mlola-ui check`: check_markup over a whole project. It reads every file
 * with markup or CSS, reports each issue with its file and line, and counts
 * drift: how many colors and spacing values were typed by hand instead of
 * read from the tokens. It works in any project, Mlola or not.
 */

const MARKUP = new Set([".html", ".htm", ".jsx", ".tsx", ".js", ".mjs", ".vue", ".svelte", ".astro"]);
const STYLES = new Set([".css"]);
const SKIPPED = new Set(["node_modules", ".git", ".next", ".nuxt", ".svelte-kit", ".astro", ".output", ".vercel", ".turbo", ".cache", "dist", "build", "out", "coverage", "vendor"]);
const LARGEST = 1024 * 1024;

const checkable = (file) => {
  const extension = path.extname(file).toLowerCase();
  return (MARKUP.has(extension) || STYLES.has(extension)) && !/\.min\.(js|css)$/i.test(file);
};
const inSkipped = (file) => file.split(/[\\/]/).some((part) => SKIPPED.has(part));

/** The files under each target, relative to cwd: git's list when there is one, so .gitignore holds; a walk otherwise. */
export function listFiles(cwd, targets) {
  const git = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z", "--", ...targets], { cwd, encoding: "utf8" });
  let files;
  if (!git.error && git.status === 0) {
    files = git.stdout.split("\0").filter(Boolean);
  } else {
    files = [];
    const walk = (relative) => {
      const absolute = path.join(cwd, relative);
      const stat = fs.statSync(absolute);
      if (stat.isFile()) return files.push(relative);
      for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
        if (entry.isDirectory() && (SKIPPED.has(entry.name) || entry.name.startsWith("."))) continue;
        if (entry.isDirectory() || entry.isFile()) walk(path.join(relative, entry.name));
      }
    };
    for (const target of targets) walk(target);
  }
  return [...new Set(files.map((file) => path.normalize(file)))]
    .filter((file) => checkable(file) && !inSkipped(file))
    .filter((file) => {
      const stat = fs.statSync(path.join(cwd, file), { throwIfNoEntry: false });
      return stat?.isFile() && stat.size <= LARGEST;
    })
    .sort();
}

const readJsonIn = (cwd, name) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(cwd, name), "utf8"));
  } catch {
    return null;
  }
};

/** The project's own theme ids: the one mlola.config.json names and the one mlola.theme.json builds. */
export function projectThemes(cwd) {
  const ids = [readJsonIn(cwd, CONFIG_FILENAME)?.theme, readJsonIn(cwd, "mlola.theme.json")?.id];
  return [...new Set(ids.filter((id) => typeof id === "string" && id))];
}

/** The utility framework the project uses, if any: there, utility classes do something. */
function utilityFramework(cwd) {
  const manifest = readJsonIn(cwd, "package.json") ?? {};
  const declared = { ...manifest.dependencies, ...manifest.devDependencies };
  const name = ["tailwindcss", "unocss", "windicss"].find((entry) => entry in declared);
  if (name) return name;
  const config = fs.readdirSync(cwd).find((file) => /^(tailwind|uno)\.config\.[cm]?[jt]s$/.test(file));
  return config ? (config.startsWith("uno") ? "unocss" : "tailwindcss") : null;
}

/**
 * What the CLI fills from Mlola itself, from mlola.config.json. Mlola's own
 * stylesheets are never checked: <styles>/mlola holds the engine and the built
 * theme, where the tokens are defined, and the copied stylesheets are held by
 * the library's gates, which render them in every theme (a mark dimmed with
 * opacity is not faded text). `copied` markup is checked with --all.
 */
function installedByMlola(cwd) {
  const targets = readJsonIn(cwd, CONFIG_FILENAME)?.targets;
  if (!targets) return { generated: [], copied: [] };
  const styles = typeof targets.styles === "string" && targets.styles ? targets.styles : null;
  const copied = ["components", "blocks", "pages", "templates", "lib"].map((key) => targets[key]).filter((value) => typeof value === "string" && value);
  if (styles) copied.push(path.join(styles, "mlola-pro"), path.join(styles, "mlola-pro.css"));
  return { generated: styles ? [path.normalize(path.join(styles, "mlola"))] : [], copied: copied.map((place) => path.normalize(place)) };
}

const within = (file, place) => file === place || file.startsWith(`${place}${path.sep}`);

/** Every file under a folder, relative to cwd; nothing when it is missing. */
function filesUnder(cwd, place, pattern) {
  const found = [];
  const walk = (relative) => {
    const stat = fs.statSync(path.join(cwd, relative), { throwIfNoEntry: false });
    if (!stat) return;
    if (stat.isFile()) {
      if (pattern.test(relative)) found.push(relative);
      return;
    }
    for (const entry of fs.readdirSync(path.join(cwd, relative), { withFileTypes: true })) {
      if (entry.isDirectory() && SKIPPED.has(entry.name)) continue;
      walk(path.join(relative, entry.name));
    }
  };
  walk(place);
  return found;
}

/**
 * The classes and values of the Pro items this project installed: their
 * stylesheets (a Pro component's in <styles>/mlola-pro/, a block's, page's
 * or template's beside it) and what their copied source renders. Pro's
 * classes are not published, so the check learns them here.
 */
export function projectContract(cwd) {
  const targets = readJsonIn(cwd, CONFIG_FILENAME)?.targets ?? {};
  const place = (key) => (typeof targets[key] === "string" && targets[key] ? targets[key] : null);
  const read = (file) => fs.readFileSync(path.join(cwd, file), "utf8");
  const stylesheets = [
    ...(place("styles") ? filesUnder(cwd, path.join(place("styles"), "mlola-pro"), /\.css$/) : []),
    ...["blocks", "pages", "templates"].map(place).filter(Boolean).flatMap((folder) => filesUnder(cwd, folder, /\.css$/)),
  ].map(read);
  if (!stylesheets.length) return contractFrom();
  const markups = ["components", "blocks", "pages", "templates"].map(place).filter(Boolean).flatMap((folder) => filesUnder(cwd, folder, /\.(tsx|jsx|html)$/)).map(read);
  return contractFrom({ stylesheets, markups });
}

/** Counts each value, most used first. */
function tally(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([value, count]) => ({ value, count }));
}

/**
 * Checks a project. `targets` are paths relative to cwd (the whole project
 * when empty); `all` includes the source Mlola copied in; `fix` first puts
 * spacing that is exactly a step of the scale back on the scale, in place.
 */
export function checkProject(cwd, { targets = [], all = false, fix = false } = {}) {
  for (const target of targets) {
    if (!fs.existsSync(path.join(cwd, target))) throw new Error(`${target} does not exist.`);
  }
  const installed = installedByMlola(cwd);
  const skipped = [...installed.generated, ...(all ? [] : installed.copied)];
  const ownStylesheet = (file) => STYLES.has(path.extname(file).toLowerCase()) && installed.copied.some((place) => within(file, place));
  const files = listFiles(cwd, targets.length ? targets : ["."]).filter((file) => !skipped.some((place) => within(file, place)) && !ownStylesheet(file));
  const themes = projectThemes(cwd);
  const contract = projectContract(cwd);
  const utilities = utilityFramework(cwd);
  // React props are Mlola's only where the components are: elsewhere <Button variant="ghost"> is another library's.
  const react = fs.existsSync(path.join(cwd, CONFIG_FILENAME));
  const issues = [];
  const fixed = [];
  const texts = new Map();
  for (const file of files) {
    let text = fs.readFileSync(path.join(cwd, file), "utf8");
    if (fix) {
      const result = fixSpacing(text, { stylesheet: STYLES.has(path.extname(file).toLowerCase()) });
      if (result.fixed) {
        fs.writeFileSync(path.join(cwd, file), result.text);
        fixed.push({ file: file.split(path.sep).join("/"), count: result.fixed });
        text = result.text;
      }
    }
    texts.set(file, text);
    // A property one file defines (--ml-brand-glow in the project's stylesheet) is one any file may read.
    for (const property of mlProperties(text)) if (property.set) contract.properties.add(property.name);
  }
  for (const file of files) {
    const text = texts.get(file);
    // A stylesheet is checked as a page's <style> block; its lines stay where they are.
    const markup = STYLES.has(path.extname(file).toLowerCase()) ? `<style>${text}</style>` : text;
    for (const issue of checkMarkup(markup, { themes, contract, react })) {
      // Where a utility framework reads them, utility classes are not dead; the values typed into them still count.
      if (utilities && issue.rule === "utility-class") continue;
      issues.push({ file: file.split(path.sep).join("/"), ...issue });
    }
  }
  // Files in order, and within a file, lines in order.
  issues.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));
  const errors = issues.filter((issue) => issue.severity === "error").length;
  return {
    files: files.length,
    utilities,
    skipped: skipped.filter((place) => fs.existsSync(path.join(cwd, place))).map((place) => place.split(path.sep).join("/")),
    all,
    errors,
    warnings: issues.length - errors,
    ...(fix ? { fixed } : {}),
    issues,
    drift: {
      colors: tally(issues.filter((issue) => issue.rule === "color").flatMap((issue) => issue.values ?? [])),
      spacing: tally(issues.filter((issue) => issue.rule === "spacing").flatMap((issue) => issue.values ?? [])),
      type: tally(issues.filter((issue) => issue.rule === "type").flatMap((issue) => issue.values ?? [])),
      radius: tally(issues.filter((issue) => issue.rule === "radius").flatMap((issue) => issue.values ?? [])),
    },
  };
}

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
const listed = (entries) => entries.slice(0, 6).map((entry) => (entry.count > 1 ? `${entry.value} ×${entry.count}` : entry.value)).join(", ") + (entries.length > 6 ? `, and ${entries.length - 6} more` : "");
// GitHub reads ::error lines as annotations on the pull request; these characters would end one early.
const escape = (text) => String(text).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
const escapeProperty = (text) => escape(text).replace(/:/g, "%3A").replace(/,/g, "%2C");

/** Up to this many issues are listed one by one; past it, the report names the files with the most. */
const LISTED = 60;
const ANNOTATED = 50;
const KINDS = [
  [["color"], "colors typed by hand"],
  [["spacing"], "spacing typed by hand"],
  [["type", "radius", "shadow", "duration", "layer"], "type sizes, radii, shadows, durations and layers typed by hand"],
  [["unknown-class", "variant-class"], "classes Mlola does not have"],
  [["unknown-token"], "tokens Mlola does not have"],
  [["value", "no-effect"], "values an element or a component does not take"],
  [["element"], "controls written on elements that cannot be operated"],
  [["name", "heading"], "controls, fields and images with no name, headings that skip a level"],
  [["theme", "mode"], "theme and mode attributes"],
  [["theme-token"], "theme tokens overridden"],
  [["opacity"], "text faded with opacity"],
  [["utility-class"], "utility classes"],
];

/** The report a person reads, and on GitHub Actions the annotations a pull request shows. */
export function printReport(report, output, { github = false } = {}) {
  const byFile = new Map();
  for (const issue of report.issues) {
    if (!byFile.has(issue.file)) byFile.set(issue.file, []);
    byFile.get(issue.file).push(issue);
  }
  if (report.issues.length <= LISTED) {
    for (const [file, issues] of byFile) {
      output.log(file);
      for (const issue of issues) {
        output.log(`  ${String(issue.line).padStart(4)}  ${issue.severity.padEnd(7)}  ${issue.message}`);
        if (issue.fix) output.log(`${" ".repeat(17)}${issue.fix}`);
      }
      output.log("");
    }
  } else {
    output.log("By kind:");
    for (const [rules, label] of KINDS) {
      const count = report.issues.filter((issue) => rules.includes(issue.rule)).length;
      if (count) output.log(`  ${String(count).padStart(6)}  ${label}`);
    }
    output.log("");
    output.log("Most issues:");
    for (const [file, issues] of [...byFile].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])).slice(0, 12)) {
      output.log(`  ${String(issues.length).padStart(6)}  ${file}`);
    }
    output.log("");
    output.log("Every issue with its line and fix: add --json, or check one folder at a time (npx mlola-ui check src/components).");
    output.log("");
  }
  if (github) {
    for (const issue of report.issues.slice(0, ANNOTATED)) {
      output.log(`::${issue.severity === "error" ? "error" : "warning"} file=${escapeProperty(issue.file)},line=${issue.line},title=${escapeProperty(`Mlola: ${issue.rule}`)}::${escape(issue.fix ? `${issue.message} ${issue.fix}` : issue.message)}`);
    }
    if (report.issues.length > ANNOTATED) output.log(`Annotated the first ${ANNOTATED} of ${report.issues.length} issues; --json lists every one.`);
  }
  if (report.fixed?.length) {
    const total = report.fixed.reduce((sum, entry) => sum + entry.count, 0);
    output.log(`✓ Put ${plural(total, "length")} back on the spacing scale in ${plural(report.fixed.length, "file")}: ${report.fixed.slice(0, 8).map((entry) => entry.file).join(", ")}${report.fixed.length > 8 ? ", and more" : ""}.`);
  } else if (report.fixed) {
    output.log("• Nothing to fix: no spacing typed by hand is exactly a step of the scale.");
  }
  if (!report.issues.length) {
    output.log(`✓ Checked ${plural(report.files, "file")}: no issues.`);
  } else {
    output.log(`Checked ${plural(report.files, "file")}: ${plural(report.errors, "error")} and ${plural(report.warnings, "warning")} in ${plural(byFile.size, "file")}.`);
  }
  const { colors, spacing, type = [], radius = [] } = report.drift;
  if (colors.length || spacing.length || type.length || radius.length) {
    output.log("Drift, typed by hand instead of read from the tokens:");
    if (colors.length) output.log(`  ${plural(colors.length, "color")}: ${listed(colors)}`);
    if (spacing.length) output.log(`  ${plural(spacing.length, "spacing value")}: ${listed(spacing)}`);
    if (type.length) output.log(`  ${plural(type.length, "type size")}: ${listed(type)}`);
    if (radius.length) output.log(`  ${radius.length === 1 ? "1 radius" : `${radius.length} radii`}: ${listed(radius)}`);
    // Only said when it would do something: a length between the steps is a person's call.
    if (!report.fixed && spacing.some((entry) => fixSpacing(`<p style="gap: ${entry.value}">`).fixed)) output.log("  --fix puts the lengths that are exactly a step of the scale back on it.");
  }
  if (report.utilities) output.log(`Utility classes are left alone: this project uses ${report.utilities}. Values typed into them (bg-[#fafafa], p-[13px]) still count.`);
  if (report.skipped.length) {
    output.log(
      report.all
        ? `Left out Mlola's own stylesheets (${report.skipped.join(", ")}, and the ones copied beside its source): the library's gates render them in every theme.`
        : `Left out what Mlola installed (${report.skipped.join(", ")}); --all checks the copied source too.`,
    );
  }
}

/**
 * `mlola-ui check --hook`: the check as a coding agent's hook. It reads the
 * event an agent writes after it edits a file (Claude Code's PostToolUse:
 * JSON with tool_input.file_path), checks that one file, and when something
 * is wrong says so where the agent reads it and answers 2, which hands the
 * report back to the agent to fix. Anything it cannot read is not its
 * business: it answers 0 and stays quiet.
 */
export function checkHook(cwd, input, output) {
  let file;
  try {
    const event = JSON.parse(input);
    file = event?.tool_input?.file_path ?? event?.tool_input?.path ?? event?.file_path;
  } catch {
    return 0;
  }
  if (typeof file !== "string" || !file) return 0;
  const relative = path.relative(cwd, path.resolve(cwd, file));
  if (relative.startsWith("..") || path.isAbsolute(relative) || !checkable(relative) || inSkipped(relative) || !fs.existsSync(path.join(cwd, relative))) return 0;
  let report;
  try {
    report = checkProject(cwd, { targets: [relative] });
  } catch {
    return 0;
  }
  if (!report.issues.length) return 0;
  const shown = report.issues.slice(0, HOOKED);
  output.error(`Mlola check: ${plural(report.errors, "error")} and ${plural(report.warnings, "warning")} in ${relative.split(path.sep).join("/")}. Fix them before you finish:`);
  for (const issue of shown) output.error(`  line ${issue.line}, ${issue.severity}: ${issue.message}${issue.fix ? ` ${issue.fix}` : ""}`);
  if (report.issues.length > shown.length) output.error(`  …and ${report.issues.length - shown.length} more: npx mlola-ui check ${relative.split(path.sep).join("/")}`);
  return 2;
}

/** How many issues a hook hands back at once: enough to act on, short enough to read. */
const HOOKED = 12;
