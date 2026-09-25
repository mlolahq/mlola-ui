"use client";

import { Avatar, AvatarGroup } from "./avatar";
import type { AvatarSize, AvatarStatus } from "./avatar";

export default function Showcase() {
  const sizes: AvatarSize[] = ["xs", "sm", "md", "lg", "xl"];
  const statuses: AvatarStatus[] = ["online", "away", "busy", "offline"];
  return (
    <div className="ml-avatar-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Sizes</h3>
        <div className="ml-showcase-row">
          {sizes.map((size) => (
            <Avatar key={size} name="Amina Yusuf" size={size} />
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Presence</h3>
        <div className="ml-showcase-row">
          {statuses.map((status) => (
            <Avatar key={status} name="Sara Kim" status={status} />
          ))}
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Fallbacks</h3>
        <p className="ml-showcase-note">Initials are derived from the name; a broken image falls back to them.</p>
        <div className="ml-showcase-row">
          <Avatar name="Lena Fischer" />
          <Avatar name="Hugo" />
          <Avatar />
          <Avatar name="Jonas Weber" src="https://example.invalid/missing.png" />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Group with overflow</h3>
        <div className="ml-showcase-row">
          <AvatarGroup max={4}>
            <Avatar name="Amina Yusuf" />
            <Avatar name="Sara Kim" />
            <Avatar name="Lena Fischer" />
            <Avatar name="Hugo Diaz" />
            <Avatar name="Jonas Weber" />
            <Avatar name="Ada Obi" />
          </AvatarGroup>
        </div>
      </section>
    </div>
  );
}
