import * as React from "react";

/* Storage. A stack of sturdy drawers with labels, handles and a highlighted active tray.
   Generated from storage.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<ellipse cx=\"161\" cy=\"201\" rx=\"96\" ry=\"13\" style=\"fill:var(--ml-background-subtle, #f3f2ee);stroke:none;stroke-width:0;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M64 202h26m152 0h17\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"68\" cy=\"183\" r=\"2\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"250\" cy=\"167\" r=\"2\" style=\"fill:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M91 57l105-14 36 21-104 16z\" style=\"fill:var(--ml-primary-subtle, #eceefa);stroke:var(--ml-text-faint, #9697a7);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M91 57l37 23v111l-37-23z\" style=\"fill:var(--ml-background-subtle, #f3f2ee);stroke:var(--ml-text-faint, #9697a7);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M128 80l104-16v104l-104 23z\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:var(--ml-text-faint, #9697a7);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M137 86l86-13v24l-86 16z\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M163 88l35-5.3v11l-35 5.3z\" style=\"fill:var(--ml-background-subtle, #f3f2ee);stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M173 92l15-2.3\" style=\"fill:none;stroke:var(--ml-text-faint, #9697a7);stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M137 119l86-13v24l-86 16z\" style=\"fill:var(--ml-primary-subtle, #eceefa);stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M163 121l35-5.3v11l-35 5.3z\" style=\"fill:var(--ml-primary, #6574cd);stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M173 125l15-2.3\" style=\"fill:none;stroke:var(--ml-primary-foreground, #ffffff);stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M137 152l86-13v24l-86 16z\" style=\"fill:color-mix(in oklab, var(--ml-surface-elevated, #fffefa) 90%, var(--ml-text-faint, #9697a7));stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M163 154l35-5.3v11l-35 5.3z\" style=\"fill:var(--ml-background-subtle, #f3f2ee);stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M173 158l15-2.3\" style=\"fill:none;stroke:var(--ml-text-faint, #9697a7);stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M107 90v22m0 13v22\" style=\"fill:none;stroke:color-mix(in srgb, var(--ml-border, #d5d4dc) 35%, var(--ml-text-faint, #9697a7));stroke-width:2;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M247 40Q247 46 253 46Q247 46 247 52Q247 46 241 46Q247 46 247 40\" style=\"fill:var(--ml-chart-2, #eeaa65);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"72\" cy=\"125\" r=\"3\" style=\"fill:var(--ml-chart-2, #eeaa65);stroke:none;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round\"/>";

export interface StorageIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function StorageIllustration({ title, ...props }: StorageIllustrationProps) {
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
