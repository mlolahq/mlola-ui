/**
 * Document-level effects that both runtimes need, exactly once.
 *
 * A React modal and a framework-free sheet can be open at the same time, and
 * a page can load two copies of this package. They must still agree on one
 * scroll lock, so its state lives on <html> (under a registered symbol), not
 * in a module variable that each copy would have its own of.
 */

const STATE = Symbol.for("mlola.scrollLock");

/**
 * Stop the page from scrolling behind an overlay, without the page moving.
 *
 * Hiding overflow removes a classic scrollbar, which widens the viewport and
 * shifts everything sideways. The lock keeps the scrollbar's space instead:
 * `scrollbar-gutter: stable`, or padding where the page still widened. While locked,
 * <html> carries `data-ml-scroll-locked` and `--ml-scroll-lock-offset` (the
 * padding added, 0px with a gutter) for any fixed element that must follow.
 *
 * Locks nest. Returns a release function; calling it twice is harmless.
 */
export function lockScroll(doc = globalThis.document) {
  if (!doc?.documentElement) return () => {};
  const root = doc.documentElement;
  const state = root[STATE] ?? (root[STATE] = { count: 0, saved: null });

  if (state.count === 0) {
    const view = doc.defaultView;
    const width = root.clientWidth;
    state.saved = {
      overflow: root.style.overflow,
      scrollbarGutter: root.style.scrollbarGutter,
      paddingInlineEnd: root.style.paddingInlineEnd,
    };
    root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";
    // Not every engine keeps the gutter for every scrollbar (custom
    // scrollbars, older engines), so measure instead of trusting it: if the
    // page still widened, give the lost width back as padding.
    const widened = root.clientWidth - width;
    let offset = 0;
    if (widened > 0 && view) {
      root.style.scrollbarGutter = state.saved.scrollbarGutter;
      const current = Number.parseFloat(view.getComputedStyle(root).paddingInlineEnd) || 0;
      root.style.paddingInlineEnd = `${current + widened}px`;
      offset = widened;
    }
    root.style.setProperty("--ml-scroll-lock-offset", `${offset}px`);
    root.setAttribute("data-ml-scroll-locked", "");
  }
  state.count += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    state.count = Math.max(0, state.count - 1);
    if (state.count > 0 || !state.saved) return;
    root.style.overflow = state.saved.overflow;
    root.style.scrollbarGutter = state.saved.scrollbarGutter;
    root.style.paddingInlineEnd = state.saved.paddingInlineEnd;
    root.style.removeProperty("--ml-scroll-lock-offset");
    root.removeAttribute("data-ml-scroll-locked");
    state.saved = null;
  };
}
