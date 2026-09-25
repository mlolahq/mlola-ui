import * as React from "react";

/* Offline. A signal with a broken arc. For lost connections and sync paused.
   Generated from offline.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<circle cx=\"160\" cy=\"112\" r=\"86\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><ellipse cx=\"160\" cy=\"204\" rx=\"92\" ry=\"9\" style=\"fill:var(--ml-border, #d8d4cc);opacity:0.55\"/><path d=\"M100 116a86 86 0 0 1 120 0\" style=\"fill:none;stroke:var(--ml-border, #d8d4cc);stroke-width:10;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M118 136a60 60 0 0 1 84 0\" style=\"fill:none;stroke:var(--ml-border, #d8d4cc);stroke-width:10;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M138 156a32 32 0 0 1 44 0\" style=\"fill:none;stroke:var(--ml-primary, #5b5bd6);stroke-width:10;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"160\" cy=\"178\" r=\"9\" style=\"fill:var(--ml-primary, #5b5bd6)\"/><path d=\"M104 72l112 116\" style=\"fill:none;stroke:var(--ml-surface, #ffffff);stroke-width:16;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M104 72l112 116\" style=\"fill:none;stroke:var(--ml-chart-2, #e0895e);stroke-width:7;stroke-linecap:round;stroke-linejoin:round\"/>";

export interface OfflineIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function OfflineIllustration({ title, ...props }: OfflineIllustrationProps) {
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
