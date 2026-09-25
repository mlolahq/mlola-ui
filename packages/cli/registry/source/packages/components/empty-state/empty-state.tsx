import * as React from "react";
import { cx } from "../_internal/react";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** An icon or small illustration. */
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** The way forward: usually one primary action and one secondary. */
  actions?: React.ReactNode;
  /** "page" centres in a large area; "inline" sits inside a card or table. */
  size?: "inline" | "page";
}

/**
 * What a screen says when there is nothing to show yet: why, and what to do
 * next. Never a blank area and never an apology without a way forward.
 */
export function EmptyState({ icon, title, description, actions, size = "inline", className, ...props }: EmptyStateProps) {
  return (
    <section className={cx("ml-empty", className)} data-size={size} {...props}>
      {icon ? (
        <span className="ml-empty-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <h3 className="ml-empty-title">{title}</h3>
      {description ? <p className="ml-empty-description">{description}</p> : null}
      {actions ? <div className="ml-empty-actions">{actions}</div> : null}
    </section>
  );
}
