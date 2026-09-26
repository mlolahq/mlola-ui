"use client";

import * as React from "react";
import { IconCheck } from "@mlola-ui/icons";
import { cx } from "../_internal/react";

type TimelineStatus = "complete" | "current" | "upcoming";
type TimelineTone = "neutral" | "primary" | "info" | "success" | "warning" | "danger";

const Timeline = React.forwardRef<HTMLOListElement, React.OlHTMLAttributes<HTMLOListElement>>(
  ({ className, children, ...rest }, ref) => (
    <ol ref={ref} className={cx("ml-timeline", className)} {...rest}>
      {children}
    </ol>
  )
);
Timeline.displayName = "Timeline";

interface TimelineItemProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
  /** Progress through a sequence: done, happening now, or still to come. */
  status?: TimelineStatus;
  /** Colors an event marker, for activity feeds: a failed deploy, a merged change. */
  tone?: TimelineTone;
  time?: React.ReactNode;
  /** A machine-readable time for `<time dateTime>`. */
  dateTime?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Replaces the status mark inside the marker. */
  icon?: React.ReactNode;
}

/**
 * One event: a marker on the rail, then a title with its time and an
 * optional description. Anything passed as children (a quote, a card, a
 * diff) sits under the description, still aligned to the text column.
 */
const TimelineItem = React.forwardRef<HTMLLIElement, TimelineItemProps>(
  ({ status = "upcoming", tone, time, dateTime, title, description, icon, className, children, ...rest }, ref) => (
    <li ref={ref} className={cx("ml-timeline-item", className)} data-status={status} aria-current={status === "current" ? "step" : undefined} {...rest}>
      <TimelineDot status={status} data-tone={tone}>
        {icon}
      </TimelineDot>
      <div className="ml-timeline-body">
        <div className="ml-timeline-heading">
          <TimelineTitle>{title}</TimelineTitle>
          {time != null ? <TimelineTime dateTime={dateTime}>{time}</TimelineTime> : null}
        </div>
        {description != null ? <TimelineDescription>{description}</TimelineDescription> : null}
        {children != null ? <div className="ml-timeline-content">{children}</div> : null}
      </div>
    </li>
  )
);
TimelineItem.displayName = "TimelineItem";

interface TimelineDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: TimelineStatus;
}

const TimelineDot = React.forwardRef<HTMLSpanElement, TimelineDotProps>(
  ({ status = "upcoming", className, children, ...rest }, ref) => (
    <span
      ref={ref}
      aria-hidden="true"
      data-status={status}
      className={cx("ml-timeline-marker", className)}
      {...rest}
    >
      {children ?? getStatusFallback(status)}
    </span>
  )
);
TimelineDot.displayName = "TimelineDot";

function getStatusFallback(status: TimelineStatus) {
  if (status === "complete") return <IconCheck size="0.75rem" />;
  if (status === "current") return <span className="ml-timeline-pulse" />;
  return null;
}

const TimelineTime = React.forwardRef<HTMLTimeElement, React.TimeHTMLAttributes<HTMLTimeElement>>(
  ({ className, children, ...rest }, ref) => (
    <time ref={ref} className={cx("ml-timeline-time", className)} {...rest}>
      {children}
    </time>
  )
);
TimelineTime.displayName = "TimelineTime";

const TimelineTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...rest }, ref) => (
    <p ref={ref} className={cx("ml-timeline-title", className)} {...rest}>
      {children}
    </p>
  )
);
TimelineTitle.displayName = "TimelineTitle";

const TimelineDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...rest }, ref) => (
    <p ref={ref} className={cx("ml-timeline-description", className)} {...rest}>
      {children}
    </p>
  )
);
TimelineDescription.displayName = "TimelineDescription";
export {
  Timeline,
  TimelineItem,
  TimelineDot,
  TimelineTime,
  TimelineTitle,
  TimelineDescription };
export type { TimelineStatus, TimelineTone, TimelineItemProps, TimelineDotProps };
