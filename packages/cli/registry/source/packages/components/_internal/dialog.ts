import * as React from "react";
import { lockScroll } from "@mlola-ui/behavior/document";

const FOCUSABLE =
  'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),iframe,[contenteditable="true"],[tabindex]:not([tabindex="-1"])';

type HiddenSnapshot = {
  count: number;
  inert: boolean;
  ariaHidden: string | null;
};

const hiddenElements = new Map<HTMLElement, HiddenSnapshot>();

function hideBackground(portal: HTMLElement) {
  const children = Array.from(document.body.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement && child !== portal
  );
  for (const element of children) {
    const existing = hiddenElements.get(element);
    if (existing) {
      existing.count += 1;
      continue;
    }
    hiddenElements.set(element, {
      count: 1,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    });
    element.inert = true;
    element.setAttribute("aria-hidden", "true");
  }
  return () => {
    for (const element of children) {
      const snapshot = hiddenElements.get(element);
      if (!snapshot) continue;
      snapshot.count -= 1;
      if (snapshot.count > 0) continue;
      element.inert = snapshot.inert;
      if (snapshot.ariaHidden === null) element.removeAttribute("aria-hidden");
      else element.setAttribute("aria-hidden", snapshot.ariaHidden);
      hiddenElements.delete(element);
    }
  };
}

export function useDialogLayer({
  open,
  onClose,
  closeOnEscape,
  panelRef,
}: {
  open: boolean;
  onClose: () => void;
  closeOnEscape: boolean;
  panelRef: React.RefObject<HTMLElement | null>;
}) {
  const [portal, setPortal] = React.useState<HTMLDivElement | null>(null);
  const restoreFocusRef = React.useRef<HTMLElement | null>(null);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;

  React.useEffect(() => {
    const node = document.createElement("div");
    node.setAttribute("data-ml-portal", "");
    document.body.appendChild(node);
    setPortal(node);
    return () => {
      node.remove();
      setPortal(null);
    };
  }, []);

  React.useEffect(() => {
    if (!open || !portal) return;
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const releaseScroll = lockScroll();
    const restoreBackground = hideBackground(portal);
    const focusPanel = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    };
    const frame = requestAnimationFrame(focusPanel);

    const onKeyDown = (event: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      if (event.key === "Escape" && closeOnEscape) {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) =>
          !element.hidden &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.tabIndex >= 0
      );
      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      const panel = panelRef.current;
      if (!panel || !(event.target instanceof Element) || panel.contains(event.target)) return;
      // Menus and lists opened from inside the dialog live in their own layer on <body>; focus may go there.
      const layer = event.target.closest("[data-ml-portal]");
      if (layer && layer !== portal) return;
      focusPanel();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      releaseScroll();
      restoreBackground();
      const target = restoreFocusRef.current;
      if (target?.isConnected) requestAnimationFrame(() => target.focus());
    };
  }, [open, portal, closeOnEscape, panelRef]);

  return portal;
}
