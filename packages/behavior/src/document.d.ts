/**
 * Lock page scrolling behind an overlay without shifting the layout. Locks
 * nest and are shared by every copy of the package on the page. Returns an
 * idempotent release function.
 */
export function lockScroll(doc?: Document): () => void;
