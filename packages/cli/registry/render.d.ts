/** Types for Mlola Render's check (check.js). See docs/render.md. */

export type RenderPropKind = "text" | "boolean" | "number" | "integer" | "date" | "enum" | "children" | "action" | "options" | "columns" | "rows";

export interface RenderProp {
  kind: RenderPropKind;
  required?: boolean;
  description?: string;
  values?: string[];
  excluded?: string[];
  default?: string | number | boolean;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  literal?: boolean;
  align?: { values: string[] };
}

export interface RenderComponent {
  group: string;
  description: string;
  accepts?: string[];
  parents?: string[];
  mlola: { item?: string; export?: string; class?: string; element?: string };
  props: Record<string, RenderProp>;
}

export interface RenderExample {
  name: string;
  title: string;
  description: string;
  messages: unknown[];
}

/** render-rules.json: mlola-ui/render/rules, or @mlola-ui/registry/render/rules. */
export interface RenderRules {
  version: string;
  catalogId: string;
  title: string;
  description: string;
  protocolVersions: string[];
  themes: string[];
  defaultTheme: string;
  modes: string[];
  /** Each group's title, in the order the guide and the docs list them. */
  groups: Record<string, string>;
  limits: Record<
    "messages" | "surfaces" | "components" | "depth" | "idLength" | "textLength" | "labelLength" | "options" | "columns" | "rows" | "contextKeys" | "pathLength" | "dataBytes" | "inputBytes",
    number
  >;
  components: Record<string, RenderComponent>;
  aliases: Record<string, string>;
  /** What agents reach for from A2UI's basic catalog, and what to use instead: by component, and by prop, Component.prop or Component.prop=value. */
  borrowed: { components: Record<string, string>; props: Record<string, string> };
  examples: RenderExample[];
}

/** A2UI's error shape: an agent reads `path` (a JSON Pointer into the input) and `message`, and corrects the call. */
export interface RenderIssue {
  code: "VALIDATION_FAILED" | "ADVICE";
  surfaceId: string;
  path: string;
  message: string;
}

export interface RenderSurface {
  surfaceId: string;
  deleted: boolean;
  theme: { name: string; mode: string };
  components: number;
}

export interface RenderResult {
  /** True when nothing stops the messages rendering. */
  valid: boolean;
  /** What stops them rendering. */
  errors: RenderIssue[];
  /** Advice that does not: a component outside the tree, two primary buttons, two fields with one label. */
  advice: RenderIssue[];
  surfaces: RenderSurface[];
}

export interface RenderState {
  rules: RenderRules;
}

/** Checks A2UI messages (an object, an array, or their JSON or JSON Lines text) against the Mlola catalog. */
export function validateRender(input: unknown, rules: RenderRules): RenderResult;

/** Reads one message, an array of messages, or JSON Lines. */
export function parseRenderInput(source: unknown, limits?: RenderRules["limits"]): { messages: unknown; error: string | null };

/** For a stream: keep one state, apply each message as it arrives, then check the surfaces before drawing. */
export function createRenderState(rules: RenderRules): RenderState;
export function applyRenderMessages(state: RenderState, input: unknown): { errors: RenderIssue[]; advice: RenderIssue[] };
export function checkSurfaces(state: RenderState, issues?: { errors: RenderIssue[]; advice: RenderIssue[] }): { errors: RenderIssue[]; advice: RenderIssue[] };

/** One surface, checked whole: how it was created, every component it holds now and their tree. */
export function checkSurface(state: RenderState, surfaceId: string): { errors: RenderIssue[]; advice: RenderIssue[] };

/** The catalog as Markdown an agent reads before composing a surface. */
export function renderCatalogGuide(rules: RenderRules): string;

/** A result as lines for a terminal or a tool reply. */
export function formatRenderReport(result: RenderResult): string;
