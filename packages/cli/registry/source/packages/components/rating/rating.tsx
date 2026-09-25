"use client";

import * as React from "react";
import { cx } from "../_internal/react";

/**
 * A star rating that tells the truth about fractions.
 *
 * Rounding 4.4 up to five stars is a small lie that shows up everywhere a
 * product is compared. So the filled stars are a clipped overlay whose width
 * is the exact percentage, which renders 4.5 as half a star without needing a
 * second glyph, an image, or a font that happens to have one.
 *
 * The visible stars are decorative; the accessible name carries the number.
 */

export interface RatingProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  value: number;
  max?: number;
  /** Review count shown beside the stars. */
  count?: number;
  /** Show the numeric value, which is clearer than stars alone at a glance. */
  showValue?: boolean;
  label?: string;
}

export function Rating({
  value,
  max = 5,
  count,
  showValue = false,
  label,
  className,
  ...props
}: RatingProps) {
  const total = Number.isFinite(max) && max > 0 ? Math.round(max) : 5;
  const safe = Number.isFinite(value) ? Math.min(total, Math.max(0, value)) : 0;
  const percent = (safe / total) * 100;
  const rounded = Math.round(safe * 10) / 10;
  const stars = "★".repeat(total);

  return (
    <span
      {...props}
      role="img"
      aria-label={label ?? `Rated ${rounded} out of ${total}${count === undefined ? "" : ` from ${count} reviews`}`}
      className={cx("ml-rating", className)}
    >
      <span aria-hidden="true" className="ml-rating-track">
        <span className="ml-rating-fill" style={{ ["--ml-rating" as string]: `${percent}%` }}>
          {stars}
        </span>
        {stars}
      </span>
      {showValue ? <span className="ml-rating-value">{rounded.toFixed(1)}</span> : null}
      {count === undefined ? null : <span className="ml-rating-count">({count})</span>}
    </span>
  );
}

export default function Showcase() {
  return (
    <div className="ml-rating-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Fractions</h3>
        <p className="ml-showcase-note">
          The fill is clipped to the exact percentage, so a half star is really half.
        </p>
        <div className="ml-showcase-stack">
          {[5, 4.5, 4, 3.7, 3, 2.5, 1, 0].map((value) => (
            <Rating key={value} value={value} showValue />
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">With review count</h3>
        <div className="ml-showcase-stack">
          <Rating value={4.8} count={214} />
          <Rating value={4.2} count={89} />
          <Rating value={3.5} count={12} />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Other scales</h3>
        <div className="ml-showcase-stack">
          <Rating value={7.5} max={10} showValue />
          <Rating value={2.5} max={3} showValue />
        </div>
      </section>
    </div>
  );
}
