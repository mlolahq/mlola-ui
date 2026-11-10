import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { inspectLayout, measureContrast, openEachLayer } from "./audit-page.js";
import { themes as knownThemes } from "./knowledge.js";

/**
 * `mlola-ui audit <url>`: the check for what only shows once a page is
 * drawn. `check` reads source; this opens the page in a browser, on a
 * desktop and a phone, light and dark, and reports what a careful reviewer
 * catches by eye: text cut off, a control over someone else's text, fields
 * that do not line up, sideways scroll, a menu past the window's edge, text
 * below the contrast floor, an error the page threw.
 *
 * A coding agent cannot see what it built. This is how it looks.
 *
 * The browser is the project's own Playwright: the CLI has no dependency,
 * and a browser is not something to install behind someone's back.
 */

const VIEWS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "phone", width: 390, height: 844, touch: true },
];
const MODES = ["light", "dark"];

const NO_BROWSER = "audit opens the page in a browser, and this project has none to open it with. Add one:\n  npm install -D playwright\n  npx playwright install chromium";

/** Chromium from the project's Playwright, or from one installed beside this CLI. */
async function findChromium(cwd) {
  const require = createRequire(path.join(cwd, "package.json"));
  for (const name of ["playwright", "playwright-core", "@playwright/test"]) {
    for (const load of [() => import(pathToFileURL(require.resolve(name)).href), () => import(name)]) {
      try {
        const module = await load();
        const chromium = module.chromium ?? module.default?.chromium;
        if (chromium) return chromium;
      } catch {
        // Not installed here: try the next place.
      }
    }
  }
  throw new Error(NO_BROWSER);
}

/** The address to open: a web address as given, a file as a file address. */
export function auditTarget(cwd, target) {
  if (!target) throw new Error("Name the page to open: mlola-ui audit http://localhost:3000/settings, or a file: mlola-ui audit page.html");
  if (/^https?:\/\//i.test(target) || /^file:\/\//i.test(target)) return target;
  // "localhost:3000/settings" is how people say it.
  if (/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?(\/|$)/.test(target)) return `http://${target}`;
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) && !/^[a-z]:[\\/]/i.test(target)) throw new Error(`audit opens http, https and file addresses; "${target}" is none of them.`);
  const file = path.resolve(cwd, target);
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return pathToFileURL(file).href;
  throw new Error(`${target} is not a file here, and not an address. Give the whole address, like http://localhost:3000/settings.`);
}

/** The themes to draw the page in: none (the page's own), every one, or the ones named. */
export function auditThemes(option) {
  if (!option) return [null];
  const all = knownThemes().map((theme) => theme.id);
  if (option === "all") return all;
  const named = option.split(",").map((entry) => entry.trim()).filter(Boolean);
  const unknown = named.filter((id) => !all.includes(id) && !/^th-[0-9a-z]{12}$/.test(id));
  if (unknown.length) throw new Error(`${unknown.join(", ")} ${unknown.length === 1 ? "is not a theme" : "are not themes"}. Themes: ${all.join(", ")}, or all.`);
  return named;
}

const contrastDetail = (failure) => `${failure.where} "${failure.text}" is ${failure.ratio}:1 and needs ${failure.need}:1 (${failure.fg} on ${failure.bg})`;

/**
 * Opens the page in each view and returns what was found. `launch` is the
 * browser to use (a test passes its own); `shots` a folder for one
 * screenshot per view; `interact` also opens each menu, dialog and tab, and
 * is off unless asked for, since pressing a real app's buttons does things.
 */
export async function auditPage(cwd, target, { themes = [null], modes = MODES, interact = false, shots = null, launch } = {}) {
  const url = auditTarget(cwd, target);
  const start = launch ?? (async () => (await findChromium(cwd)).launch());
  let browser;
  try {
    browser = await start();
  } catch (error) {
    if (/Executable doesn't exist|playwright install/i.test(error.message)) throw new Error("Playwright is installed, its browser is not. Run: npx playwright install chromium");
    throw error;
  }
  const findings = [];
  const views = [];
  let mlola = false;
  try {
    for (const theme of themes) {
      for (const view of VIEWS) {
        for (const mode of modes) {
          const label = `${theme ? `${theme}/` : ""}${view.name}/${mode}`;
          views.push(label);
          const add = (kind, detail) => findings.push({ kind, detail, view: label });
          const context = await browser.newContext({ viewport: { width: view.width, height: view.height }, colorScheme: mode, reducedMotion: "reduce", hasTouch: Boolean(view.touch) });
          const page = await context.newPage();
          page.on("pageerror", (error) => add("error", `the page threw: ${String(error.message).split("\n")[0].slice(0, 200)}`));
          try {
            await page.goto(url, { waitUntil: "load", timeout: 45_000 });
            await page.evaluate(() => document.fonts.ready);
            // The page's own switch decides how it stores the mode; the attribute is what the engine reads.
            const themed = await page.evaluate(
              ({ mode: wanted, theme: id }) => {
                const root = document.documentElement;
                const has = root.hasAttribute("data-theme") || root.hasAttribute("data-mode");
                if (has) root.setAttribute("data-mode", wanted);
                if (id) root.setAttribute("data-theme", id);
                return has;
              },
              { mode, theme },
            );
            mlola ||= themed;
            await page.waitForTimeout(350);
            for (const finding of await page.evaluate(inspectLayout)) add(finding.kind, finding.detail);
            for (const failure of await page.evaluate(measureContrast)) add("contrast", contrastDetail(failure));
            if (shots) {
              fs.mkdirSync(path.resolve(cwd, shots), { recursive: true });
              await page.screenshot({ path: path.resolve(cwd, shots, `${label.replace(/\//g, "-")}.png`), fullPage: true });
            }
            if (interact) {
              for (const { name, findings: after } of await openEachLayer(page)) {
                for (const finding of after) add(finding.kind, `${finding.detail} (after ${name})`);
              }
            }
          } catch (error) {
            add("error", `could not be opened: ${String(error.message).split("\n")[0].slice(0, 200)}`);
          } finally {
            await context.close();
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
  // One problem seen in four views is one problem, with the views it shows in.
  const problems = new Map();
  for (const { kind, detail, view } of findings) {
    const key = `${kind}\n${detail}`;
    if (!problems.has(key)) problems.set(key, { kind, detail, views: [] });
    problems.get(key).views.push(view);
  }
  return { url, views, mlola, themed: themes.some(Boolean), shots: shots ? path.resolve(cwd, shots) : null, problems: [...problems.values()] };
}

const KINDS = [
  ["error", "Errors"],
  ["sideways", "Sideways scroll"],
  ["overlap", "A control over text, or fields running into each other"],
  ["clipped", "Text cut off"],
  ["escapes", "Text running out of its card"],
  ["offscreen", "Floating content past the window's edge"],
  ["uneven", "Fields in a row that do not line up"],
  ["shrunk", "A centered column that takes its content's width"],
  ["image", "Images that did not load"],
  ["contrast", "Text below the contrast floor (WCAG 2.2 AA)"],
];

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** The report a person or an agent reads. */
export function printAudit(report, output) {
  output.log(report.url);
  for (const [kind, label] of KINDS) {
    const found = report.problems.filter((problem) => problem.kind === kind);
    if (!found.length) continue;
    output.log(`\n${label}`);
    for (const problem of found.slice(0, 25)) {
      const everywhere = problem.views.length === report.views.length;
      output.log(`  ${problem.detail}  [${everywhere ? "every view" : problem.views.slice(0, 4).join(", ") + (problem.views.length > 4 ? `, and ${problem.views.length - 4} more` : "")}]`);
    }
    if (found.length > 25) output.log(`  …and ${found.length - 25} more; --json lists every one.`);
  }
  output.log("");
  const where = `${plural(report.views.length, "view")} (${report.themed ? "each theme, " : ""}desktop and phone${report.views.some((view) => view.endsWith("/dark")) ? ", light and dark" : ""})`;
  output.log(report.problems.length ? `Opened in ${where}: ${plural(report.problems.length, "problem")}.` : `✓ Opened in ${where}: nothing a reviewer would catch by eye.`);
  if (report.themed && !report.mlola) output.log("The page sets no data-theme on <html>, so the themes asked for may not have drawn: set the theme at the root (npx mlola-ui doctor).");
  if (report.shots) output.log(`Screenshots of each view are in ${report.shots}.`);
}
