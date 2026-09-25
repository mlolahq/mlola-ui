"use client";

import { cx } from "../_internal/react";
import { IconChevronLeft, IconChevronRight } from "@mlola-ui/icons";

type PageItem = number | "ellipsis-start" | "ellipsis-end";
const pages = (current: number, total: number, siblingCount: number): PageItem[] => {
  if (total <= siblingCount * 2 + 5) return Array.from({ length: total }, (_, index) => index + 1);
  const left = Math.max(2, current - siblingCount);
  const right = Math.min(total - 1, current + siblingCount);
  const result: PageItem[] = [1];
  if (left > 2) result.push("ellipsis-start");
  else for (let page = 2; page < left; page += 1) result.push(page);
  for (let page = left; page <= right; page += 1) result.push(page);
  if (right < total - 1) result.push("ellipsis-end");
  else for (let page = right + 1; page < total; page += 1) result.push(page);
  result.push(total);
  return result;
};

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
}
export function Pagination({ currentPage, totalPages, onPageChange, siblingCount = 1, className }: PaginationProps) {
  const total = Number.isFinite(totalPages) ? Math.max(1, Math.floor(totalPages)) : 1;
  const requested = Number.isFinite(currentPage) ? Math.floor(currentPage) : 1;
  const current = Math.min(total, Math.max(1, requested));
  const siblings = Number.isFinite(siblingCount) ? Math.max(0, Math.floor(siblingCount)) : 1;
  const go = (page: number) => {
    const next = Math.min(total, Math.max(1, page));
    if (next !== current) onPageChange(next);
  };
  return (
    <nav aria-label="Pagination" className={cx("ml-pagination", className)}>
      <ol className="ml-pagination-list">
        <li>
          <button type="button" aria-label="Go to previous page" disabled={current === 1} className="ml-pagination-button" onClick={() => go(current - 1)}>
            <IconChevronLeft aria-hidden="true" size="1em" /><span className="ml-pagination-button-label">Previous</span>
          </button>
        </li>
        {pages(current, total, siblings).map((item) => typeof item === "number" ? (
          <li key={item}>
            <button
              type="button"
              aria-label={`Go to page ${item}`}
              aria-current={item === current ? "page" : undefined}
              data-state={item === current ? "active" : "inactive"}
              className="ml-pagination-button"
              onClick={() => go(item)}
            >{item}</button>
          </li>
        ) : <li key={item}><span aria-hidden="true" className="ml-pagination-ellipsis">…</span></li>)}
        <li>
          <button type="button" aria-label="Go to next page" disabled={current === total} className="ml-pagination-button" onClick={() => go(current + 1)}>
            <span className="ml-pagination-button-label">Next</span><IconChevronRight aria-hidden="true" size="1em" />
          </button>
        </li>
      </ol>
    </nav>
  );
}
