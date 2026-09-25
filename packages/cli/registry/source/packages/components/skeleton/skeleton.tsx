import * as React from "react";
import { cx } from "../_internal/react";

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  /** Rounded corners (the default), square with `false`, or any radius. */
  rounded?: boolean | string;
  className?: string;
}

/** A placeholder shape. Decorative: wrap a loading area in SkeletonRegion to announce it. */
export function Skeleton({ width, height, rounded = true, className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      data-rounded={rounded === false ? "none" : typeof rounded === "string" ? undefined : ""}
      className={cx("ml-skeleton", className)}
      style={{ width, height, borderRadius: typeof rounded === "string" ? rounded : undefined }}
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

/**
 * Lines that occupy exactly the space of the text they stand in for: one
 * line-height each, inheriting the surrounding font size, so the layout does
 * not move when the real text arrives.
 */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  const count = Number.isFinite(lines) ? Math.max(1, Math.floor(lines)) : 3;
  return (
    <div aria-hidden="true" className={cx("ml-skeleton-text", className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="ml-skeleton ml-skeleton-line" data-rounded="" />
      ))}
    </div>
  );
}

export interface SkeletonAvatarProps {
  size?: number | string;
  className?: string;
}

export function SkeletonAvatar({ size = 40, className }: SkeletonAvatarProps) {
  return <Skeleton width={size} height={size} rounded="50%" className={cx("ml-skeleton-avatar", className)} />;
}

export interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div aria-hidden="true" className={cx("ml-skeleton-card", className)}>
      <Skeleton className="ml-skeleton-card-media" />
      <Skeleton className="ml-skeleton-card-title" />
      <SkeletonText lines={2} />
    </div>
  );
}

export interface SkeletonRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** What is loading, announced once to assistive technology. */
  label?: string;
}

/**
 * The accessible wrapper for placeholders: announces that something is
 * loading while the shapes themselves stay silent.
 */
export function SkeletonRegion({ label = "Loading", className, children, ...props }: SkeletonRegionProps) {
  return (
    <div role="status" aria-busy="true" className={cx("ml-skeleton-region", className)} {...props}>
      <span className="ml-visually-hidden">{label}</span>
      {children}
    </div>
  );
}
