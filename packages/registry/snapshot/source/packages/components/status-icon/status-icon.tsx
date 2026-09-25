import * as React from "react";
import { cx } from "../_internal/react";
import { STATUS_LABELS, type WorkStatus } from "./labels";

export type { WorkStatus } from "./labels";
export { STATUS_LABELS, WORK_STATUSES } from "./labels";

export interface StatusIconProps extends Omit<React.SVGAttributes<SVGSVGElement>, "children"> {
  status: WorkStatus;
  /** How far along an active status is, 0 to 1; the ring fills to match. */
  progress?: number;
  /** The accessible name; defaults to the status label. Pass "" when a visible label sits beside it. */
  label?: string;
  size?: string;
}

const RADIUS = 2.4;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A work item's status as one glyph: a dashed ring for backlog, an empty
 * ring for todo, a ring that fills as the work moves through progress and
 * review, a solid check for done and a solid cross for canceled.
 */
export function StatusIcon({ status, progress, label, size = "1em", className, ...props }: StatusIconProps) {
  const name = label ?? STATUS_LABELS[status];
  const fill = progress ?? (status === "in-progress" ? 0.5 : status === "in-review" ? 0.75 : 0);
  return (
    <svg
      viewBox="0 0 14 14"
      width={size}
      height={size}
      className={cx("ml-status-icon", className)}
      data-status={status}
      role={name ? "img" : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : true}
      {...props}
    >
      {status === "done" || status === "canceled" ? (
        <>
          <circle cx="7" cy="7" r="6" fill="currentColor" />
          {status === "done" ? (
            <path d="M4.4 7.2 6.2 9 9.7 5.2" fill="none" stroke="var(--ml-status-mark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M5 5 9 9M9 5 5 9" fill="none" stroke="var(--ml-status-mark)" strokeWidth="1.5" strokeLinecap="round" />
          )}
        </>
      ) : (
        <>
          <circle
            cx="7"
            cy="7"
            r="5.75"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray={status === "backlog" ? "1.6 1.4" : undefined}
          />
          {fill > 0 ? (
            <circle
              cx="7"
              cy="7"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={RADIUS * 2}
              strokeDasharray={`${Math.min(1, fill) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              transform="rotate(-90 7 7)"
            />
          ) : null}
        </>
      )}
    </svg>
  );
}
