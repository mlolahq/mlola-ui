# Browser Support

Mlola targets current stable Chromium, Firefox, and Safari, including their
mobile variants. Embedded webviews and older enterprise browsers receive the
baseline component experience where practical.

Every pull request runs the rendering, keyboard and framework-free suites in
Chromium, Firefox and WebKit (Safari's engine). Pixel snapshots and the axe
sweep run in Chromium, since they check the markup rather than the engine.

## Progressive enhancement

The baseline requires:

- CSS custom properties
- cascade layers
- modern flex and grid
- semantic HTML and standard ARIA
- Pointer Events

Enhancements are feature-detected:

- OKLCH and `color-mix()` receive conservative semantic fallbacks.
- Container queries fall back to shell media queries.
- Popover and Anchor Positioning fall back to Mlola's dismissable-layer and
  viewport positioning logic.
- View Transitions are decorative and never required for navigation.
- `@starting-style` improves entry motion but absence does not hide content.
- `<dialog>` is used only where its browser and assistive-technology behavior
  satisfies the Mlola overlay contract.

## User preference handling

`prefers-reduced-motion: reduce` disables spatial movement, parallax, tilt,
bounce, and decorative stagger. State changes remain immediate or use a short
opacity dissolve.

`forced-colors: active` removes texture, blur, translucent material, and
decorative shadow. System colors, real borders, and visible focus outlines
replace them.

Save-Data and connection information may reduce optional assets, but they are
never the only path to essential content because browser support is incomplete.

## Known constraints

- Native Popover does not supply menu, listbox, or combobox semantics.
- Native Dialog does not remove the need for focus and screen-reader testing.
- Anchor Positioning is treated as an enhancement for older webviews.
- Variable font axes differ by font; every theme includes a static
  fallback stack.
- Exit animation from the top layer differs across engines and may snap when
  interoperable overlay transitions are unavailable.

The preview reference corpus is the compatibility source of truth. A capability
is considered supported only after keyboard, pointer, touch, zoom, and
assistive-technology verification.
