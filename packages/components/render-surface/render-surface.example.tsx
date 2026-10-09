"use client";

import * as React from "react";
import { RenderSurface } from "./render-surface";

// What an agent sent: a surface, its components as a flat list, and the data its field is bound to.
const messages = [
  { version: "v0.9.1", createSurface: { surfaceId: "feedback", catalogId: "https://ui.mlola.com/a2ui/catalog/v1" } },
  {
    version: "v0.9.1",
    updateComponents: {
      surfaceId: "feedback",
      components: [
        { id: "root", component: "Card", children: ["title", "note", "send"] },
        { id: "title", component: "Heading", level: 3, text: "How was your order?" },
        { id: "note", component: "Textarea", label: "Tell us more", value: { path: "/note" }, required: true },
        { id: "send", component: "Button", text: "Send feedback", action: { event: { name: "send_feedback", context: { note: { path: "/note" } } } } },
      ],
    },
  },
  { version: "v0.9.1", updateDataModel: { surfaceId: "feedback", path: "/note", value: "" } },
];

export default function Example() {
  // The action goes back to the agent; here its context is shown instead.
  const [sent, setSent] = React.useState("");
  return (
    <>
      <RenderSurface messages={messages} onAction={(message) => setSent(String(message.action.context.note))} />
      <p role="status">{sent ? `Sent to the agent: ${sent}` : ""}</p>
    </>
  );
}
