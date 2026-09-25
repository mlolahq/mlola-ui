import * as React from "react";

/* Upload. A cloud taking an arrow. For drop zones, imports and the first file.
   Generated from upload.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<circle cx=\"160\" cy=\"112\" r=\"86\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><ellipse cx=\"160\" cy=\"204\" rx=\"92\" ry=\"9\" style=\"fill:var(--ml-border, #d8d4cc);opacity:0.55\"/><path d=\"M104 166a34 34 0 0 1 4-68 46 46 0 0 1 88-10 38 38 0 0 1 20 78z\" style=\"fill:var(--ml-surface, #ffffff);stroke:var(--ml-border, #d8d4cc);stroke-width:2;stroke-linejoin:round\"/><circle cx=\"160\" cy=\"134\" r=\"26\" style=\"fill:var(--ml-primary, #5b5bd6)\"/><path d=\"M160 148v-28M148 130l12-12 12 12\" style=\"fill:none;stroke:var(--ml-primary-foreground, #ffffff);stroke-width:4.5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M232 68v12M226 74h12\" style=\"fill:none;stroke:var(--ml-chart-2, #e0895e);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"86\" cy=\"88\" r=\"4\" style=\"fill:var(--ml-primary-subtle, #e7e7fb)\"/>";

export interface UploadIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function UploadIllustration({ title, ...props }: UploadIllustrationProps) {
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
