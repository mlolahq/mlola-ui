/** Types for Mlola Render with your own model (ai.js). See docs/render.md. */
import type { RenderResult, RenderRules } from "./render.js";

export interface RenderPromptOptions {
  /** "lines" (the default): every answer is a surface, as A2UI messages one to a line. "tool": the model answers in words and calls a tool when a surface helps. */
  output?: "lines" | "tool";
  /** "surface" (the default): the model may name one of the catalog's themes. "page": it sets none, and the surface takes the theme of the page it is shown on. */
  theme?: "surface" | "page";
  /** The tool's name when `output` is "tool"; "render_ui" when left out. Give `renderTool` the same one. */
  tool?: string;
}

/** What to tell the model, as its system prompt: how to answer, then the catalog's guide. */
export function renderSystemPrompt(rules: RenderRules, options?: RenderPromptOptions): string;

/** A tool in the shape every provider's tool calling is built from. */
export interface RenderTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: { messages: { type: "string"; description: string } };
    required: ["messages"];
  };
}

/** The tool a model calls to show a surface. Its messages travel as one string: read them with `checkRenderReply`. */
export function renderTool(options?: { name?: string }): RenderTool;

/** The messages read from a reply, or the error that stopped the read (and then no messages). */
export interface RenderReply {
  messages: unknown[];
  error: string | null;
}

export interface RenderReader {
  /** Takes the next piece of the model's text and answers with the messages it completed. */
  push(chunk: string): unknown[];
  /** Every message of the reply, or what was wrong with it: a piece that is not JSON, a message cut off, too much text, or no message at all. */
  end(): RenderReply;
}

/** Reads A2UI messages out of a model's text as it arrives: JSON Lines, an array, one object, a code fence around them, or {"messages": […]}. */
export function createRenderReader(rules: RenderRules): RenderReader;

/** Reads a whole reply: the model's text, a tool call's arguments, or messages already parsed. */
export function readRenderReply(reply: unknown, rules: RenderRules): RenderReply;

export interface CheckedReply {
  /** True when the reply may be drawn. */
  valid: boolean;
  /** The messages to draw; empty unless `valid`. */
  messages: unknown[];
  /** The check's result. A reply that could not be read, or that shows nothing, is one error at the path "". */
  result: RenderResult;
  /** What to tell the model when the reply was refused: the next user message, or the tool's answer. Null when `valid`. */
  repair: string | null;
}

/** Reads a reply and checks it against the catalog. */
export function checkRenderReply(reply: unknown, rules: RenderRules): CheckedReply;

/** What to tell the model about a reply the check refused. */
export function renderRepairPrompt(result: RenderResult): string;

export interface RenderTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ComposeRenderOptions {
  /** The catalog: mlola-ui/render/rules. */
  rules: RenderRules;
  /** Calls your model with this system prompt and these turns, and answers with its text. */
  generate: (call: { system: string; messages: RenderTurn[]; attempt: number }) => string | Promise<string>;
  /** What the person asked for, or the conversation so far, ending with the person's turn. */
  request: string | RenderTurn[];
  /** Your own system prompt, with `renderSystemPrompt(rules)` in it. Left out, that prompt alone. */
  system?: string;
  /** Passed to `renderSystemPrompt` when `system` is left out. */
  theme?: "surface" | "page";
  /** How many times the model is asked, from 1 to 10. 3 when left out. */
  attempts?: number;
}

export interface ComposedRender extends CheckedReply {
  /** How many times the model was asked. */
  attempts: number;
  /** The conversation with the model's replies and the corrections in it, to continue from. */
  turns: RenderTurn[];
}

/** Asks your model for a surface until one passes the check, or the attempts run out. */
export function composeRender(options: ComposeRenderOptions): Promise<ComposedRender>;
