# Spinner Component Contract

## Purpose

Work in progress whose end is unknown: a search, a save, a connection. When
the end is known, use Progress instead; when the layout of the result is
known, use Skeleton.

## Anatomy

A single `span.ml-spinner`: a ring in the current text color with one bright
arc. With a `label`, it is a status region whose visually hidden text names
what is loading; without one, it is decorative.

## Public API

- `size`: `sm` (0.875rem) | `md` (1rem, default) | `lg` (1.5rem)
- `label`: spoken text, e.g. "Loading results". Omit it when visible text
  beside the spinner already says what is happening.
- Forwards its ref and any `span` attribute.

## Semantic states

It has none of its own: it exists only while work is in progress. Remove it
when the work ends.

## Keyboard and accessibility

- Not focusable.
- With `label`: `role="status"`, so the text is announced politely once.
- Without `label`: `aria-hidden="true"`; the surrounding text (a busy
  button's "Saving…") carries the meaning.
- Forced colors: the ring is `CanvasText` and the arc `Highlight`.
- Reduced motion: the engine's motion layer stops the rotation; the ring
  and arc still mark the place.

## Theme channels

Color comes from `currentColor` only; motion uses the engine's `ml-spin`
keyframes. No token is written by hand.

## Responsive behavior

Fixed size; it never stretches. Inline, it sits on the text baseline.

## Dependencies

None. Button and Toast use it for their busy state.

## Verification

- Every size renders in every theme and mode (registry render coverage).
- axe finds no violation with and without a label (accessibility sweep).
- Its markup passes `check_markup` and renders without a framework.
