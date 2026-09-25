import * as React from "react";

/* Success. A check in a circle with a little confetti. For completed payments, sign-ups and saves.
   Generated from success.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<circle cx=\"160\" cy=\"112\" r=\"86\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><ellipse cx=\"160\" cy=\"204\" rx=\"92\" ry=\"9\" style=\"fill:var(--ml-border, #d8d4cc);opacity:0.55\"/><circle cx=\"160\" cy=\"118\" r=\"50\" style=\"fill:var(--ml-primary-subtle, #e7e7fb)\"/><circle cx=\"160\" cy=\"118\" r=\"36\" style=\"fill:var(--ml-primary, #5b5bd6)\"/><path d=\"M143 119l12 12 23-25\" style=\"fill:none;stroke:var(--ml-primary-foreground, #ffffff);stroke-width:7;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"96\" y=\"70\" width=\"12\" height=\"6\" rx=\"2\" transform=\"rotate(-24 102 73)\" style=\"fill:var(--ml-chart-2, #e0895e)\"/><rect x=\"222\" y=\"84\" width=\"12\" height=\"6\" rx=\"2\" transform=\"rotate(32 228 87)\" style=\"fill:var(--ml-primary, #5b5bd6)\"/><rect x=\"214\" y=\"158\" width=\"10\" height=\"5\" rx=\"2\" transform=\"rotate(-40 219 160)\" style=\"fill:var(--ml-chart-2, #e0895e)\"/><circle cx=\"100\" cy=\"150\" r=\"4\" style=\"fill:var(--ml-primary, #5b5bd6)\"/><circle cx=\"232\" cy=\"128\" r=\"3\" style=\"fill:var(--ml-chart-2, #e0895e)\"/><path d=\"M120 51v10M115 56h10\" style=\"fill:none;stroke:var(--ml-primary, #5b5bd6);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round\"/>";

export interface SuccessIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function SuccessIllustration({ title, ...props }: SuccessIllustrationProps) {
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
