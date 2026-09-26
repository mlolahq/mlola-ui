"use client";

import * as React from "react";
import { cx } from "../_internal/react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarStatus = "online" | "offline" | "away" | "busy";
const initials = (name?: string) => {
  const words = name?.replace(/[^\p{L}\p{N}\s]/gu, "").trim().split(/\s+/).filter(Boolean) ?? [];
  return words.length > 1 ? `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase() : words[0]?.slice(0, 2).toUpperCase() ?? "?";
};
interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
}
const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, alt, name, size = "md", status, className, ...props }, ref) => {
    const [failed, setFailed] = React.useState(false);
    React.useEffect(() => setFailed(false), [src]);
    const label = alt ?? name ?? "Avatar";
    // alt="" marks the avatar as decorative, as it is for images: the name is
    // already on screen beside it and must not be read twice.
    const decorative = alt === "";
    return (
      <span ref={ref} data-size={size} className={cx("ml-avatar-root", className)} {...props}>
        <span className="ml-avatar">
          {src && !failed
            ? <img src={src} alt={label} loading="lazy" className="ml-avatar-image" onError={() => setFailed(true)} />
            : <span role={decorative ? undefined : "img"} aria-label={decorative ? undefined : label} aria-hidden={decorative || undefined} className="ml-avatar-fallback">{initials(name)}</span>}
        </span>
        {status ? <span role="status" aria-label={`${label} is ${status}`} data-status={status} className="ml-avatar-status" /> : null}
      </span>
    );
  }
);
Avatar.displayName = "Avatar";

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> { max?: number; }
const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ max = 4, className, children, ...props }, ref) => {
    const items = React.Children.toArray(children);
    const visible = items.slice(0, Math.max(0, max));
    const overflow = items.length - visible.length;
    return (
      <div ref={ref} role="group" aria-label={`Avatar group, ${items.length} people`} className={cx("ml-avatar-group", className)} {...props}>
        {visible.map((child, index) => <span key={index} className="ml-avatar-group-item">{child}</span>)}
        {overflow ? (
          <span className="ml-avatar-overflow">
            <span aria-hidden="true">+{overflow}</span>
            <span className="ml-visually-hidden">{`${overflow} more ${overflow === 1 ? "person" : "people"}`}</span>
          </span>
        ) : null}
      </div>
    );
  }
);
AvatarGroup.displayName = "AvatarGroup";
export { Avatar, AvatarGroup };
