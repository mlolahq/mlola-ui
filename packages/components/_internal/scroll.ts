/**
 * Bring `element` into view inside `scroller` only. Unlike scrollIntoView, it
 * never scrolls the page or any other ancestor, so a component that follows
 * its active item cannot move the reader's place on first render.
 */
export function revealIn(scroller: HTMLElement | null, element: HTMLElement | null, axis: "x" | "y" = "y") {
  if (!scroller || !element) return;
  const box = scroller.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  if (axis === "x") {
    if (rect.left < box.left) scroller.scrollLeft -= box.left - rect.left;
    else if (rect.right > box.right) scroller.scrollLeft += rect.right - box.right;
  } else if (rect.top < box.top) scroller.scrollTop -= box.top - rect.top;
  else if (rect.bottom > box.bottom) scroller.scrollTop += rect.bottom - box.bottom;
}
