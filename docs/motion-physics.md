# Motion Physics

Mlola motion communicates state and spatial relationship. It is not decoration
added after styling.

## Two execution paths

CSS handles deterministic state transitions. The engine derives a damping ratio
and natural frequency per theme, samples the oscillator's step response
into a `linear()` easing (`packages/engine/src/spring.mjs`), and emits it behind
`@supports (transition-timing-function: linear(0, 1))` with a cubic-bezier
fallback, so static transitions need no JavaScript animation runtime.

The Web Animations API and a small requestAnimationFrame integrator in
`@mlola-ui/motion` handle interruptible pointer kinetics. The loop starts only
while energy or input remains and stops at rest.

## Spring model

Mlola uses the damped oscillator:

```text
x'' + 2 ζω x' + ω² x = ω² u(t)
```

The motion axis sets the damping ratio `ζ = 0.95 − 0.5 · motion` and the natural
frequency is chosen so the spring settles inside the normal duration,
`ω = 4 / (ζ · durationNormal)`. The CSS easing is the unit step response,

```text
y(t) = 1 − e^(−ζωt) · ( cos(ω_d t) + (ζω / ω_d) · sin(ω_d t) ),  ω_d = ω√(1 − ζ²)
```

sampled over the 2% settling window and pinned to exactly 0 and 1. Underdamped
profiles therefore overshoot, which is what a spring should do.

The runtime integrator uses semi-implicit Euler with a clamped frame delta:

```text
force = -stiffness * (position - target) - damping * velocity
velocity += force * dt
position += velocity * dt
```

The loop stops when displacement and velocity both fall below their epsilon.
Long suspended frames are clamped rather than integrated as a single large
step.

Theme tunes natural frequency, damping, displacement, and cadence through
derived variables. Components choose a semantic motion role such as enter,
dismiss, emphasize, reorder, or spatial-follow; they do not choose arbitrary
durations.

## Reduced motion

When reduced motion is requested:

- tilt, parallax, bounce, overshoot, and decorative stagger are disabled
- spatial transforms become an immediate state change
- essential continuity may use a short opacity dissolve
- no requestAnimationFrame loop starts
- View Transitions use a non-spatial fallback

The preference listener reacts to changes during the session.

## Performance constraints

- pointer events update targets; animation frames update rendered state, and a
  browser test asserts no frame loop runs while a component is idle
- layout measurement is cached until resize or entry, and reads happen before
  writes by review, not by a machine check
- `will-change` is enabled only during active motion
- Hidden and offscreen effects pause.
- Scene effects preserve a static representation.
