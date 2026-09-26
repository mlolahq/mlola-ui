import * as React from "react";

/* Access granted. A precision key beside an approved access card. A simple permission metaphor.
   Generated from access-granted.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<ellipse cx=\"161\" cy=\"201\" rx=\"96\" ry=\"13\" style=\"fill:var(--ml-background-subtle, #f3f2ee);stroke:none;stroke-width:0;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M64 202h26m152 0h17\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"68\" cy=\"183\" r=\"2\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"250\" cy=\"167\" r=\"2\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><g transform=\"rotate(5 185 113)\"><rect x=\"150\" y=\"69\" width=\"88\" height=\"111\" rx=\"7\" style=\"fill:var(--ml-background-subtle, #f3f2ee);stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"146\" y=\"65\" width=\"88\" height=\"111\" rx=\"7\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"159\" y=\"80\" width=\"22\" height=\"18\" rx=\"4\" style=\"fill:var(--ml-primary-subtle, #eceefa);stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M159 113h58\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:2;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M159 122h41.76\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:2;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"159\" y=\"146\" width=\"34\" height=\"9\" rx=\"4\" style=\"fill:var(--ml-primary, #6574cd);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/></g><g transform=\"rotate(-34 120 138)\"><circle cx=\"120\" cy=\"105\" r=\"28\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:var(--ml-text-faint, #9697a7);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"120\" cy=\"105\" r=\"13\" style=\"fill:var(--ml-primary-subtle, #eceefa);stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"113\" y=\"129\" width=\"14\" height=\"60\" rx=\"4\" style=\"fill:var(--ml-primary, #6574cd);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"123\" y=\"161\" width=\"16\" height=\"9\" rx=\"2\" style=\"fill:var(--ml-primary, #6574cd);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"123\" y=\"179\" width=\"12\" height=\"9\" rx=\"2\" style=\"fill:var(--ml-primary, #6574cd);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/></g><circle cx=\"226\" cy=\"177\" r=\"14\" style=\"fill:var(--ml-primary, #6574cd);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M220.8 176l3.9000000000000004 3.9000000000000004 7.800000000000001 -8.450000000000001\" style=\"fill:none;stroke:var(--ml-primary-foreground, #ffffff);stroke-width:2;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"83\" cy=\"69\" r=\"3\" style=\"fill:var(--ml-chart-2, #eeaa65);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/>";

export interface AccessGrantedIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function AccessGrantedIllustration({ title, ...props }: AccessGrantedIllustrationProps) {
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
