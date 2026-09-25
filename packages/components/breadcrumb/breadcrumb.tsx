"use client";

import * as React from "react";
import { cx } from "../_internal/react";
import { IconChevronRight } from "@mlola-ui/icons";

export type BreadcrumbItemType = { label: string; href?: string };
type BreadcrumbProps = { items: BreadcrumbItemType[]; separator?: React.ReactNode; className?: string };

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.OlHTMLAttributes<HTMLOListElement>>(
  ({ className, ...props }, ref) => <ol ref={ref} className={cx("ml-breadcrumb-list", className)} {...props} />
);
BreadcrumbList.displayName = "BreadcrumbList";
const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => <li ref={ref} className={cx("ml-breadcrumb-item", className)} {...props} />
);
BreadcrumbItem.displayName = "BreadcrumbItem";
const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>(
  ({ className, ...props }, ref) => <a ref={ref} className={cx("ml-breadcrumb-link", className)} {...props} />
);
BreadcrumbLink.displayName = "BreadcrumbLink";
function BreadcrumbPage({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span aria-current="page" className={cx("ml-breadcrumb-page", className)} {...props} />;
}
function BreadcrumbSeparator({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <span aria-hidden="true" className={cx("ml-breadcrumb-separator", className)}>{children ?? <IconChevronRight aria-hidden="true" size="1em" />}</span>;
}
function BreadcrumbEllipsis({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("ml-breadcrumb-ellipsis", className)}>…</span>;
}

export function Breadcrumb({ items, separator, className }: BreadcrumbProps) {
  const last = items.length - 1;
  const collapse = items.length > 3;
  return (
    <nav aria-label="Breadcrumb" className={cx("ml-breadcrumb", className)}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const current = index === last;
          const middle = index > 0 && index < last;
          return (
            <React.Fragment key={`${item.label}-${index}`}>
              {collapse && index === 1 ? (
                <BreadcrumbItem aria-hidden="true" data-collapse-indicator="">
                  <BreadcrumbEllipsis /><BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
                </BreadcrumbItem>
              ) : null}
              <BreadcrumbItem data-collapsible={middle && collapse ? "" : undefined}>
                {current || !item.href
                  ? <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  : <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>}
                {!current ? <BreadcrumbSeparator>{separator}</BreadcrumbSeparator> : null}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </nav>
  );
}
export { BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis };
