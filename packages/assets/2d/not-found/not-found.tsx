import * as React from "react";

/* Not found. A folded map with a pin beside the path. For 404 pages and missing records.
   Generated from not-found.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<circle cx=\"160\" cy=\"112\" r=\"86\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><ellipse cx=\"160\" cy=\"204\" rx=\"92\" ry=\"9\" style=\"fill:var(--ml-border, #d8d4cc);opacity:0.55\"/><path d=\"M82 74l52-14 52 14 52-14v118l-52 14-52-14-52 14z\" style=\"fill:var(--ml-surface, #ffffff);stroke:var(--ml-border, #d8d4cc);stroke-width:2;stroke-linejoin:round\"/><path d=\"M134 60v118M186 74v118\" style=\"fill:none;stroke:var(--ml-border, #d8d4cc);stroke-width:2;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M96 160c20-6 24-36 50-34s30 26 58-2\" style=\"fill:none;stroke:var(--ml-text-faint, #a8a39a);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:2 8\"/><path d=\"M214 66a20 20 0 0 1 20 20c0 16-20 34-20 34s-20-18-20-34a20 20 0 0 1 20-20z\" style=\"fill:var(--ml-primary, #5b5bd6)\"/><circle cx=\"214\" cy=\"86\" r=\"7\" style=\"fill:var(--ml-surface, #ffffff)\"/><circle cx=\"96\" cy=\"160\" r=\"5\" style=\"fill:var(--ml-chart-2, #e0895e)\"/>";

export interface NotFoundIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function NotFoundIllustration({ title, ...props }: NotFoundIllustrationProps) {
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
