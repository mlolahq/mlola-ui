"use client";

import { Breadcrumb } from "./breadcrumb";

export default function Showcase() {
  return (
    <div className="ml-breadcrumb-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Default</h3>
        <Breadcrumb
          items={[
            { label: "Home", href: "#" },
            { label: "Components", href: "#" },
            { label: "Breadcrumb" },
          ]}
        />
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Deep path</h3>
        <Breadcrumb
          items={[
            { label: "Workspace", href: "#" },
            { label: "Projects", href: "#" },
            { label: "Platform", href: "#" },
            { label: "Deployments", href: "#" },
            { label: "Build 4821" },
          ]}
        />
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Custom separator</h3>
        <div className="ml-showcase-stack">
          <Breadcrumb
            separator="/"
            items={[{ label: "docs", href: "#" }, { label: "guides", href: "#" }, { label: "theming" }]}
          />
          <Breadcrumb
            separator="·"
            items={[{ label: "Library", href: "#" }, { label: "Blocks", href: "#" }, { label: "Pricing tiers" }]}
          />
        </div>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Single level</h3>
        <Breadcrumb items={[{ label: "Dashboard" }]} />
      </section>
    </div>
  );
}
