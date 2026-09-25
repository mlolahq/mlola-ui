# Changelog

All notable changes to Mlola UI. From 1.0 the project follows semantic
versioning: breaking changes wait for a major version, and each one is listed
here with what to do about it.

## [1.0.2] — 2026-09-26

### Packages

- Assets: twelve 2D illustrations (empty, error and success states) and ten
  3D models, all MIT. Illustrations paint with theme tokens, so inlined (each
  ships a React component) they follow `data-theme` and `data-mode`; as an
  image they use their own colours. Models are small glTF files whose
  materials are named by theme role (`primary`, `accent`, `surface`, `ink`,
  `neutral`, `metal`), each with a poster. See `packages/assets/README.md`.
- `mlola-ui add asset <id...>` downloads an asset's files from the site,
  checks each against the integrity in the CLI's index, and places static
  files in `public/mlola` (the new `assets` target) and a 2D asset's
  component in `components/ui/illustrations`. `mlola-ui list --kind asset`
  lists them.

### Site and Mlola Pro

- The asset library at `/assets` has tabs for icons, illustrations and 3D.
  Models render live in the active theme through one shared WebGL viewer,
  and turn by drag or the arrow keys.
- Catalog previews load behind a recorded outline of the item's own first
  screen, at desktop and at phone width (`npm run outlines`), instead of a
  generic desktop outline.
- Phones: the hero facts sit in two columns, the theme and scene pickers
  scroll sideways and keep the chosen one in view, the header is opaque, and
  the docs no longer run past the screen. The centred hero's badge sits in
  the middle.
- Catalog images are regenerated with gpt-image-2 and saved at higher
  quality, so flat backdrops and gradients no longer band.

## [1.0.1] — 2026-09-25

### Packages

- `mlola-ui login` explains a pasted token prefix: the account page lists
  tokens by their first characters, and the full token is shown once.
- `mlola-ui`: the `bin` path loses its leading `./`, which npm rewrote.
- Checkbox wraps its label in one span, so a label with links reads as one
  sentence.
- Releases publish through npm trusted publishing (OIDC): no npm token is
  stored anywhere, and every version carries provenance.

### Site and Mlola Pro

- Catalog media: products, cart lines and blog posts take an optional
  `image`, shown over the monogram, which stays as the fallback when an image
  is missing or fails to load. Demo photographs and covers are hosted at
  ui.mlola.com/catalog and generated with `npm run images` (Together AI) from
  one art direction in `scripts/images/catalog-images.mjs`.
- The site header shows who is signed in: an avatar opens the account, the
  Studio and sign out, and Studio is its own button. Below the desktop
  breakpoint a menu (the library's Sheet) holds navigation, theme, mode and
  account.
- Scheduler stacks each day's name over its date in a narrow container, so a
  week still reads on a phone. Site search wraps descriptions on phones.
- Email through Resend: password reset (one-hour links, other sessions
  signed out), email confirmation on sign-up (required before buying Pro),
  and licence granted or ended notices from the Paddle webhook. Without
  RESEND_API_KEY emails are logged instead of sent. Notifications come from
  no-reply@mlola.com with replies going to hello@mlola.com.
- Nightly encrypted database backups to S3 (`scripts/ops/backup.sh`), with
  the restore steps in docs/releasing.md.
- Legal: Terms of Use, Privacy Policy, Refund Policy (14 days, handled by
  Paddle as Merchant of Record) and the Mlola Pro License, linked from the
  footer, pricing and sign-up (which now asks for consent). Delivered Pro
  files link to the licence. `npm run data:prune` enforces the 12-month log
  retention the Privacy Policy promises.
- The site's favicon, icon and Apple touch icon are the Mlola mark.

## [1.0.0] — 2026-09-25

The stable contract. Themes become specs, palettes are derived with guaranteed
contrast, and every duplicate spelling is gone. See
[the migration guide](docs/migration/v0.3-to-v1.md).

### Added

- Theme specs: eight channels, a primary seed, neutral and ink tints, a
  material and a font set. `normalizeSpec`, `validateSpec` and a published
  JSON schema (`theme-spec.schema.json`).
- Derived palettes solved per pairing in OKLCH, tested on thousands of random
  seeds; fills carry `-foreground`, page text uses the `-text` roles.
- `graphite`, a neutral default theme.
- Density and material tokens (`--ml-control-*`, `--ml-panel-padding`,
  `--ml-surface-*`).
- Theme Studio in the reference site: describe a look, get a theme, save it
  per account with versions, and load it from a hosted stylesheet.
- `mlola-ui theme pull <id | url>`.
- Thirteen AI components: Conversation, Message, StreamingText, Thinking,
  PromptInput, ModelPicker, Orb, VoiceWave, ToolCall, Citation,
  ConfidenceText, ContextMeter and Suggestions. Their decisions (stream
  pacing, IME-safe Enter, audio envelopes, context usage) live in
  `@mlola-ui/behavior/logic` and are tested.
- `@mlola-ui/behavior/document`: one shared, nesting scroll lock for every
  overlay, which keeps the page from shifting when a scrollbar disappears.
- Select options take `description`, `leading` and `trailing`; Select takes
  `hideLabel` and opens upward when there is no room below.
- `--ml-scrim`, a theme-tinted overlay veil for both modes.
- Bot: an expressive companion whose body morphs between shapes on springs
  and whose face carries the assistant's state.
- CodeBlock, DiffView (Myers diff or unified patches, unified or split, in-line
  change marks), FileChanges and TaskList, with a syntax palette made of
  contrast-solved text roles.
- Toast: variant icons, descriptions, `toast.promise`, a visible-stack limit,
  timers that pause on hover, focus and hidden tabs, exit animation, swipe.
- Skeleton: one synchronized sweep, text lines that match real line boxes (no
  layout shift), delayed appearance, and SkeletonRegion for announcing loads.
- Glyph motion: `animate` draws an icon stroke by stroke.
- Catalog: AI Chat, Voice Session and Thread Sidebar blocks, the Chat App page
  and the Code Agent template.
- Categories by purpose instead of atomic-design levels, from one validated
  list (`packages/registry/categories.json`); the docs group by them.
- Command Menu (⌘K), Popover, Kbd and Shortcut, Textarea, OTP Input,
  Dropzone, Empty State, Resizable and Selection Actions.
- `Field` and `fieldDescription` from Input: the label, hint and error
  anatomy every form control shares.
- PromptInput `triggers`: "/" commands and "@" context menus, ranked like
  the Command Menu, with combobox semantics.
- Context Cards: retrieved passages with source, location, relevance and the
  query's words marked.
- Code Agent: Stop cancels the run and marks unfinished work skipped.
- Docs: "AI integration" — wiring the chat to any model through one event
  stream.
- IDE components for agent harnesses: File Tree (keyboard tree, git status,
  file-type badges), Terminal (ANSI colours in theme roles, exit status,
  input with history), Source Control (staging, smart commit, a message a
  model can stream in), Commit History (branch graph, refs, CI checks) and
  Editor Tabs (unsaved dots, twin-name hints, preview tabs).
- Activity Heatmap: GitHub's calendar grid with quantile shading, a keyboard
  grid and hover detail.
- Code Agent: the side panel is a workspace with Diff, Files, Terminal and
  Git views.
- Canvas components, a new category: Canvas (pan, zoom, pinch, panels,
  collaborators' cursors), Canvas Toolbar (tools with single-key shortcuts),
  Minimap, Node Graph (agent workflows: drag, connect, loops refused, runs
  flowing through the edges) and Whiteboard (shapes, arrows, freehand, text,
  sticky notes, resize, colour, undo). Each canvas component loads its own
  stylesheet, so pages without a canvas never fetch it.
- Mlola Pro: AI chat, AI agents, Voice & presence, Code and Canvas components
  move to the commercial catalog beside blocks, pages and templates. 36 free
  components stay MIT. Pro source and styles never ship in a published
  package; the CLI names Pro items instead of installing them. Docs mark Pro
  components.
- Site: /blocks and /templates galleries of live previews, filterable by kind
  and purpose, with a page per item (live preview at desktop and mobile
  widths, what it is built from, install command); /pricing with Free, Pro
  and Pro Team plans and Paddle checkout. Catalog previews render edge to
  edge.
- Canvas Studio template: whiteboards with presence and AI that adds ideas to
  the board, and an agent workflow builder with a step palette, an inspector
  and live test runs.
- Calendar (one date, a range or several; full keyboard grid, range preview),
  Date Picker (single or range, presets, two months) and Time Picker
  (typeable spinbuttons in 12- or 24-hour time, a quick list, min and max).
  Free, in forms.
- Editor components, a new Pro category: Rich Text Editor (toolbar,
  Markdown shortcuts, sanitised paste, word count) and Block Editor (a
  Notion-style editor: slash commands, Markdown shortcuts, to-dos, callouts,
  drag to reorder, a selection bubble, its own undo, Markdown import and
  export, and AI that streams into the page).
- Suggested Edit: an AI rewrite as word-level tracked changes, accepted or
  rejected one by one or all at once, from the keyboard too.
- Notebook template: a page tree with favourites and search, pages with
  covers, icons and properties, the Block Editor, and an assistant that
  summarises, rewrites with tracked changes and gathers open to-dos.
- Canvas Toolbar: tooltips name each tool with its shortcut key.
- Status Icon and Priority Icon (free): a work item's stage and urgency as
  glyphs readable without colour, with label maps and ordered lists.
- Workflow components, a new Pro category: Kanban (pointer drag with
  room-making drops and edge scrolling, keyboard lift-move-drop with
  announcements, folding columns, limits), Property Picker (a searchable
  menu behind a pill, subtle or icon trigger; 1–9 pick by position; single
  or many) and Filter Bar (filters as editable sentences, with
  `applyFilters`).
- Charts, a new Pro category, drawn in native SVG from theme tokens: a
  shared frame (d3-style nice ticks, monotone curves, stacking, measured
  axes, legend, tooltip and a hidden data table), Line Chart (lines, areas,
  stacked, dashed targets, crosshair and keyboard reading), Bar Chart
  (grouped, stacked, horizontal), Donut Chart (the centre reads the slice
  you point at) and Sparkline.
- Form components (free): Combobox (filter as you type, groups,
  descriptions, create what is missing), Tag Input (Enter or comma adds,
  pasted lists split, two-step Backspace, suggestions, validation, a limit),
  Number Input (formatted at rest in the reader's locale, plain while
  typing, hold-to-repeat steppers, arrows, Page keys, bounds, precision) and
  Color Picker (saturation area, hue and opacity, hex, rgb or oklch, the
  eyedropper, presets and a WCAG contrast readout). Stepper (free,
  navigation): horizontal or vertical, clickable, condensing to "Step 2 of
  4" in narrow containers.
- Gantt (Pro, workflow): grouped bars dragged and resized by pointer or
  keyboard, milestones, dependency arrows that flag late work, today, and
  week, month and quarter zoom.
- Kanban swimlanes: rows across every column; dragging across lanes moves
  the item between them, and Up and Down cross lanes from the keyboard.
- Filter Bar: "Save view". Status and priority names live in plain
  `labels` modules beside their icons.
- Tracker template, in the manner of Linear: an inbox the assistant
  triages, teams, a keyboard-first list (J/K, X, S/P/A/L, bulk actions) and
  a board with swimlanes, saved views with a "Me" filter, completed, current
  and upcoming cycles with burndown, status and load charts, a roadmap of
  projects on the Gantt, issue pages with the Block Editor, sub-issues, a
  history of every change, AI rewrites reviewed as tracked changes, an AI
  agent that takes an issue and opens a pull request, and issues drafted
  from one sentence. Catalog category Productivity (Tracker, Notebook).
- Calendar and Date Picker: `disabledDates` and `enabledDates` take dates,
  `{ from, to }`, `{ before }`, `{ after }`, `{ dayOfWeek }` or a function;
  ranges take `minDays` and `maxDays` and stop at disabled days unless
  `allowDisabledInRange`. Days a pending range cannot reach are marked, and
  presets the rules refuse are disabled.
- Time Picker: `disabledTimes` and `enabledTimes` take "HH:MM", half-open
  ranges ("12:00-13:00", overnight too) or a function. Arrows step over
  refused times, a typed one snaps to the nearest allowed time on blur, and
  the list shows only the allowed slots (or dims refused ones) and opens on
  the current time.
- Suggested Edit: one action bar per editor, anchored under the change's
  last line, with a grace period so the pointer can reach it; a click or tap
  pins it until a decision or a click elsewhere.
- Editor icons: bold, italic, underline, strikethrough, lists, quote,
  heading, code block, to-do, grip and clear formatting.
- Free components: Virtual List (rows of any height, measured as they
  appear, loading more near the end), Context Menu (built for what was
  clicked; typeahead, Shift+F10 and long-press), Hover Card, Tour (a
  spotlight, focus trap and keyboard steps) and App Shell (a resizable,
  foldable sidebar with sections and items that becomes a drawer on phones).
- Data Grid and Scheduler (Pro, workflow). The grid virtualises rows, pins
  and resizes columns, sorts, selects cell ranges, edits in place, copies
  and pastes with spreadsheets and totals the selection; `onRowOpen` opens a
  row from Enter or a double-click. The scheduler draws, moves and resizes
  events in day, three-day and week views and lays overlaps side by side.
- Charts: Funnel, Radar, Scatter (bubbles, series, keyboard stepping) and
  Treemap (squarified); Line Chart takes `bands` for shaded ranges.
- AI components: Trace Viewer (an agent run as a span tree on a timeline,
  with totals and each span's input and output), Eval Grid (cases against
  variants with pass rates, regressions and diffs), Model Compare (blind,
  streamed side by side, with speed and a vote), Prompt Playground
  (templated variables, settings, versions and runs), Generative UI (renders
  a streamed JSON interface from Mlola components) and Transcript (follows
  playback word by word, with speakers, search and a summary).
- Templates: AI Console (usage, traces, evals, a playground and model
  comparison), CRM in the manner of Attio, Mail in the manner of
  Superhuman (split inbox, triage, drafts and edits reviewed change by
  change, keyboard-first), Scheduling in the manner of Cal.com (a booking
  page in the visitor's time zone and the host's calendar, hours and days
  off), Support Desk in the manner of Intercom (response targets, notes,
  macros and cited suggested answers), Analytics and Settings & Billing.

### Changed

- Generative UI: a metric takes `better: "up" | "down"`, so a fall in churn
  or latency reads as good news in its colour and sparkline; a chart node
  shows its label as a title and takes `format` (`number`, `currency`,
  `percent`) and `stacked`. Stacked bar tooltips end with the total.
- Generative UI streams without stutter: a chart, metric or progress still
  arriving holds a placeholder of its final size and appears once, complete,
  and each new node rises in once rather than every node re-animating on
  every chunk.
- Progress eases steadily toward each new value instead of springing, so a
  bar fed frequent updates moves as one continuous line.
- Light themes whose brand colour sits in the mid tones (Aerogel's violet)
  darken the fill slightly so white text reads on it, instead of flipping
  the label to black.
- The home page opens on a live scene: real components (Bot, a streaming
  answer, a tool run, a deploy notice with progress, reviewers and a metric)
  are all on stage from the first frame and tell a short story by changing
  state. Every 3.2 seconds the next canonical theme glides in: colours,
  radii, control sizes and weight are registered tokens that interpolate
  on the scene, so every component inside changes together. The scene
  tilts with the pointer, pauses off screen and holds still for reduced
  motion.
- Theme Studio is built for taste: start from a canonical theme, explore six
  variations around the current one (close, bold or wild), preview each on
  hover and continue from it, lock any channel, the colour or the surface
  while exploring, undo and redo, judge the theme on product, assistant and
  data surfaces or beside a canonical theme, and copy the spec or download
  its CSS without saving. A core panel shows the tokens the theme produces
  and its contrast audit in both modes.
- Icons: `IconLock` and `IconUnlock`.
- Mlola Pro delivery. A licence belongs to an account: the Paddle webhook
  grants it for the account that opened the checkout (signed, idempotent per
  transaction) and revokes it on a full refund or chargeback;
  `npm run licence:grant` grants one by hand. From /account the owner makes
  CLI tokens, shown once, stored as hashes, revocable. `mlola-ui login` and
  `logout` manage the token (`MLOLA_PRO_TOKEN` in CI), and `add` installs Pro
  items from the service with their Pro dependencies, integrity-checked and
  stamped with the licence, plus their stylesheets in `styles/mlola-pro.css`
  and Pro's guide for coding agents in `mlola-pro.agents.md`.
  Installs are logged and rate limited per licence. Buying requires signing
  in, so every purchase lands on an account.
- The published engine no longer describes Pro: `contract.json` and
  `agents.md` cover the free library only (87 elements), and Pro's contract
  and guide are generated beside the Pro catalog. `check:pack` fails if any
  published stylesheet, contract or guide names a Pro-only class.
- Repositories: `mlolahq/mlola` (private, the source of truth) and
  `mlolahq/mlola-ui` (the public MIT mirror). A release in the first syncs the
  mirror (`sync-free.yml`); the mirror's tag publishes to npm with provenance.
  Package metadata points at `mlolahq/mlola-ui`.
- `npm run export:free -- <dir>` builds the open-source mirror: tracked files
  only, the free components and the internals they use, no Pro catalog,
  blocks, pages, templates, Pro components or reference site. It fails when
  any path belongs to Pro or any relative import would not resolve; the
  mirror carries its own package.json, CI and tests.
- Pro source stays private on the reference site: the source API refuses
  every Pro component, block, page and template, and the docs and Workbench
  show a Pro panel in the code tab instead of source. Live previews stay open
  to everyone. Pro pages no longer suggest a CLI command that only refuses.
- The sign-in visual shows a design review rather than a price, so it cannot
  be mistaken for Mlola's own pricing.
- SegmentedControl wraps its options onto another row in a narrow
  container instead of spilling out of it.
- Bot: make it your own. `tone` or any `color` for the body, `variant`
  (`solid`, `gradient`, `glass`, `outline`), `texture` (`grain`, `dots`),
  `face` (`pill`, `round`, `pixel`, `visor`) and a resting `shape` (`round`,
  `squircle`, `blob`). The default look is unchanged, and every expression
  works in every look.
- Terminal takes `height`: a docked panel of fixed size whose output scrolls
  inside, pinned to the newest line, so nothing around it shifts. The home
  page's IDE window is a fixed size for the same reason.
- Charts draw from a categorical palette the engine derives for every theme
  and mode (`--ml-chart-1…6`, each 3:1 against the surface), instead of
  borrowing the primary and status colours; the first series follows the
  brand's hue. Bars are slimmer with a maximum width, spaced within a group
  and rounder; grid lines are lighter.
- One prop vocabulary across the library (see `docs/component-anatomy.md`):
  `tone` says what a colour means (`neutral`, `primary`, `info`, `success`,
  `warning`, `danger`), `variant` says what form it takes, `size` how large,
  `status` where it is in its lifecycle. Migrations:
  - Badge: `variant="success"` → `tone="success"`; `variant="primary"` →
    `tone="primary" variant="solid"`; `default`/`secondary` → no prop;
    new `variant` values are `soft` (default), `solid` and `outline`.
  - Alert: `variant` → `tone`; `appearance` → `variant` (`card`, `soft`).
  - Progress and CircularProgress: `variant` → `tone` (default `primary`).
  - Toast: option `variant` → `tone`; `toast.error()` → `toast.danger()`.
  - Button: `variant="destructive"` → `variant="danger"`.
  - Select: `onChange` → `onValueChange`; with `multiple`, `values`,
    `defaultValues` and `onValuesChange` → `value`, `defaultValue` and
    `onValueChange`. Model Picker and Suggested Edit: `onChange` →
    `onValueChange`.
- Stacking comes from one scale, `--ml-layer-*`, and every interface
  duration from the theme's motion channel, including the new
  `--ml-duration-reveal` for charts drawing in and bars filling.
- In forced-colours mode every focused element draws a system highlight
  outline, so rings drawn with box-shadow stay visible.
- Every text role now clears WCAG AA (4.5:1) wherever the library puts it:
  `text-faint` rises from 3:1 to 4.5:1, `text-muted` to about 6:1 so the
  hierarchy holds, and every `*-text` role is also solved against
  `background-subtle`. Soft badges keep 4.5:1 on their tint.
- `npm run check` includes a vocabulary audit that fails on `destructive`,
  tone values outside the set, `onChange` on value props, raw z-indexes and
  raw interface durations.
- Input pads its text past whatever sits beside it (an icon, a prefix, a
  badge), measured rather than assumed.
- Trace Viewer lays out by the width it is given (container queries), and
  the chart data table no longer widens narrow pages.
- Segmented Control shows labels as written instead of capitalising them.
- Alert is a card like the rest: the tone sits in an icon chip and a faint
  wash, warnings and errors pulse once as they arrive, and a dismissed alert
  eases out before `onDismiss` runs.
- Progress grows in, counts its percentage alongside the bar, sweeps a light
  along the fill with `active`, glows once when complete, and the
  indeterminate bar and ring now actually move (they stood still before).
- Avatar initials skip punctuation.
- Alert takes `appearance`: "card" (the default, a neutral card with a solid
  icon mark) or "soft" (an even tint, for banners across a page).
- Select's list lives on a layer above the page, so a clipped card or a
  scrolling panel can no longer cut it off; floating layers take the theme
  of the place they open from, and dialogs let focus into layers opened from
  inside them.
- The home page opens on a live stage of working components (Generative UI,
  Kanban, Data Grid, Agent Trace, Charts, Scheduler) that changes scene on
  its own, and shows the new templates as live previews.
- Timeline: markers sit on a rail drawn through their centres that fills as
  the sequence progresses; complete, current (pulsing) and upcoming read at a
  glance; items take `tone`, `icon`, `dateTime` and rich children for
  activity feeds, with the time beside the title.
- Carousel: a native scroll-snap track (swipe, trackpad, keyboard) with
  arrows over the edges, `perView`, `peek` and `minSlideWidth`, and
  `autoplay` that shows its progress on the active dot and pauses on hover,
  focus, a hidden tab and reduced motion. `indicators` picks dots, a counter
  or none.
- Variants and state move from classes to `data-*` attributes.
- Sheets float a hairline in from their edge with rounded corners.
- The engine no longer restyles the page scrollbar (`::-webkit-scrollbar`
  forced space-taking scrollbars on macOS); component scroll areas use the
  standard `scrollbar-width` and `scrollbar-color`.
- `[hidden]` always hides, whatever display a recipe sets, and icons never
  shrink inside flex rows.
- Icons apply their optical size with the `scale` property, so a recipe's
  `transform` (a chevron turning as a panel opens) is no longer overridden.
- The docs sidebar shows Workbench and Icons as tools above the component
  categories.
- Alert uses status icons and is assertive only for warnings and errors.
- Pressed toggle buttons (`aria-pressed`) show their state.
- Styles live beside their owner; blocks compose components only.
- Every catalog block takes its content as typed props.

### Removed

- Badge's domain aliases (`data-tone="paid"`, `"shipped"`, `"sale"`,
  `"signal"` and the like): pick a `tone` instead.
- The unused `ml-accordion-down`/`-up` keyframes from the engine's motion CSS.
- The `ghost` variant of Button, Input and Property Picker is now `subtle`;
  replace `variant="ghost"` with `variant="subtle"`.
- `IconWand` and its `Wand2` alias. Use `IconPen` for rewriting and
  improving text, and `IconSpark` for the assistant.
- `data-skin`, the `--ml-signal`/`--ml-bg` names, shadcn variables and the
  `.ml-button-*` variant classes.

### Security

- Font stacks and labels in a theme spec can no longer write outside their own
  declarations.

## [0.3.0] — unreleased

See [the 0.3.0 release notes](docs/release-notes/0.3.0.md) for the publish-ready
summary.

The architecture reset. A framework-free engine, an owned behavior runtime, a
generated contract, and conventional vocabulary.

### Added

- `packages/pages/` as a fourth composition layer: one full route assembled from
  blocks (`Landing`, `Pricing`, `Blog`, `Dashboard`, `Auth`). `ecommerce` is the
  one multi-page template.
- A machine-readable contract: `contract.json` and `agents.md` are generated
  from the stylesheet and audited, so no tool can invent a class that does not
  exist.
- `@mlola-ui/behavior`, a framework-free interaction runtime, plus
  `@mlola-ui/behavior/logic` with the pure decisions React shares.
- Spring-derived CSS `linear()` easings, sampled from a damping ratio and natural
  frequency per theme, with a cubic-bezier fallback.
- `Carousel` and `SegmentedControl` components.
- A WCAG contrast gate, a documented theme-distance metric, registry render
  coverage, a mode/state matrix, and an idle animation-frame budget test.
- A deprecation ledger with enforced removal versions, a manual accessibility
  checklist, and a release guide.

### Changed

- **Open core.** The open-source distribution is the components layer plus the
  runtime packages. Blocks, pages, and templates moved to a commercial catalog:
  `@mlola-ui/registry` and the CLI now ship components only, and the catalog
  lives under `packages/registry/catalog/` with its own license.
- **Vocabulary.** The look is a **theme** (`data-theme`), the light/dark switch
  is a **mode** (`data-mode`), and `--ml-taste-*` became `--ml-theme-*`. The
  TASTE acronym was retired for "theme methodology". In v0.2, `data-theme` meant
  light/dark; migrate `data-theme="dark"` to `data-mode="dark"`.
- `@mlola-ui/icons`, `@mlola-ui/motion`, `@mlola-ui/scene`, `@mlola-ui/tokens`
  now set `"type": "module"`.
- The workbench library is ordered Components, Blocks, Pages, Templates, and
  every item opens as a full page in a new tab.

### Removed

- `@mlola-ui/core`, which no component imported.
- The static utility bridge and its generated stylesheet.
- `packages/recipes`, a package that only re-exported the engine.
- `packages/templates/_internal/routing.ts`, which no template imported.

### Fixed

- The preview build failed type checking on the asset manifest item shape, which
  also broke the end-to-end build server.
- `success` and `info` intent colors fell below AA against their foreground;
  both were darkened. The atelier signal was darkened slightly as well.
- The React `Accordion` was missing the arrow/Home/End keyboard map the contract
  requires.

## [0.2.0]

Palette-oriented skins and Tailwind-dependent copied source. See
[the migration guide](docs/migration/v0.2-to-v0.3.md).
