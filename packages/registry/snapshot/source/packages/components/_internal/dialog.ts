import * as React from "react";
import { lockScroll } from "@mlola-ui/behavior/document";
import { usePortalNode } from "./floating";
import { useLatest } from "./react";

const FOCUSABLE =
  'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),iframe,[contenteditable="true"],[tabindex]:not([tabindex="-1"])';

type HiddenSnapshot = {
  count: number;
  inert: boolean;
  ariaHidden: string | null;
};

const hiddenElements = new Map<HTMLElement, HiddenSnapshot>();

function hideBackground(layer: HTMLElement) {
  const children = Array.from(document.body.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement && child !== layer
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

// Safari does not focus a button it clicks, so when a dialog opens with
// nothing focused, focus returns on close to the control just pressed.
let lastPressed: HTMLElement | null = null;
let pressedAt = 0;
let tracking = false;
function trackPresses() {
  if (tracking) return;
  tracking = true;
  document.addEventListener(
    "pointerdown",
    (event) => {
      lastPressed = event.target instanceof Element ? event.target.closest<HTMLElement>(FOCUSABLE) : null;
      pressedAt = performance.now();
    },
    true,
  );
}

/**
 * A modal layer: renders into <body>, hides and freezes everything else,
 * traps focus, closes on Escape, and returns focus on close. Focus moves in
 * the same commit that opens the layer, so it is already inside when the
 * render returns (in a browser and in a test alike).
 *
 * The component renders its layer root with `data-ml-portal` and the panel
 * inside it.
 */
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
  const portal = usePortalNode();
  const closeRef = useLatest(onClose);

  React.useEffect(trackPresses, []);

  React.useLayoutEffect(() => {
    const panel = panelRef.current;
    const layer = panel?.closest<HTMLElement>("[data-ml-portal]");
    if (!open || !panel || !layer) return;
    const active = document.activeElement;
    // Something inside that focused itself (autoFocus) is not where focus came from.
    const restoreTarget =
      active instanceof HTMLElement && active !== document.body && !panel.contains(active)
        ? active
        : lastPressed?.isConnected && performance.now() - pressedAt < 2000
          ? lastPressed
          : null;
    const releaseScroll = lockScroll();
    const restoreBackground = hideBackground(layer);
    const focusPanel = () => {
      const first = panel.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel).focus();
    };
    if (!panel.contains(document.activeElement)) focusPanel();

    const onKeyDown = (event: KeyboardEvent) => {
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
      if (!(event.target instanceof Element) || panel.contains(event.target)) return;
      // Menus and lists opened from inside the dialog live in their own layer on <body>; focus may go there.
      const other = event.target.closest("[data-ml-portal]");
      if (other && other !== layer) return;
      focusPanel();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      releaseScroll();
      restoreBackground();
      if (restoreTarget?.isConnected) restoreTarget.focus();
    };
  }, [open, portal, closeOnEscape, panelRef, closeRef]);

  return portal;
}
