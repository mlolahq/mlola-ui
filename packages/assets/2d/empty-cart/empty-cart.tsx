import * as React from "react";

/* Empty cart. A shopping cart with nothing in it. For carts, baskets and wish lists.
   Generated from empty-cart.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<circle cx=\"160\" cy=\"112\" r=\"86\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><ellipse cx=\"160\" cy=\"204\" rx=\"92\" ry=\"9\" style=\"fill:var(--ml-border, #d8d4cc);opacity:0.55\"/><path d=\"M84 72h22l20 82h78l16-58H116\" style=\"fill:none;stroke:var(--ml-text, #27272c);stroke-width:5;stroke-linecap:round;stroke-linejoin:round\"/><path d=\"M113 96h107l-16 58h-78z\" style=\"fill:var(--ml-primary-subtle, #e7e7fb)\"/><path d=\"M132 114h70M136 132h60\" style=\"fill:none;stroke:var(--ml-surface, #ffffff);stroke-width:4;stroke-linecap:round;stroke-linejoin:round\"/><circle cx=\"138\" cy=\"178\" r=\"10\" style=\"fill:var(--ml-surface, #ffffff);stroke:var(--ml-text, #27272c);stroke-width:4;stroke-linejoin:round\"/><circle cx=\"196\" cy=\"178\" r=\"10\" style=\"fill:var(--ml-surface, #ffffff);stroke:var(--ml-text, #27272c);stroke-width:4;stroke-linejoin:round\"/><path d=\"M214 56l22 6-6 22-22-6a6 6 0 0 1-4-7l3-11a6 6 0 0 1 7-4z\" style=\"fill:var(--ml-chart-2, #e0895e)\"/><circle cx=\"219\" cy=\"66\" r=\"3\" style=\"fill:var(--ml-surface, #ffffff)\"/><circle cx=\"90\" cy=\"116\" r=\"3.5\" style=\"fill:var(--ml-primary, #5b5bd6)\"/>";

export interface EmptyCartIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function EmptyCartIllustration({ title, ...props }: EmptyCartIllustrationProps) {
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
