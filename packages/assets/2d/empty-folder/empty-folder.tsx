import * as React from "react";

/* Empty folder. An open folder waiting for its first file. For projects, drives and collections.
   Generated from empty-folder.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<circle cx=\"160\" cy=\"112\" r=\"86\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><ellipse cx=\"160\" cy=\"204\" rx=\"92\" ry=\"9\" style=\"fill:var(--ml-border, #d8d4cc);opacity:0.55\"/><path d=\"M88 78a8 8 0 0 1 8-8h40l12 14h76a8 8 0 0 1 8 8v88H88z\" style=\"fill:var(--ml-chart-2, #e0895e)\"/><rect x=\"112\" y=\"92\" width=\"96\" height=\"56\" rx=\"4\" style=\"fill:none;stroke:var(--ml-surface, #ffffff);stroke-width:2.5;stroke-dasharray:6 6\"/><path d=\"M80 112a8 8 0 0 1 8-8h144a8 8 0 0 1 8 9l-8 67a8 8 0 0 1-8 7H96a8 8 0 0 1-8-7z\" style=\"fill:var(--ml-primary, #5b5bd6)\"/><path d=\"M136 144h48\" style=\"fill:none;stroke:var(--ml-primary-foreground, #ffffff);stroke-width:4;stroke-linecap:round;stroke-linejoin:round;opacity:0.7\"/><path d=\"M236 58v12M230 64h12\" style=\"fill:none;stroke:var(--ml-primary, #5b5bd6);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round\"/>";

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
