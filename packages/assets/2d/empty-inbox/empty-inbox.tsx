import * as React from "react";

/* Empty inbox. An open tray with a letter hovering above it. For an inbox or feed with nothing new.
   Generated from empty-inbox.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<circle cx=\"160\" cy=\"112\" r=\"86\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><ellipse cx=\"160\" cy=\"204\" rx=\"92\" ry=\"9\" style=\"fill:var(--ml-border, #d8d4cc);opacity:0.55\"/><path d=\"M92 150l18-46h100l18 46v36a10 10 0 0 1-10 10H102a10 10 0 0 1-10-10z\" style=\"fill:var(--ml-surface, #ffffff);stroke:var(--ml-border, #d8d4cc);stroke-width:2;stroke-linejoin:round\"/><path d=\"M92 150h42a26 12 0 0 0 52 0h42\" style=\"fill:none;stroke:var(--ml-border, #d8d4cc);stroke-width:2;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M134 150a26 12 0 0 0 52 0v14a10 10 0 0 1-10 10h-32a10 10 0 0 1-10-10z\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><rect x=\"122\" y=\"56\" width=\"76\" height=\"52\" rx=\"8\" style=\"fill:var(--ml-surface, #ffffff);stroke:var(--ml-primary, #5b5bd6);stroke-width:2.5;stroke-linejoin:round\"/><path d=\"M124 60l36 26 36-26\" style=\"fill:none;stroke:var(--ml-primary, #5b5bd6);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M222 64v12M216 70h12\" style=\"fill:none;stroke:var(--ml-primary, #5b5bd6);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"98\" cy=\"84\" r=\"4\" style=\"fill:var(--ml-chart-2, #e0895e)\"/><circle cx=\"236\" cy=\"118\" r=\"3\" style=\"fill:var(--ml-primary-subtle, #e7e7fb)\"/>";

export interface EmptyInboxIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function EmptyInboxIllustration({ title, ...props }: EmptyInboxIllustrationProps) {
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
