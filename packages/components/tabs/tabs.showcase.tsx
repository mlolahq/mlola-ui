"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import type { TabsVariant } from "./tabs";

export default function Showcase() {
  const variants: TabsVariant[] = ["default", "pills", "enclosed"];
  return (
    <div className="ml-tabs-showcase">
      {variants.map((variant) => (
        <section key={variant} className="ml-showcase-group">
          <h3 className="ml-showcase-group-label">{variant}</h3>
          <Tabs defaultValue="overview" variant={variant}>
            <TabsList aria-label={`Project sections, ${variant}`}>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">Deployment health, traffic, and recent errors at a glance.</TabsContent>
            <TabsContent value="activity">Every deploy, rollback, and configuration change in order.</TabsContent>
            <TabsContent value="settings">Domains, environment variables, and access control.</TabsContent>
          </Tabs>
        </section>
      ))}

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Vertical</h3>
        <Tabs defaultValue="general" orientation="vertical">
          <TabsList aria-label="Settings sections">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          <TabsContent value="general">Workspace name, slug, and default theme.</TabsContent>
          <TabsContent value="members">Invite teammates and assign roles.</TabsContent>
          <TabsContent value="billing">Plan, payment method, and invoices.</TabsContent>
        </Tabs>
      </section>

      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Disabled tab</h3>
        <Tabs defaultValue="live">
          <TabsList aria-label="Environments">
            <TabsTrigger value="live">Production</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="archive" disabled>Archived</TabsTrigger>
          </TabsList>
          <TabsContent value="live">Serving 12.4k requests per minute.</TabsContent>
          <TabsContent value="preview">Three open preview deployments.</TabsContent>
          <TabsContent value="archive">Unavailable.</TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
