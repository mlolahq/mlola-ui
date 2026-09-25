"use client";

import * as React from "react";
import { cx } from "../_internal/react";

type TableSize = "sm" | "md";
type TableAlign = "left" | "center" | "right";
export type SortedState = "asc" | "desc" | false;
interface Sortable { sorted: SortedState; onToggle: () => void; label?: string; }
interface TableProps extends React.HTMLAttributes<HTMLDivElement> { size?: TableSize; striped?: boolean; }
const Table = React.forwardRef<HTMLDivElement, TableProps>(
  ({ size = "md", striped = false, className, children, ...props }, ref) => (
    <div ref={ref} className={cx("ml-table-container", className)} {...props}>
      <table data-size={size} data-striped={striped ? "" : undefined} className="ml-table">{children}</table>
    </div>
  )
);
Table.displayName = "Table";
const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => <caption ref={ref} className={cx("ml-table-caption", className)} {...props} />
);
TableCaption.displayName = "TableCaption";
const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cx("ml-table-header", className)} {...props} />
);
TableHeader.displayName = "TableHeader";
const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tbody ref={ref} className={cx("ml-table-body", className)} {...props} />
);
TableBody.displayName = "TableBody";
const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <tfoot ref={ref} className={cx("ml-table-footer", className)} {...props} />
);
TableFooter.displayName = "TableFooter";
const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => <tr ref={ref} className={cx("ml-table-row", className)} {...props} />
);
TableRow.displayName = "TableRow";

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: TableAlign;
  sortable?: Sortable;
}
const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ align = "left", sortable, scope = "col", className, children, ...props }, ref) => {
    const ariaSort = !sortable ? undefined : sortable.sorted === "asc" ? "ascending" : sortable.sorted === "desc" ? "descending" : "none";
    return (
      <th ref={ref} scope={scope} aria-sort={ariaSort} data-align={align} className={cx("ml-table-head", className)} {...props}>
        {sortable ? (
          <button type="button" onClick={sortable.onToggle} aria-label={sortable.label ?? `Sort by ${String(children)}`} className="ml-table-sort">
            <span>{children}</span><span aria-hidden="true" data-sort={sortable.sorted || "none"} className="ml-table-sort-icon">{sortable.sorted === "asc" ? "↑" : sortable.sorted === "desc" ? "↓" : "↕"}</span>
          </button>
        ) : children}
      </th>
    );
  }
);
TableHead.displayName = "TableHead";
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> { align?: TableAlign; numeric?: boolean; }
const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ align = "left", numeric = false, className, ...props }, ref) => <td ref={ref} data-align={numeric ? "right" : align} data-numeric={numeric ? "" : undefined} className={cx("ml-table-cell", className)} {...props} />
);
TableCell.displayName = "TableCell";

export { Table, TableCaption, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell };
export type { TableProps, TableHeadProps, TableCellProps, TableSize, TableAlign, Sortable };
