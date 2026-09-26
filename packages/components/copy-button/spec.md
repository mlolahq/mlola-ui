# Copy Button Component Contract

## Purpose

Copy a value to the clipboard and confirm it: an API key, a link, a command.
The behavior (`useCopy` in `_internal/clipboard.ts`) is shared with every
copy control in the library, so all of them succeed, fail and confirm alike.

## Anatomy

A Button (`ml-button ml-copy-button`) holding a copy icon, an optional text
label, and a visually hidden `role="status"` region for the outcome.

## Public API

- `value`: the text, or a function that returns it when the button is pressed
- `label`: the action, e.g. "Copy link". The accessible name and tooltip of
  an icon-only button (default "Copy").
- `copiedLabel` (default "Copied"), `errorLabel`: the spoken outcomes
- `onCopied(copied: boolean)`: after each attempt
- Every Button prop except `onClick` and `loading`. `variant` defaults to
  `secondary`; `size` to `icon` without children, `md` with them.

## Semantic states

`data-status`: absent at rest, `success` for a moment after copying, `error`
when the browser refuses. It returns to rest after 1.6 s.

## Keyboard and accessibility

- A native button: Enter and Space copy.
- The outcome is announced through the status region, because a label that
  changes on a focused button is not reliably spoken.
- An icon-only button is named by `label`; a text button by its text.
- A refusal is announced with what to do instead.

## Theme channels

Button's recipe; the failure color is `--ml-danger-text` on non-filled
variants. The confirming check icon draws itself with the glyph animation,
removed under reduced motion.

## Responsive behavior

Same as Button: the icon size is a full control height, above the 24 px
target minimum.

## Dependencies

Button, `@mlola-ui/icons`.

## Verification

- Renders in every theme and mode, and passes the accessibility sweep.
- `check_markup` accepts its markup; the HTML example renders with no
  framework.
