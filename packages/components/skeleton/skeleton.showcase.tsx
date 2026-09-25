"use client";

import * as React from "react";
import { Avatar } from "../avatar/avatar";
import { Skeleton, SkeletonAvatar, SkeletonCard, SkeletonRegion, SkeletonText } from "./skeleton";

const PARAGRAPH =
  "Placeholders take exactly the space of the content they stand in for, so nothing moves when it arrives. Each skeleton line is one line box of the surrounding text.";

export default function Showcase() {
  const [loaded, setLoaded] = React.useState(false);
  return (
    <div className="ml-skeleton-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">No layout shift: toggle to swap placeholder and content</h3>
        <div className="ml-card ml-showcase-stack">
          <div className="ml-showcase-row">
            {loaded ? <Avatar name="Sara Kim" alt="" size="md" /> : <SkeletonAvatar size={40} />}
            <div style={{ flex: 1, maxWidth: "12rem" }}>
              {loaded ? <strong>Sara Kim</strong> : <SkeletonText lines={1} />}
            </div>
          </div>
          {loaded ? <p>{PARAGRAPH}</p> : <SkeletonRegion label="Loading profile"><SkeletonText lines={2} /></SkeletonRegion>}
        </div>
        <div className="ml-showcase-row">
          <button type="button" className="ml-button" data-variant="secondary" data-size="sm" onClick={() => setLoaded((value) => !value)}>
            {loaded ? "Show placeholder" : "Load content"}
          </button>
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Shapes</h3>
        <div className="ml-showcase-row" data-align="start">
          <Skeleton width={120} height={32} />
          <Skeleton width={72} height={72} rounded="50%" />
          <Skeleton width={200} height={12} rounded={false} />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Text follows the surrounding type size</h3>
        <div className="ml-showcase-columns">
          <SkeletonText lines={4} />
          <div className="ml-heading">
            <SkeletonText lines={2} />
          </div>
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Card placeholder</h3>
        <SkeletonRegion label="Loading products">
          <div className="ml-showcase-columns">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </SkeletonRegion>
        <p className="ml-showcase-note">One band sweeps every placeholder together. Placeholders appear only after 160 ms, so quick loads never flash.</p>
      </section>
    </div>
  );
}
