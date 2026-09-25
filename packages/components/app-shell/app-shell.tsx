"use client";

import * as React from "react";
import { IconChevronDown, IconMenu } from "@mlola-ui/icons";
import { Resizable } from "../resizable/resizable";
import { Sheet } from "../sheet/sheet";
import { cx } from "../_internal/react";

interface ShellContext {
  /** Fold the sidebar on wide screens; open the drawer on narrow ones. */
  toggle: () => void;
  folded: boolean;
  narrow: boolean;
  /** Close the drawer, after a navigation on a phone. */
  closeDrawer: () => void;
}

const Context = React.createContext<ShellContext>({ toggle: () => undefined, folded: false, narrow: false, closeDrawer: () => undefined });

/** The shell's controls, for a menu button in a page header or a link that should close the drawer. */
export const useAppShell = () => React.useContext(Context);

function useNarrow(query: string) {
  return React.useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", notify);
      return () => list.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  /** Names the navigation region and the drawer. */
  label?: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  /** Remembers the width and the fold between visits. */
  storageKey?: string;
  /** Below this width the sidebar becomes a drawer. */
  drawerQuery?: string;
  className?: string;
}

/**
 * The frame of an app: a sidebar that resizes and folds, and the page beside
 * it; on phones the sidebar becomes a drawer. Anything inside can reach the
 * controls with `useAppShell`, and `AppShellMenuButton` shows itself only
 * when the sidebar is out of view.
 */
export function AppShell({ sidebar, children, label = "Navigation", defaultWidth = 248, minWidth = 200, maxWidth = 360, storageKey, drawerQuery = "(max-width: 48rem)", className }: AppShellProps) {
  const narrow = useNarrow(drawerQuery);
  const [folded, setFolded] = React.useState(false);
  const [drawer, setDrawer] = React.useState(false);
  const context = React.useMemo<ShellContext>(
    () => ({ toggle: () => (narrow ? setDrawer(true) : setFolded((value) => !value)), folded, narrow, closeDrawer: () => setDrawer(false) }),
    [folded, narrow],
  );
  React.useEffect(() => {
    if (!narrow) setDrawer(false);
  }, [narrow]);
  return (
    <Context.Provider value={context}>
      <div className={cx("ml-app-shell", className)} data-folded={folded || undefined} data-narrow={narrow || undefined}>
        <Resizable
          className="ml-app-shell-frame"
          units="pixels"
          defaultSize={defaultWidth}
          min={minWidth}
          max={maxWidth}
          collapsible
          collapsed={folded}
          onCollapsedChange={setFolded}
          storageKey={storageKey}
          label={`Resize ${label.toLowerCase()}`}
          first={
            <nav className="ml-app-shell-sidebar" aria-label={label}>
              {sidebar}
            </nav>
          }
          second={<div className="ml-app-shell-main">{children}</div>}
        />
        <Sheet open={drawer} onClose={() => setDrawer(false)} side="left" size="sm" title={label} className="ml-app-shell-drawer">
          <nav className="ml-app-shell-sidebar" aria-label={label}>
            {sidebar}
          </nav>
        </Sheet>
      </div>
    </Context.Provider>
  );
}

/** A menu button that appears only when the sidebar is folded or on a phone. */
export function AppShellMenuButton({ label = "Open navigation", className }: { label?: string; className?: string }) {
  const { toggle, folded, narrow } = useAppShell();
  if (!folded && !narrow) return null;
  return (
    <button type="button" className={cx("ml-app-shell-menu", className)} aria-label={label} onClick={toggle}>
      <IconMenu aria-hidden="true" size="1.05em" />
    </button>
  );
}

export function Sidebar({ header, footer, children, className }: { header?: React.ReactNode; footer?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("ml-sidebar", className)}>
      {header ? <div className="ml-sidebar-header">{header}</div> : null}
      <div className="ml-sidebar-body">{children}</div>
      {footer ? <div className="ml-sidebar-footer">{footer}</div> : null}
    </div>
  );
}

/** A titled group of items; with `collapsible`, the title folds it. */
export function SidebarSection({ title, collapsible = false, defaultOpen = true, children }: { title?: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const id = React.useId();
  return (
    <section className="ml-sidebar-section">
      {title ? (
        collapsible ? (
          <button type="button" className="ml-sidebar-title" data-collapsible="" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
            {title}
            <IconChevronDown aria-hidden="true" size="0.85em" className="ml-sidebar-chevron" />
          </button>
        ) : (
          <h2 className="ml-sidebar-title">{title}</h2>
        )
      ) : null}
      <ul id={id} className="ml-sidebar-list" hidden={!open}>
        {children}
      </ul>
    </section>
  );
}

export interface SidebarItemProps {
  label: string;
  icon?: React.ReactNode;
  /** A number at the end: unread, open, due. */
  count?: number;
  /** The page being shown. */
  current?: boolean;
  href?: string;
  onClick?: () => void;
  /** Controls revealed on hover, such as a + or a menu. */
  actions?: React.ReactNode;
}

export function SidebarItem({ label, icon, count, current, href, onClick, actions }: SidebarItemProps) {
  const { narrow, closeDrawer } = useAppShell();
  const content = (
    <>
      {icon ? (
        <span className="ml-sidebar-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="ml-sidebar-label">{label}</span>
      {count ? <span className="ml-sidebar-count">{count}</span> : null}
    </>
  );
  const choose = () => {
    onClick?.();
    if (narrow) closeDrawer();
  };
  return (
    <li className="ml-sidebar-entry">
      {href ? (
        <a className="ml-sidebar-item" href={href} aria-current={current ? "page" : undefined} onClick={choose}>
          {content}
        </a>
      ) : (
        <button type="button" className="ml-sidebar-item" aria-current={current ? "page" : undefined} onClick={choose}>
          {content}
        </button>
      )}
      {actions ? <span className="ml-sidebar-actions">{actions}</span> : null}
    </li>
  );
}
