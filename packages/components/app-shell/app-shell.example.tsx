import { IconHome, IconMail, IconSettings } from "@mlola-ui/icons";
import { AppShell, Sidebar, SidebarItem, SidebarSection } from "./app-shell";

export default function Example() {
  return (
    <div style={{ height: 320 }}>
      <AppShell
        label="Workspace"
        sidebar={
          <Sidebar header={<strong>Atlas</strong>}>
            <SidebarSection title="Workspace">
              <SidebarItem label="Home" icon={<IconHome size="1em" />} href="/" current />
              <SidebarItem label="Inbox" icon={<IconMail size="1em" />} href="/inbox" count={3} />
              <SidebarItem label="Settings" icon={<IconSettings size="1em" />} href="/settings" />
            </SidebarSection>
          </Sidebar>
        }
      >
        <main>Home</main>
      </AppShell>
    </div>
  );
}
