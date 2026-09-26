import * as React from "react";

/* Empty folder. An open project folder with a dashed space for its first document and a small add badge.
   Generated from empty-folder.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<ellipse cx=\"161\" cy=\"201\" rx=\"96\" ry=\"13\" style=\"fill:var(--ml-background-subtle, #f3f2ee);stroke:none;stroke-width:0;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M64 202h26m152 0h17\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"68\" cy=\"183\" r=\"2\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"250\" cy=\"167\" r=\"2\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M83 88q0-8 8-8h43l13 14h77q8 0 8 8v85H83z\" style=\"fill:var(--ml-primary-subtle, #eceefa);stroke:var(--ml-text-faint, #9697a7);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M85 100h145v86H85z\" style=\"fill:var(--ml-chart-2, #eeaa65);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><g transform=\"rotate(7 166 104)\"><rect x=\"126\" y=\"46\" width=\"73\" height=\"100\" rx=\"5\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"137\" y=\"59\" width=\"50\" height=\"70\" rx=\"3\" style=\"fill:none;stroke:var(--ml-text-faint, #9697a7);stroke-width:1;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M149 94h26m-13-13v26\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:2;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M142 50h25\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/></g><path d=\"M77 121q-2-8 7-8h146q10 0 8 9l-11 62q-1 9-10 9H96q-9 0-10-9z\" style=\"fill:var(--ml-primary, #6574cd);stroke:var(--ml-primary, #6574cd);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M77 121l9 63q1 9 10 9h10l-10-70q-1-10-11-10z\" style=\"fill:var(--ml-primary-foreground, #ffffff);stroke:none;stroke-width:0;stroke-linecap:round;stroke-linejoin:round;opacity:0.12\"/><rect x=\"102\" y=\"132\" width=\"46\" height=\"21\" rx=\"4\" style=\"fill:var(--ml-primary-foreground, #ffffff);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M111 140h27m-27 6h17\" style=\"fill:none;stroke:var(--ml-primary, #6574cd);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"219\" cy=\"182\" r=\"20\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M219 173v18m-9-9h18\" style=\"fill:none;stroke:var(--ml-primary, #6574cd);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M235 63Q235 69 241 69Q235 69 235 75Q235 69 229 69Q235 69 235 63\" style=\"fill:var(--ml-chart-2, #eeaa65);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M94 54l-6-7m-3 17-9-2\" style=\"fill:none;stroke:var(--ml-text-faint, #9697a7);stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round\"/>";

export interface EmptyFolderIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function EmptyFolderIllustration({ title, ...props }: EmptyFolderIllustrationProps) {
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
