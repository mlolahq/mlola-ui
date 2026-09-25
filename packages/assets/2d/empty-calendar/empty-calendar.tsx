import * as React from "react";

/* Empty calendar. A calendar page with one day picked. For schedules and bookings with nothing planned.
   Generated from empty-calendar.svg by npm run assets:2d. Painted with Mlola theme tokens, so it follows data-theme and data-mode. */

const ART = "<circle cx=\"160\" cy=\"112\" r=\"86\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><ellipse cx=\"160\" cy=\"204\" rx=\"92\" ry=\"9\" style=\"fill:var(--ml-border, #d8d4cc);opacity:0.55\"/><rect x=\"92\" y=\"62\" width=\"136\" height=\"124\" rx=\"12\" style=\"fill:var(--ml-surface, #ffffff);stroke:var(--ml-border, #d8d4cc);stroke-width:2;stroke-linejoin:round\"/><path d=\"M92 74a12 12 0 0 1 12-12h112a12 12 0 0 1 12 12v18H92z\" style=\"fill:var(--ml-primary, #5b5bd6)\"/><path d=\"M122 52v20M198 52v20\" style=\"fill:none;stroke:var(--ml-text, #27272c);stroke-width:5;stroke-linecap:round;stroke-linejoin:round\"/><rect x=\"106\" y=\"104\" width=\"20\" height=\"14\" rx=\"4\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><rect x=\"134\" y=\"104\" width=\"20\" height=\"14\" rx=\"4\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><rect x=\"162\" y=\"104\" width=\"20\" height=\"14\" rx=\"4\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><rect x=\"190\" y=\"104\" width=\"20\" height=\"14\" rx=\"4\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><rect x=\"106\" y=\"128\" width=\"20\" height=\"14\" rx=\"4\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><rect x=\"134\" y=\"128\" width=\"20\" height=\"14\" rx=\"4\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><rect x=\"162\" y=\"128\" width=\"20\" height=\"14\" rx=\"4\" style=\"fill:var(--ml-chart-2, #e0895e)\"/><rect x=\"190\" y=\"128\" width=\"20\" height=\"14\" rx=\"4\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><rect x=\"106\" y=\"152\" width=\"20\" height=\"14\" rx=\"4\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><rect x=\"134\" y=\"152\" width=\"20\" height=\"14\" rx=\"4\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><rect x=\"162\" y=\"152\" width=\"20\" height=\"14\" rx=\"4\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><rect x=\"190\" y=\"152\" width=\"20\" height=\"14\" rx=\"4\" style=\"fill:var(--ml-background-subtle, #f3f2ee)\"/><path d=\"M242 145v10M237 150h10\" style=\"fill:none;stroke:var(--ml-primary, #5b5bd6);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round\"/>";

export interface EmptyCalendarIllustrationProps extends Omit<React.SVGProps<SVGSVGElement>, "children" | "dangerouslySetInnerHTML"> {
  /** An accessible name. Without one the illustration is decorative and hidden from assistive technology. */
  title?: string;
}

export function EmptyCalendarIllustration({ title, ...props }: EmptyCalendarIllustrationProps) {
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
