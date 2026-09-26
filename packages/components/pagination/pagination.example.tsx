"use client";

import * as React from "react";
import { Pagination } from "./pagination";

export default function Example() {
  const [page, setPage] = React.useState(3);
  return <Pagination currentPage={page} totalPages={12} onPageChange={setPage} />;
}
