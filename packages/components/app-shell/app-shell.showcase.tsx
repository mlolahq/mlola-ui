"use client";

import * as React from "react";
import { IconBell, IconHome, IconLayers, IconPlus, IconSettings, IconUser } from "@mlola-ui/icons";
import { Avatar } from "../avatar/avatar";
import { AppShell, AppShellMenuButton, Sidebar, SidebarItem, SidebarSection } from "./app-shell";

export default function AppShellShowcase() {
  const [page, setPage] = React.useState("Home");
  const item = (label: string, icon: React.ReactNode, count?: number) => <SidebarItem label={label} icon={icon} count={count} current={page === label} onClick={() => setPage(label)} />;
  return (
    <div className="ml-app-shell-showcase">
      <section className="ml-showcase-group">
        <h3 className="ml-showcase-group-label">Resize or fold the sidebar; on a phone it becomes a drawer</h3>
        <div className="ml-app-shell-showcase-frame">
          <AppShell
            label="Workspace"
            sidebar={
              <Sidebar
                header={
                  <>
                    <span className="ml-app-shell-showcase-mark">A</span>
                    <strong>Acme</strong>
                  </>
                }
                footer={
                  <>
                    <Avatar size="sm" name="Fikri Firdaus" status="online" />
                    <span>Fikri Firdaus</span>
                  </>
                }
              >
                <SidebarSection>
                  {item("Home", <IconHome size="1em" />)}
                  {item("Inbox", <IconBell size="1em" />, 4)}
                </SidebarSection>
                <SidebarSection title="Projects" collapsible>
                  {item("Website", <IconLayers size="1em" />, 12)}
                  <SidebarItem label="Mobile app" icon={<IconLayers size="1em" />} current={page === "Mobile app"} onClick={() => setPage("Mobile app")} actions={<button type="button" className="ml-app-shell-menu" aria-label="Add to Mobile app"><IconPlus aria-hidden="true" size="0.9em" /></button>} />
                </SidebarSection>
                <SidebarSection title="Account" collapsible defaultOpen={false}>
                  {item("Profile", <IconUser size="1em" />)}
                  {item("Settings", <IconSettings size="1em" />)}
                </SidebarSection>
              </Sidebar>
            }
          >
            <div className="ml-app-shell-showcase-page">
              <header>
                <AppShellMenuButton />
                <h4>{page}</h4>
              </header>
              <p>The page. Drag the edge of the sidebar to resize it, or drag it closed to fold it; the menu button appears when the sidebar is out of view.</p>
            </div>
          </AppShell>
        </div>
      </section>
    </div>
  );
}
