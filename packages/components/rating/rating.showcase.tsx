"use client";

import { Rating } from "./rating";

export default function Showcase() {
  return (
    <div className="ml-rating-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Exact fractions — 4.4 is not rounded up to five</h3>
        <div className="ml-showcase-stack">
          <Rating value={5} showValue />
          <Rating value={4.4} showValue />
          <Rating value={3.5} showValue />
          <Rating value={1.2} showValue />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">With a review count</h3>
        <div className="ml-showcase-stack">
          <Rating value={4.7} count={1284} showValue />
          <Rating value={4.1} count={36} />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Another scale</h3>
        <div className="ml-showcase-stack">
          <Rating value={7.5} max={10} showValue />
        </div>
      </section>
    </div>
  );
}
