# Dial Component Contract

## Purpose

A value chosen by turning a knob, with a press on the ring to jump, a hold to turn by finger, Escape to undo a turn and the keys of a slider

## Source

`packages/components/dial/dial.tsx`

## Anatomy and composition

This source owns its semantic DOM, state machine, keyboard behavior, focus lifecycle, and stable `data-*` hooks. Shared interaction decisions come from `@mlola-ui/behavior/logic`, so the React and framework-free renderers cannot drift: the 270 degree sweep and where a value sits on it (`dialAngle`), the value a press on the ring points to (`dialPositionAt`), how a turn moves the value and stops at the ends (`dialTurn`), the arc's path (`dialArc`), the keys (`sliderValueForKey`) and the finger's hold (`touchHold`).

The control is the round face, `role="slider"`, at least 6rem across. A press on the ring around the knob sets the value it points to; a press on the knob turns it from where it is, by the angle the pointer turns, and a turn past an end stops there instead of leaping across the gap at the bottom to the other end. A mouse or pen turns at once. A finger holds still for a moment first (`touchHold`), so a finger moving sooner scrolls the page and changes nothing; once it has held, it turns the dial and the page stays. A tap on the ring sets the value. Escape during a turn puts back the value the turn began with, and is marked used, in the capture phase, only while turning.

The notch points at the value from the knob's rim, in its outer 12%; the readout keeps to the middle 72% of the knob (`dialFace`), and a value wider than that, a long one or one in a wide typeface, is scaled to fit (`dialFit`), so the two never meet at any angle. A turn does not depend on the identity of `onValueChange`: a parent may pass a new function on every render.

The knob is drawn in the theme's own surface (its elevation, sheen, grain, glass and depth), so it is paper in one theme and glass in another; the arc and the notch use the tone's text role, kept 4.5:1 from the page. `format` says the value in the dial and to a screen reader (`aria-valuetext`); `caption` describes it (`aria-describedby`). With `name` the value is submitted with its form.

## Public API

The exported TypeScript source is authoritative. Named interface contracts:

- `DialProps`

Additional public types:

- `DialSize`, `DialTone`

## Theme contract

The component consumes semantic roles for typography, geometry, density, depth, motion, texture, rhythm, and icon expression. It must not contain theme-specific colors or duplicate profile values. Theme may alter expression but never semantics, target size, focus visibility, content hierarchy, or interaction behavior.

## Dependencies

- `@mlola-ui/behavior/logic`

Tailwind utilities, class-merging runtimes, third-party primitive libraries, third-party icons, and external motion runtimes are forbidden.

## Required verification

Every claim below is enforced by a gate in `npm run check`, the browser suite,
or the registry audit:

- Semantic elements, names, descriptions, and state relationships are valid.
- Keyboard, pointer, and touch paths are operable (`tests/e2e/dial.spec.ts`, and the framework-free journeys in `tests/e2e/framework-free.spec.ts`).
- Controlled and uncontrolled behavior is tested where the component owns state.
- Light and dark modes pass in all 5 canonical themes.
- Reduced motion and forced colors preserve meaning and operation.
- The layout survives a compact container and 200% zoom.
- Registry dependencies and copied source compile without external UI runtimes.
