# Password Input Component Contract

## Purpose

A password field: sign-in, sign-up, or changing a password. It adds what
every password field needs and no more: a toggle to show what was typed,
and, when a password is being chosen, a meter that says how strong it is
and what would make it stronger.

## Anatomy

```text
.ml-password-input
├── Input (label, control, hint or error)
│   └── .ml-password-input-toggle   trailing button
└── .ml-password-input-strength     only with `strength`
    ├── .ml-password-input-meter    three segments
    └── p                           the hint
```

## Public API

- Every Input prop except `type` and `trailing`.
- `strength`: show the meter. On for choosing a password, off for signing in.
- `minLength` (8) and `strongLength` (12): the thresholds, passed to the
  shared `passwordStrength` decision in `@mlola-ui/behavior/logic`.
- `strengthHints`: replace what the meter says at `empty`, `weak`, `medium`
  or `strong`.
- `toggleLabel` (default "Show password").
- `autoComplete` defaults to `new-password` with a meter and
  `current-password` without, so password managers offer the right thing.

## Semantic states

- Toggle: `aria-pressed` true while the password shows.
- Meter: `data-strength` is `empty`, `weak`, `medium` or `strong`.

## Keyboard and accessibility

- The toggle is a native button with a constant name; its pressed state says
  whether the password shows, so the name never contradicts the state.
- The meter's hint is described by the input and announced politely as it
  changes. The colored segments are hidden; the words carry the meaning.
- No autocorrect, autocapitalization or spellcheck.
- Forced colors: segments are outlined and filled with `CanvasText`.

## Theme channels

Input's recipe. Meter segments use `--ml-danger-text`, `--ml-warning-text`
and `--ml-success-text` (marks on the page, 3:1 against it) on `--ml-track`.

## Responsive behavior

Fills its container like Input. The toggle widens its target on touch
(`data-hit="expand"`).

## Dependencies

Input, `@mlola-ui/behavior/logic`, `@mlola-ui/icons`. The auth block uses it.

## Verification

- Renders in every theme and mode, and passes the accessibility sweep.
- `check_markup` accepts its markup; its HTML renders with no framework.
