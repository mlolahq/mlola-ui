# Manual accessibility checklist

Automation covers keyboard reach, focus order, live regions, and contrast
math. It cannot cover what a screen reader actually says. This is the human
pass, run before a release and recorded here. Copy the table into the release
PR and fill it in; a release without a completed table is not signed off.

## How to run

1. macOS: VoiceOver (`Cmd+F5`). Windows: NVDA. Use the browser you ship to.
2. Load a preview route from the workbench (`/workbench`) for each component
   below, then use the standalone route (`/preview/component/<name>`).
3. Traverse with `Tab`, arrows, `Escape`, and the screen reader's own reading
   keys. Record the actual announcement, not a summary.
4. Repeat once with `prefers-reduced-motion: reduce` and once in forced-colors
   mode (macOS: Increase contrast; Windows: High contrast).

## Required routes

| Route | What to confirm |
| --- | --- |
| `component/modal` | Dialog is announced, focus is trapped, Escape returns focus to the trigger. |
| `component/sheet` | Same as modal, plus the panel edge is described. |
| `component/select` | Combobox announces expanded state, the active option, and the chosen value. |
| `component/tabs` | Tab list announces position and selected tab; panels are labelled. |
| `component/toast` | Status is announced once and not repeated on every render. |
| `component/accordion` | Trigger announces expanded/collapsed; the panel is reachable. |
| `component/carousel` | Slide position is announced; dots are reachable and named. |

## Results

| Date | Runner | OS / AT | Browser | Route | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| _pending_ | | | | | | |

## Why this is manual

A headless browser has no screen reader, and an accessibility tree assertion is
not the same as speech. `npm run check` proves the mechanics; this table records
the experience.
