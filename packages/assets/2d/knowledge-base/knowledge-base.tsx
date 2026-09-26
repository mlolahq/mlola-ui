import * as React from "react";

/* Knowledge base. A considered row of reference books with a saved page and a reading note.
   Generated from knowledge-base.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<ellipse cx=\"161\" cy=\"201\" rx=\"96\" ry=\"13\" style=\"fill:var(--ml-background-subtle, #f3f2ee);stroke:none;stroke-width:0;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M64 202h26m152 0h17\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"68\" cy=\"183\" r=\"2\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"250\" cy=\"167\" r=\"2\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"77\" y=\"183\" width=\"168\" height=\"8\" rx=\"3\" style=\"fill:var(--ml-primary-subtle, #eceefa);stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><g transform=\"rotate(-9 115 180)\"><rect x=\"84\" y=\"65\" width=\"39\" height=\"116\" rx=\"5\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"84\" y=\"65\" width=\"9\" height=\"116\" rx=\"3\" style=\"fill:var(--ml-primary-subtle, #eceefa);stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M102 81h12m-12 6h9\" style=\"fill:none;stroke:var(--ml-text-faint, #9697a7);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M100 165h15\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/></g><rect x=\"128\" y=\"57\" width=\"41\" height=\"125\" rx=\"5\" style=\"fill:var(--ml-primary, #6574cd);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M139 75h19m-19 7h13\" style=\"fill:none;stroke:var(--ml-primary-foreground, #ffffff);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M139 167h19\" style=\"fill:none;stroke:var(--ml-primary-foreground, #ffffff);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"175\" y=\"79\" width=\"39\" height=\"103\" rx=\"5\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M184 97h20m-20 7h12\" style=\"fill:none;stroke:var(--ml-text-faint, #9697a7);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M195 79v27l5-4 5 4V79\" style=\"fill:var(--ml-chart-2, #eeaa65);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"218\" y=\"139\" width=\"33\" height=\"44\" rx=\"7\" style=\"fill:var(--ml-background-subtle, #f3f2ee);stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"214\" y=\"135\" width=\"33\" height=\"44\" rx=\"7\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M221 148h17\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:2;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M221 157h12.239999999999998\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:2;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"229\" cy=\"66\" r=\"3\" style=\"fill:var(--ml-primary-subtle, #eceefa);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/>";

export interface KnowledgeBaseIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function KnowledgeBaseIllustration({ title, ...props }: KnowledgeBaseIllustrationProps) {
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
