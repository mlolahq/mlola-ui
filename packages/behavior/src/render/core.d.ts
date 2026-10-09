/** Types for Mlola Render's core (core.js): the host both renderers draw from. See docs/render.md. */

import type { RenderComponent, RenderIssue, RenderRules } from "./check.js";

export * from "./check.js";

/** A data binding as written in a component: {"path": "/form/email"}, or "name" inside a template. */
export interface RenderBinding {
  path: string;
}

/** A2UI's action, sent to the agent when a Button is pressed. */
export interface RenderActionMessage {
  version: string;
  action: {
    name: string;
    surfaceId: string;
    sourceComponentId: string;
    /** ISO 8601. */
    timestamp: string;
    /** The Button's context, each binding replaced by its value when it was pressed. */
    context: Record<string, unknown>;
  };
}

/** A2UI's error, sent to the agent for a message that was refused. `path` is inside that message. */
export interface RenderErrorMessage {
  version: string;
  error: { code: RenderIssue["code"]; surfaceId: string; path: string; message: string };
}

/** A component as it is drawn. `props` is what the agent sent, bindings unresolved: read them with `host.read`. */
export interface RenderNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
  definition: RenderComponent | null;
}

/** One drawing of a component: a template's component has one for each item, each with its own scope. */
export interface RenderInstance {
  id: string;
  /** Where relative paths start: "" outside a template, "/items/0" inside one. */
  scope: string;
  /** Unique among siblings and stable while the item keeps its place. */
  key: string;
}

/** A required field that kept an action back. */
export interface RenderMissingField extends RenderInstance {
  /** Where its value lives in the data model. */
  path: string;
  label: unknown;
}

export interface RenderHostOptions {
  /** A Button was pressed. `extra.dataModel` is the surface's data model when it was created with sendDataModel. */
  onAction?: (message: RenderActionMessage, extra: { dataModel?: unknown }) => void;
  /** Messages were refused: send these to the agent so it can correct itself. */
  onError?: (messages: RenderErrorMessage[]) => void;
  /** The version stamped on what the host sends. The newest the catalog reads when left out. */
  version?: string;
  /** The clock, for tests. */
  now?: () => Date;
}

export interface RenderHost {
  rules: RenderRules;
  /**
   * Takes A2UI messages: one, an array, or their JSON or JSON Lines text.
   * With `streaming`, whole-surface checks and drawing wait for a call
   * without it, so a tree that arrives in pieces is not drawn half-built.
   */
  receive(input: unknown, options?: { streaming?: boolean }): { errors: RenderIssue[]; advice: RenderIssue[] };
  /** The surfaces that can be drawn, oldest first. */
  surfaces(): string[];
  /** What to draw for a surface, or null while nothing of it has passed the check. */
  surface(surfaceId: string): { id: string; theme: { name: string; mode: string } } | null;
  component(surfaceId: string, componentId: string): RenderNode | null;
  /** A container's children by id, or its template once for each item of its list. */
  children(surfaceId: string, componentId: string, scope?: string): RenderInstance[];
  /** A prop's value: the literal, or what its binding holds now. */
  read(surfaceId: string, value: unknown, scope?: string): unknown;
  /** Writes what a person entered where the field is bound. False for a literal. */
  write(surfaceId: string, binding: unknown, value: unknown, scope?: string): boolean;
  /** A Button was pressed: sends its action, or returns the required fields still to fill in. */
  press(surfaceId: string, componentId: string, scope?: string): { sent: RenderActionMessage | null; missing: RenderMissingField[] };
  /** True while a required field kept an action back and has not been filled in since. */
  missing(surfaceId: string, componentId: string, scope?: string): boolean;
  /** Changes when the surface's components were replaced; data changes leave it. */
  structure(surfaceId: string): number;
  /** The heading level for a titled component (EmptyState, Accordion). */
  headingLevel(surfaceId: string, componentId: string): 2 | 3 | 4 | 5 | 6;
  /** Replaces what the host answers to: onAction and onError, as they are now. */
  configure(options: Pick<RenderHostOptions, "onAction" | "onError">): void;
  /** Forgets every surface, for a new conversation in the same place. */
  reset(): void;
  dataModel(surfaceId: string): unknown;
  subscribe(listener: () => void): () => void;
  /** Grows with every change. */
  revision(): number;
}

export function createRenderHost(rules: RenderRules, options?: RenderHostOptions): RenderHost;
/** A path as written in a component, from the top of the data model. */
export function absolutePath(path: string, scope?: string): string;
/** A check's error as the A2UI message a renderer sends the agent. */
export function toErrorMessage(issue: RenderIssue, version?: string): RenderErrorMessage;
export function isBinding(value: unknown): value is RenderBinding;
