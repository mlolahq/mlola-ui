/** A project theme: a theme spec plus `inherit`, `scale` and `extend`. See https://ui.mlola.com/docs/theming#custom. */
export type ThemeInput = Record<string, unknown>;

export interface ProjectTheme extends Record<string, unknown> {
  /** The theme's id: its `data-theme` value. */
  id: string;
  label: string;
  /** The canonical theme whose decisions fill what the file leaves out. */
  inherit: string;
}

export const THEME_CHANNELS: readonly string[];
/** The spec with every default filled in. */
export function defineTheme(input?: ThemeInput): ProjectTheme;
/** The theme's CSS, on the same `data-theme` contract as every canonical theme. */
export function renderThemeCss(input: ThemeInput): string;
export function renderThemeManifest(projectThemeInput?: ThemeInput | null): Array<Record<string, unknown>>;
