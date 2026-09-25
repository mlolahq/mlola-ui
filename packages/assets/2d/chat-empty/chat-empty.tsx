import * as React from "react";

/* No messages. Two speech bubbles, one still typing. For conversations and assistants before the first message.
   Generated from chat-empty.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<circle cx=\"160\" cy=\"112\" r=\"86\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><ellipse cx=\"160\" cy=\"204\" rx=\"92\" ry=\"9\" style=\"fill:var(--ml-border, #d8d4cc);opacity:0.55\"/><path d=\"M84 72a12 12 0 0 1 12-12h92a12 12 0 0 1 12 12v44a12 12 0 0 1-12 12h-62l-22 18v-18h-8a12 12 0 0 1-12-12z\" style=\"fill:var(--ml-surface, #ffffff);stroke:var(--ml-border, #d8d4cc);stroke-width:2;stroke-linejoin:round\"/><circle cx=\"112\" cy=\"94\" r=\"6\" style=\"fill:var(--ml-border, #d8d4cc)\"/><circle cx=\"132\" cy=\"94\" r=\"6\" style=\"fill:var(--ml-border, #d8d4cc)\"/><circle cx=\"152\" cy=\"94\" r=\"6\" style=\"fill:var(--ml-border, #d8d4cc)\"/><path d=\"M136 124a12 12 0 0 1 12-12h76a12 12 0 0 1 12 12v36a12 12 0 0 1-12 12h-4v16l-20-16h-52a12 12 0 0 1-12-12z\" style=\"fill:var(--ml-primary, #5b5bd6)\"/><path d=\"M156 134h56M156 150h36\" style=\"fill:none;stroke:var(--ml-primary-foreground, #ffffff);stroke-width:5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M244 70v12M238 76h12\" style=\"fill:none;stroke:var(--ml-chart-2, #e0895e);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round\"/>";

export interface ChatEmptyIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function ChatEmptyIllustration({ title, ...props }: ChatEmptyIllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 240"
      fill="none"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      {...props}
      dangerouslySetInnerHTML={{ __html: ART }}
    />
  );
}
