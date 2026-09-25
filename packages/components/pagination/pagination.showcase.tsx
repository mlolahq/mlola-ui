"use client";

import * as React from "react";
import { Pagination } from "./pagination";

export default function PaginationShowcase() {
  const [middle, setMiddle] = React.useState(7);
  const [short, setShort] = React.useState(2);
  const [, setWide] = React.useState(48);
  return (
    <div className="ml-pagination-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Few pages</h3>
        <p className="ml-showcase-note">Under the collapse threshold every page is listed.</p>
        <Pagination currentPage={short} totalPages={5} onPageChange={setShort} />
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Truncated on both sides</h3>
        <Pagination currentPage={middle} totalPages={24} onPageChange={setMiddle} />
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Sibling count</h3>
        <div className="ml-showcase-stack">
          <Pagination currentPage={middle} totalPages={24} siblingCount={0} onPageChange={setMiddle} />
          <Pagination currentPage={middle} totalPages={24} siblingCount={2} onPageChange={setMiddle} />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Boundaries</h3>
        <p className="ml-showcase-note">Previous is disabled on page one, Next on the last page.</p>
        <div className="ml-showcase-stack">
          <Pagination currentPage={1} totalPages={12} onPageChange={() => undefined} />
          <Pagination currentPage={50} totalPages={50} onPageChange={setWide} />
        </div>
      </section>
    </div>
  );
}
