import { DEFAULT_THEME, profiles } from "./config.mjs";
import { resolveFonts } from "./spec.mjs";

/**
 * The web fonts the canonical themes read, each through a variable the
 * project sets (`var(--font-inter, "Inter")`). Read out of the font sets, so
 * a theme that gains a family adds it here, to the agents' guide, the docs'
 * layout and the doctor's check at once.
 *
 * `binding` is the family's name in `next/font/google` and `name` the
 * constant a layout gives it. An agent that copied a layout naming one font
 * left the other themes on the system's fonts; listing every family keeps
 * the switch to any theme whole.
 */
export function themeFonts() {
  const found = new Map();
  for (const [id, profile] of Object.entries(profiles)) {
    for (const stack of Object.values(resolveFonts(profile.spec.fonts))) {
      for (const [, variable, family] of stack.matchAll(/var\((--font-[\w-]+),\s*"([^"]+)"\)/g)) {
        const font = found.get(variable) ?? {
          variable,
          family,
          binding: family.replace(/\s+/g, "_"),
          name: variable.replace(/^--font-/, "").replace(/-(\w)/g, (_, letter) => letter.toUpperCase()),
          themes: [],
        };
        if (!font.themes.includes(id)) font.themes.push(id);
        found.set(variable, font);
      }
    }
  }
  return [...found.values()].sort((a, b) => a.variable.localeCompare(b.variable));
}

/** A Next.js root layout that sets the theme on `<html>`, imports the stylesheet and loads every theme's fonts. */
export function nextLayoutExample({ stylesheet = "@/styles/mlola/index.css", theme = DEFAULT_THEME } = {}) {
  const fonts = themeFonts();
  const bindings = fonts.map((font) => font.binding).sort();
  return `import { ${bindings.join(", ")} } from "next/font/google";
import "${stylesheet}";

// Every theme's type reads these variables; a font left out falls back to the system's.
${fonts.map((font) => `const ${font.name} = ${font.binding}({ subsets: ["latin"], variable: "${font.variable}" });`).join("\n")}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="${theme}" data-mode="system" className={\`${fonts.map((font) => `\${${font.name}.variable}`).join(" ")}\`}>
      <body>{children}</body>
    </html>
  );
}`;
}
