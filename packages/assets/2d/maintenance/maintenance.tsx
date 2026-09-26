import * as React from "react";

/* Maintenance. A compact tool case with a spanner, a screwdriver and organized parts.
   Generated from maintenance.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<ellipse cx=\"161\" cy=\"201\" rx=\"96\" ry=\"13\" style=\"fill:var(--ml-background-subtle, #f3f2ee);stroke:none;stroke-width:0;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M64 202h26m152 0h17\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"68\" cy=\"183\" r=\"2\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"250\" cy=\"167\" r=\"2\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M105 97V82q0-11 11-11h88q11 0 11 11v15\" style=\"fill:none;stroke:var(--ml-text-faint, #9697a7);stroke-width:6;stroke-linecap:round;stroke-linejoin:round\"/><g transform=\"rotate(-22 121 102)\"><path d=\"M119 113V72\" style=\"fill:none;stroke:var(--ml-primary, #6574cd);stroke-width:8;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M112 49l1 12h12l1-12a15 15 0 1 1-14 0z\" style=\"fill:var(--ml-primary-subtle, #eceefa);stroke:var(--ml-text-faint, #9697a7);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/></g><g transform=\"rotate(19 198 92)\"><path d=\"M198 66v54\" style=\"fill:none;stroke:var(--ml-text-faint, #9697a7);stroke-width:4;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"192\" y=\"43\" width=\"12\" height=\"31\" rx=\"4\" style=\"fill:var(--ml-chart-2, #eeaa65);stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M198 50v15\" style=\"fill:none;stroke:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/></g><rect x=\"78\" y=\"101\" width=\"164\" height=\"88\" rx=\"11\" style=\"fill:var(--ml-background-subtle, #f3f2ee);stroke:var(--ml-text-faint, #9697a7);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M78 110q0-9 9-9h146q9 0 9 9v22q0 8-8 8H86q-8 0-8-8z\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:var(--ml-text-faint, #9697a7);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"147\" y=\"128\" width=\"26\" height=\"18\" rx=\"5\" style=\"fill:var(--ml-primary, #6574cd);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"160\" cy=\"137\" r=\"4\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"100\" cy=\"163\" r=\"3\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"113\" cy=\"163\" r=\"3\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"126\" cy=\"163\" r=\"3\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M251 69Q251 75 257 75Q251 75 251 81Q251 75 245 75Q251 75 251 69\" style=\"fill:var(--ml-chart-2, #eeaa65);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/>";

export interface MaintenanceIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function MaintenanceIllustration({ title, ...props }: MaintenanceIllustrationProps) {
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
