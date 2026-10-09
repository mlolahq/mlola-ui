/**
 * Mlola Render as an MCP App: the view a chat host shows for the render_ui
 * tool (packages/cli/src/mcp.js). It speaks the MCP Apps protocol
 * (io.modelcontextprotocol/ui, 2026-01-26) with its host over postMessage:
 *
 * - it receives the tool's arguments (the agent's A2UI messages) and draws
 *   them with the framework-free renderer, as they stream in and once whole;
 * - it follows the host's light or dark theme;
 * - a pressed Button becomes a message in the conversation that carries
 *   A2UI's action, so the agent reads what the person chose and entered;
 * - it tells the host its height, so the frame fits what it shows.
 *
 * scripts/build-render-app.mjs bundles it with the stylesheet into one HTML
 * file, the ui://mlola/render resource. Nothing is fetched: the frame's
 * default content security policy allows no connection, and needs none.
 */

import { mountRender } from "./dom.js";
import rules from "./rules.js";

const PROTOCOL = "2026-01-26";
const html = document.documentElement;
const status = document.querySelector("#status");
const pending = new Map();
let next = 0;

const send = (message) => window.parent.postMessage({ jsonrpc: "2.0", ...message }, "*");
const notify = (method, params = {}) => send({ method, params });
const request = (method, params = {}) =>
  new Promise((resolve, reject) => {
    next += 1;
    pending.set(next, { resolve, reject });
    send({ id: next, method, params });
  });
const say = (words) => {
  status.textContent = words;
  status.hidden = !words;
};

function applyTheme(context) {
  const mode = context?.theme === "dark" ? "dark" : context?.theme === "light" ? "light" : null;
  if (!mode) return;
  html.dataset.mode = mode;
  view.setSystemMode(mode);
}

const view = mountRender(document.querySelector("#surfaces"), {
  rules,
  onAction: (message) => {
    const { surfaceId, sourceComponentId } = message.action;
    const pressed = view.host.read(surfaceId, view.host.component(surfaceId, sourceComponentId)?.props.text);
    // The person's choice reaches the agent as their next message, with the action as A2UI describes it.
    const text = `I pressed "${pressed}" in the ${surfaceId} surface. The A2UI action:\n\n${JSON.stringify(message, null, 2)}`;
    request("ui/message", { role: "user", content: [{ type: "text", text }] }).catch(() => say("The host did not take the message. Try again."));
  },
});

/** Draws the messages the tool was called with: again from the start each time, as more of them arrive. */
function draw(argumentsGiven, streaming) {
  const messages = argumentsGiven?.messages;
  view.host.reset();
  if (messages === undefined) return;
  const issues = view.receive(messages, { streaming });
  if (!streaming) say(issues.errors.length && !view.host.surfaces().length ? "The agent's interface had errors, so it is not shown. The agent has been told what to fix." : "");
}

window.addEventListener("message", (event) => {
  if (event.source !== window.parent) return;
  const message = event.data;
  if (!message || message.jsonrpc !== "2.0") return;
  if (message.id !== undefined && pending.has(message.id) && ("result" in message || "error" in message)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if ("error" in message) reject(message.error);
    else resolve(message.result);
    return;
  }
  switch (message.method) {
    case "ui/notifications/tool-input-partial":
      draw(message.params?.arguments, true);
      break;
    case "ui/notifications/tool-input":
      draw(message.params?.arguments, false);
      break;
    // audit-allow: content — the protocol's own method name, spelled as MCP Apps spells it
    case "ui/notifications/tool-cancelled":
      if (!view.host.surfaces().length) say("The agent stopped before the interface was ready.");
      break;
    case "ui/notifications/host-context-changed":
      applyTheme(message.params);
      break;
    case "ui/resource-teardown":
    case "ping":
      send({ id: message.id, result: {} });
      break;
    default:
      if (message.id !== undefined && message.method) send({ id: message.id, error: { code: -32601, message: `Method not found: ${message.method}` } });
  }
});

// The frame fits what it shows.
let height = 0;
new ResizeObserver(() => {
  const next_ = Math.ceil(html.getBoundingClientRect().height);
  if (next_ === height) return;
  height = next_;
  notify("ui/notifications/size-changed", { width: Math.ceil(html.getBoundingClientRect().width), height });
}).observe(document.body);

// The shapes are the specification's own (ext-apps src/spec.types.ts: McpUiInitializeRequest).
request("ui/initialize", {
  appInfo: { name: "mlola-render", version: rules.version },
  appCapabilities: { availableDisplayModes: ["inline"] },
  protocolVersion: PROTOCOL,
})
  .then((result) => {
    applyTheme(result?.hostContext);
    notify("ui/notifications/initialized");
  })
  // The host's own reason, so a mismatch with a host shows what to fix.
  .catch((error) => say(`The host did not start this view${error?.message ? `: ${error.message}` : "."}`));
