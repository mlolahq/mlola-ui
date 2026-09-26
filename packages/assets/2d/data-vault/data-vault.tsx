import * as React from "react";

/* Data vault. A sealed storage cabinet with a circular combination dial and organized files.
   Generated from data-vault.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<ellipse cx=\"161\" cy=\"201\" rx=\"96\" ry=\"13\" style=\"fill:var(--ml-background-subtle, #f3f2ee);stroke:none;stroke-width:0;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M64 202h26m152 0h17\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"68\" cy=\"183\" r=\"2\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"250\" cy=\"167\" r=\"2\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M85 71l120-14 32 18-119 16z\" style=\"fill:var(--ml-primary-subtle, #eceefa);stroke:var(--ml-text-faint, #9697a7);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M85 71l33 20v101l-33-19z\" style=\"fill:var(--ml-background-subtle, #f3f2ee);stroke:var(--ml-text-faint, #9697a7);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M118 91l119-16v101l-119 16z\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:var(--ml-text-faint, #9697a7);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M127 99l101-13v82l-101 14z\" style=\"fill:var(--ml-primary-subtle, #eceefa);stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"179\" cy=\"133\" r=\"31\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:var(--ml-text-faint, #9697a7);stroke-width:2;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"179\" cy=\"133\" r=\"23\" style=\"fill:var(--ml-primary, #6574cd);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"179\" cy=\"133\" r=\"9\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M179 106h-9\" style=\"fill:none;stroke:var(--ml-primary-foreground, #ffffff);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M179 124h9\" style=\"fill:none;stroke:var(--ml-primary-foreground, #ffffff);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M179 142h-9\" style=\"fill:none;stroke:var(--ml-primary-foreground, #ffffff);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M179 160h9\" style=\"fill:none;stroke:var(--ml-primary-foreground, #ffffff);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"96\" y=\"105\" width=\"10\" height=\"20\" rx=\"2\" style=\"fill:var(--ml-chart-2, #eeaa65);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"96\" y=\"137\" width=\"10\" height=\"20\" rx=\"2\" style=\"fill:var(--ml-chart-2, #eeaa65);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M129 177l95-12\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M250 55Q250 61 256 61Q250 61 250 67Q250 61 244 61Q250 61 250 55\" style=\"fill:var(--ml-chart-2, #eeaa65);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/>";

export interface DataVaultIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function DataVaultIllustration({ title, ...props }: DataVaultIllustrationProps) {
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
