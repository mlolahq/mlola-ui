/** Types for @mlola-ui/behavior/render: Mlola Render without a framework. See docs/render.md. */

import type { RenderHost, RenderHostOptions, RenderRules } from "./core.js";

export { createRenderHost, isBinding } from "./core.js";

export interface MountRenderOptions extends RenderHostOptions {
  /** The catalog: @mlola-ui/behavior/render/rules. Not needed with `host`. */
  rules?: RenderRules;
  /** Draw from a host you keep in place of making one. */
  host?: RenderHost;
  /** "surface" draws in the theme the agent named; "inherit" keeps the page's. */
  theme?: "surface" | "inherit";
  /** What a surface's "system" mode means here, when the host knows better than the reader's setting. */
  systemMode?: "light" | "dark";
  /** Draw only this surface. Every surface, oldest first, when left out. */
  surfaceId?: string;
  /** The words the surface itself says. */
  labels?: Partial<{ required: string; missing: (fields: string[]) => string; yes: string; no: string }>;
}

export interface MountedRender {
  host: RenderHost;
  /** Takes A2UI messages; `{ streaming: true }` while more are on their way. */
  receive: RenderHost["receive"];
  /** Changes what "system" means for the surfaces already drawn and those to come. */
  setSystemMode(mode: "light" | "dark" | null): void;
  /** Removes what was drawn and stops listening. */
  destroy(): void;
}

/** Draws Mlola Render surfaces into `element` as Mlola markup, with the runtime's behaviors attached. */
export function mountRender(element: Element, options: MountRenderOptions): MountedRender;
