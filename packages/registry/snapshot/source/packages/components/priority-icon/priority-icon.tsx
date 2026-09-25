import * as React from "react";
import { cx } from "../_internal/react";
import { PRIORITY_LABELS, type WorkPriority } from "./labels";

export type { WorkPriority } from "./labels";
export { PRIORITY_LABELS, WORK_PRIORITIES } from "./labels";

export interface PriorityIconProps extends Omit<React.SVGAttributes<SVGSVGElement>, "children"> {
  priority: WorkPriority;
  /** The accessible name; defaults to the priority label. Pass "" when a visible label sits beside it. */
  label?: string;
  size?: string;
}

const LEVEL: Record<WorkPriority, number> = { none: 0, low: 1, medium: 2, high: 3, urgent: 4 };

/**
 * A work item's priority as signal bars: one, two or three filled for low,
 * medium and high, a filled alert for urgent, and a quiet dash for none.
 */
export function PriorityIcon({ priority, label, size = "1em", className, ...props }: PriorityIconProps) {
  const name = label ?? PRIORITY_LABELS[priority];
  const level = LEVEL[priority];
  return (
    <svg
      viewBox="0 0 14 14"
      width={size}
      height={size}
      className={cx("ml-priority-icon", className)}
      data-priority={priority}
      role={name ? "img" : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : true}
      {...props}
    >
      {priority === "urgent" ? (
        <>
          <rect x="1" y="1" width="12" height="12" rx="3" fill="currentColor" />
          <path d="M7 3.8v3.9" stroke="var(--ml-priority-mark)" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="7" cy="10" r="0.95" fill="var(--ml-priority-mark)" />
        </>
      ) : priority === "none" ? (
        <path d="M2.5 7h1.6M6.2 7h1.6M9.9 7h1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        [0, 1, 2].map((bar) => (
          <rect
            key={bar}
            x={1.5 + bar * 4}
            y={9 - bar * 3.2}
            width="3"
            height={3.5 + bar * 3.2}
            rx="1"
            fill="currentColor"
            opacity={bar < level ? 1 : 0.28}
          />
        ))
      )}
    </svg>
  );
}
