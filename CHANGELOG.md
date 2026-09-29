# Changelog

All notable changes to Mlola UI. From 1.0 the project follows semantic
versioning: breaking changes wait for a major version, and each one is listed
here with what to do about it.

## [1.1.14] — 2026-09-29

### Escape inside a modal

- Popover (and the Date Picker, Time Picker and Color Picker built on it),
  Tooltip and Hover Card open inside a modal now close on Escape and leave
  the modal open; the next Escape closes the modal. Each listened for Escape
  after the modal did, so one press closed both. They now listen first and
  mark the key used, in React and, for the tooltip, in the framework-free
  runtime.
- Escape on a closed Select inside a modal closes the modal. The select used
  to keep the key even when it had nothing open.

### MCP server and CLI

- `check_markup` no longer warns about a faded SVG shape (a chart's area or
  line, painted with `fill` or `stroke`): it holds no text. Found on a page
  Sonnet 5.5 built.

## [1.1.13] — 2026-09-29

### Dropdown Menu

- A menu opened inside a card, a scrolling panel or a modal shows every item.
  It used to hang under its trigger inside that container, which cut it off.
  It is now a floating layer like Select and Popover: React renders it into
  `<body>`; the framework-free runtime opens it in the browser's top layer
  (Popover API), fixed to the viewport where that is missing. It sits above
  a modal it opens from.
- Escape in a menu inside a modal closes the menu, not both. Modal and Sheet
  now skip an Escape a menu or listbox above them has used.
- In the framework-free runtime, opening the menu with a press moves focus to
  its first item, as the React menu does; in Safari, whose buttons take no
  focus on a click, the keys and Escape did not reach the menu before.
- `fitMenu` (added in 1.1.11) is deprecated: the menu is placed with
  `placeFloating`.

### Select

- The framework-free listbox opens in the top layer as well, through the same
  helper as the menu, so a card with `backdrop-filter` cannot clip it.

## [1.1.12] — 2026-09-29

### Form controls

- A medium input, select, number input, combobox, date picker, time picker,
  password input and segmented control are now exactly as tall as a medium
  button: the theme's control height. Before, their padding and line height
  set a height of their own (37.6px in every theme), so density did not
  reach them and a button beside a field stood up to 3px shorter.
  `tests/e2e/control-heights.spec.ts` measures every theme.

## [1.1.11] — 2026-09-29

Found by a second round of agent-built pages, with DeepSeek V4.1 Flash in
opencode.

### Dropdown Menu

- The menu stays on screen: it slides sideways when its alignment would take
  it past the window's edge, and opens above the trigger when there is no
  room below. On a phone, an end-aligned menu on a trigger at the left edge
  used to open 115px off screen. React and the framework-free runtime share
  the decision (`fitMenu` in `@mlola-ui/behavior/logic`).

### Breadcrumb

- On a touch screen a link is a fingertip's target. Its invisible larger
  target was clipped by the link's own ellipsis, so the target never grew.

### MCP server and CLI

- `check_markup` no longer warns about `opacity: 0` (hidden, not faded) or
  steps of a `@keyframes` animation, and skips attribute values built in a
  script string (`'<span data-tone="' + tone + '">'`).

## [1.1.10] — 2026-09-28

### MCP server and CLI

Found by watching coding agents build pages with Mlola: they spent most of
their steps looking for how to load it.

- `get_design_rules` and `get_install_command` give the stylesheet link and
  the runtime script for a page with no build step, at this release's version.
  `get_install_command` without names returns the setup alone.
- `check_markup` accepts `data-mode="system"`, which it used to reject.
- `check_markup` reads `<style>` blocks too: hand-written colors, overridden
  theme tokens, and text faded with `opacity`, whose contrast then depends on
  the theme.
- Search returns the closest items when no item matches every word ("radio
  card" finds the radio group), reads plurals and hyphens, and knows "kpi",
  "stat" and "chip". `get_component` takes a class or a title ("ml-button",
  "Date picker"), and an unknown name gets suggestions everywhere.
- A tool call with a missing, extra or mistyped argument gets a message that
  says how to fix it, instead of an error from inside the tool.

## [1.1.9] — 2026-09-28

### Resizable

- The handle's line and grab area sit above both panes. Before, a pane's
  sticky headers and row borders painted over the line while it was dragged,
  as in the Tracker's list beside its navigation.

### Release

- Publishing waits for npm to serve the new CLI before listing it in the MCP
  Registry, and skips packages already out, so a rerun is safe. 1.1.8 reached
  npm but not the registry for this reason.

## [1.1.8] — 2026-09-28

### Bot

- The body eases between looks instead of snapping: a new color, gradient,
  glass or outline transitions, gloss and texture fade in, and a new face
  morphs the eyes from one shape to the next. Reduced motion turns it off.
- The showcase's looks are buttons: one sets every setting of the maker at
  once, and colors are swatches with a wheel for any color.

### Quality

- The axe sweep checks every component, block, page and template in all five
  canonical themes, in light and dark. Before, it ran in Graphite only, and
  the other themes were held by the palette's contrast tests alone.

## [1.1.7] — 2026-09-28

### Kanban

- A card can be dragged with a finger: hold it for a quarter of a second,
  then drag. Before, a drag on a phone left the card stuck, hidden under a
  floating copy, until the next tap.
- A swipe that starts on a card scrolls the board instead of lifting it.
- A quick release drops the card where the pointer is, not one column back.
- Dragging no longer renders the whole board on every pointer move.

### Slider, Resizable, Data Grid

- Slider: the whole 24 px row takes a press, not only the 6 px track. On a
  phone, a finger scrolling past a slider no longer changes it; a sideways
  drag or a tap does. The framework-free runtime does the same, through the
  shared `isSidewaysDrag`.
- Resizable: the handle stays where it was grabbed instead of jumping under
  the pointer; a drag the browser cancels ends, where before the pointer
  passing over the handle kept resizing; the right button no longer drags;
  Escape puts the panes back; the grab area is 24 px on touch screens.
- Data Grid: resizing a column ends however the pointer lets go, Escape puts
  the width back, and the edge is 24 px wide on touch screens.

### Quality

- A release waits for CI to pass on its commit, and publishes nothing when
  that run failed, was canceled or never ran.
- A component a pointer drags must have a journey in the browser suite that
  drags it (`check:structure`); the ones not yet audited are listed.
- The MCP Registry keeps one current version of the Mlola server: each
  release marks the ones before it deprecated.

## [1.1.6] — 2026-09-28

- Running `npx mlola-ui mcp` by hand says, on one line, that it waits for a
  coding agent, instead of a silent terminal that looks stuck. Agents see no
  change: the line goes to stderr, only on a terminal.
- The hosted MCP server at `https://ui.mlola.com/mcp` answers up to 10
  requests a second per address, with a burst of 100.
- Docs: the Coding agents page names the MCP Registry listing, says how chat
  apps connect, and marks which tools each server has. The AI integration
  server example maps the picker's model names to provider ids and refuses
  others, and Stop now stops the model on the server too.

## [1.1.5] — 2026-09-28

### Scheduler

- Pressing just under an event's lower edge resizes it. Before, the grab
  band was 6 px inside the event and a press a pixel below made a new event.
- A click or a tap on empty time no longer adds an event at once: it drafts
  one and opens the new built-in editor (title, times, location, delete),
  which adds it only on save. Clicking an event opens the same editor.
  `onEventOpen` still replaces it with your own.
- New event in the toolbar makes one from the keyboard.
- Dragging is smooth: the scheduler renders only when the snapped time
  changes, the events around a dragged one keep still, the grid scrolls at
  its edges, and Escape cancels.
- A finger scrolls the grid on a phone; before, the grid could not be
  scrolled by touch.

### Site

- A preview's theme and mode reach dialogs, menus and tooltips, which render
  into `<body>`. Before, a dialog in a dark preview was light.

## [1.1.4] — 2026-09-27

- The CLI's MCP server is listed in the
  [MCP Registry](https://registry.modelcontextprotocol.io) as
  `io.github.mlolahq/mlola-ui`: both the local server (`npx mlola-ui mcp`)
  and the hosted one (`https://ui.mlola.com/mcp`). Each release updates the
  listing.
- Every illustration and model is checked against the asset rules in
  `npm run check`, hand-made ones included.
- Two icon groups are named in sentence case like the rest ("Brand & theme
  glyphs", "Workspace & action glyphs").

## [1.1.3] — 2026-09-27

- A link to another site can say so: give its `LinkItem` `external: true`
  and Navbar and the footer open it in a new tab, with an arrow after its
  words and "(opens in a new tab)" for a screen reader.

## [1.1.2] — 2026-09-27

Two more from moving mlola.com onto 1.1.1.

- `mlola-ui add` raises a Mlola package the project declares at an older
  range than the copied code needs. Before, a project on `^1.1.0` that added
  items from 1.1.1 kept the older engine, whose stylesheet did not know the
  new items. Links (`workspace:`, `file:`), tags and compound ranges are left
  as the project set them.
- The docs template's mark is the engine's brand mark, and `docsSite.logo`
  takes its place without the colored chip, as a logo does in Navbar and
  Auth Split. Before, a logo sat inside the chip.

## [1.1.1] — 2026-09-27

### Blocks, pages and templates in real projects

Found by building mlola.com with Mlola UI from npm, the way any team would.

- A block shows its demo copy only when a page gives it no content at all.
  Before, every prop a page left out fell back to sample copy: a hero kept
  its "today" and its invented stats ("4,200+ teams", "4.9 / 5"), a steps
  section kept "Start for free", a sign-in kept a made-up quote. Now a prop
  left out is empty. Each block exports its demo (`navbarDemo`,
  `ctaFooterDemo`, …) for a page that shows part of it on purpose, and the
  catalog's pages and templates now pass what they show by name. A test
  renders every block with a page's own content and fails on any demo text.
- `mlola-ui add` lists every block, page and template stylesheet it installs
  in `styles/mlola-pro.css`, the file the CLI already asks you to import
  once. Before, those stylesheets were written beside their blocks and never
  imported, so an installed block had no styles.
- Pro delivery stamps the license on Pro files only. A helper that the free
  distribution also ships (`_internal/clipboard.ts` with Code Block) now
  arrives exactly as the free registry has it: it no longer conflicts with
  the copy a project has, and MIT code is no longer marked as Pro.
- Navbar, Auth Split and the footer take a `logo` in the brand, in place of
  the lettered mark.
- The docs template reads its name, its mark and the link beside search from
  `content.ts`, and its address from one constant in `routes.ts`
  (`DOCS_BASE`). It also renders tables.
- Process Steps fits up to five steps on one row on a wide screen, and draws
  the line between them only while they share it.
- Every copied file (components, blocks, pages, templates) passes
  eslint-config-next with no warnings; `npm run lint` now checks them all.
  The Data Table search no longer says "Search orders" whatever it holds.

### Themes and setup

- `data-mode="system"` follows the reader's light or dark setting with no
  script.
- The docs, `init` and the agent guide say how to load the themes' fonts
  (`--font-inter`, `--font-newsreader`, `--font-jetbrains`); without them a
  page quietly used the system's fonts.
- The docs show the one ESLint rule a Next.js project relaxes for
  `components/ui`, and why.

## [1.1.0] — 2026-09-27

### Components in real projects

From a team using Mlola in a large existing app. Each fix is in the shared
foundation, so every component that had the problem has the fix.

- Custom form controls work in forms like native ones. Select, Combobox,
  Date Picker, Time Picker, Number Input, OTP Input, Slider, Tag Input and
  Color Picker take `name` and `form` and submit their value (a date range
  as an ISO interval, `2026-09-01/2026-09-07`; several values as several
  entries). They take `id` for an outside `<label htmlFor>`, `required`, and
  `aria-label`, `aria-labelledby` and `aria-describedby`, which merge with
  their own hint and error. Select's `label` and `error`, and the labels of
  Input, Textarea, OTP Input and Slider, take any content, not only text.
  One contract, `FormControlProps`, and one renderer, `Field`, own it.
- Modal and Sheet are named by their header's title (`aria-labelledby`), so a
  formatted title names the dialog; `label` remains for dialogs without a
  header. They pass other attributes (`id`, `data-*`, `aria-*`) to the panel.
  Focus moves inside in the same commit that opens them, so a test can check
  it straight after render, and returns to the opener on close. A closed
  dialog no longer leaves an empty element in `<body>`.
- Progress passes `aria-*` to the bar and other attributes to its root.
- Nothing crashes in jsdom any more. Progress, Alert, Carousel, Tour, App
  Shell and the voice components read media queries through one guarded
  hook; Input and Canvas check for `ResizeObserver`; Textarea, Prompt Input,
  Kanban, Scheduler, Transcript and Trace Viewer no longer need the `CSS`
  object. A new test renders every showcase and example in jsdom.
- The source passes eslint-config-next with no errors or warnings, so it
  needs no ignore list. Sixty errors and eleven warnings, in twenty-two
  components and their shared helpers, are fixed at their cause: refs are no longer read or written during render,
  state is no longer set straight from an effect, and render no longer
  changes values. `npm run lint` now checks component source with those
  rules.
- Button labels wrap onto balanced lines when the space is too narrow,
  instead of spilling out; a one-line button is exactly as tall as before.
  `width="full"` fills the container.
- EmptyState, Card title, Accordion, Kanban, Task List and Context Cards
  take `headingLevel`, so their heading fits the page's outline.
- Select has an example of a form: an outside label and a submitted value.
- The layout audit now looks inside popovers, menus and dialogs. Their
  empty wrapper on `<body>` had made it treat everything in them as hidden;
  a layer now marks its own root `data-ml-portal`, and the audit still lets a
  layer cover the page beneath it on purpose.

### Themes

- `npx mlola-ui theme build` renders `mlola.theme.json` offline, with the
  engine installed in the project, into `styles/mlola/theme.css`: the same
  file `theme pull` writes for a Studio theme. `mlola.config.json` accepts
  the project theme's id as its `theme`, and `doctor` checks the theme is
  rendered. The engine exports its renderer as `@mlola-ui/engine/theme`.
- `color.primaryForeground` (`auto`, `light` or `dark`) chooses the label on
  primary buttons in light mode; the fill moves only as far as that label
  needs for contrast. The theming docs say when the engine picks dark ink
  and how dark a seed must be to keep white.
- When neither white nor dark ink reached contrast on a fill, light mode
  moved the fill toward the label that read worse, so an amber seed at
  lightness 0.55 came back lighter with dark text while one at 0.6 kept
  white. Both modes now move toward the closer label. The canonical themes
  are unchanged.
- The display weight is written as a whole hundred, so a font that ships
  only static weights renders the intended weight instead of the next one
  up.

### For language models and agents

- `https://ui.mlola.com/mcp`: the Mlola MCP server over Streamable HTTP,
  for agents that cannot run a command in a project (chat apps, hosted
  editors). No account; the same search, component, token, rule and
  markup-check tools as `npx mlola-ui mcp`, with `get_install_command` in
  place of installing. Mlola Pro items are described, never served as
  source. The CLI exports the protocol handler (`mlola-ui/mcp`), so the
  local and the remote server answer through one piece of code.
- `/llms.txt` maps the site for language models, with the free and the Pro
  catalog marked apart; `/llms-full.txt` holds the free contract and every
  free component with its props and examples; every component page is
  Markdown at its address plus `.md`. Codegen writes them from the
  registry, `check:codegen` fails when they are stale, and a test fails if
  any passage of Pro source reaches them.
- The Coding agents page documents both.

## [1.0.13] — 2026-09-27

### Packages

- Tooltip stays on screen: it flips to the other side when there is more
  room there, or opens above when neither side has room across, and slides
  along its edge with the arrow still pointing at the trigger. A long tip
  wraps within the window instead of running past it. React and the
  framework-free runtime share the decision (`fitTooltip` in
  `@mlola-ui/behavior/logic`).
- Tooltip no longer jumps while it appears: its placement uses `translate`,
  so the entrance animation's transform adds to it instead of replacing it.
- Tooltips on the left and right sides have an arrow.

### Tooling

- `npm run audit:layout` also opens what opens on every item (menus,
  selects, popovers, dialogs, sheets, tabs) and walks each template's own
  navigation, checking every state, and reports floating content cut off
  by the window's edge. 626 interaction steps found the tooltip above.

## [1.0.12] — 2026-09-27

### Layout

Found by a new rendered audit (`npm run audit:layout`) that opens every
component, block, page and template in every theme, on a desktop and a
phone.

- Carousel arrows sit in a gutter beside the slides instead of over them,
  where they covered the start and end of every slide's text. On touch the
  slides keep the full width.
- Fields keep their own height in a form row taller than themselves: an
  input beside a password strength meter was stretched to 57px and pushed
  down. Input, Checkbox, Radio Group, Slider, Dropzone and Progress share
  the fix.
- A table that scrolls holds its visually hidden cell text inside it; on a
  phone that text widened the whole page by up to 121px. Sections and the
  page shell's regions may now be narrower than a wide child, so a table
  scrolls in place.
- Tool Call titles shorten with an ellipsis instead of being cut off; the
  ellipsis had been applied to the tool's name, not the title.
- Treemap shows a tile's label and value only when both fit, the label
  alone when one line fits.
- Code Block always has a header when it can be copied, naming the
  language when there is no file name, so the copy button never covers the
  first line. The docs' code blocks follow the same rule.
- Breadcrumb items can be buttons for in-app navigation and carry an icon,
  and long titles shorten with an ellipsis. The site's catalog and
  component pages, and the CRM, Notebook and Tracker templates, use it
  instead of three hand-built trails with three separators and sizes.
- The Mail template's rows keep clear of the star button at every density.
- Number Input's steps stay square: where touch sizing makes the field
  taller, they grow to 44 × 44 instead of stretching into tall slivers.
- The mobile audit waits for the page and its fonts instead of an idle
  network, which the catalog pages never reach while previews stream in.

### Mlola Pro catalog

- The Not Found page is gone: it was the Error State block under a
  navigation bar, and showed the same 404 twice in the catalog. Use the
  block (its not-found kind has search and the usual destinations), as the
  Marketing Site template's 404 route does.

### Assets

- Inventory is redrawn in the collection's soft oblique view: an open shelf
  of labeled parcels, one empty slot and a checked stock tag, in the shared
  line weights instead of a heavy dark frame.
- Empty cart and Offline use the collection's line colors and weights for
  the cart frame and the router's antennas; Offline now shows a dropped
  signal (broken arcs and a slashed badge) instead of waves going out.
- The task lamp and measuring tape models are recomposed to hold the frame
  like the rest: a sturdier lamp with a weighted base and a fuller light
  bar, and a larger tape case with a shorter length of tape pulled out.

## [1.0.11] — 2026-09-27

### Mlola Pro catalog

- Ten blocks: Logo Cloud, Comparison Table, Feature Rows, Process Steps,
  Contact Form, Changelog, Onboarding Checklist, Activity Feed, Settings
  Panel and Error State. Each is composed from the components, with state,
  validation and focus handled by them.
- Five pages: Features, Release Notes, Contact, Welcome (a new member's
  home) and Not Found.
- Two templates: Marketing Site (home, features, pricing with a full
  comparison, changelog, contact, sign-in and a not-found page, one
  navigation that marks the current page) and Docs Site (grouped articles,
  keyboard search over pages and sections, a table of contents that follows
  the reader, previous and next, and feedback on every page).
- The landing and pricing pages use Logo Cloud and Comparison Table instead
  of their own copies, and the Settings template's sections and rows are the
  Settings Panel block's. The logo row no longer borrows a real brand's name.
- Template and component descriptions say what each does instead of naming
  another product; `npm run check:content` now enforces it.

### Packages

- Select sits level with Input: the trigger uses the field's type size, and
  it keeps a field's height in a form row taller than itself.
- A text affix in Input ("https://", a domain) reads at the size of what is
  typed beside it.
- Command Menu finds several words spread over a label and its keywords
  ("rate limit head" finds "Limit headers" under "Rate limits").
- Navbar marks the current page with `currentHref`; Stats Band fills an app's
  content area with `contained={false}`.
- A section a link jumps to clears the sticky navigation bar, and the check
  list the pricing tiers and feature rows share is an engine recipe.

## [1.0.10] — 2026-09-27

### Packages

- A burnt orange fill carries white in light mode, like red, green and blue.
  Dark ink on a mid orange passed the ratio and still read as dark on dark;
  worse, the solver lightened Atelier's terracotta seed to make that ink fit.
  Its primary is now its seed's depth with a white label (5.3:1). Amber,
  yellow and an orange too bright to darken a little keep dark ink, and the
  warning fill is unchanged.

### Site

- Versions and stability (`/docs/versions`): what semantic versioning covers
  from 1.0, what any release can change, how a deprecated name is retired,
  how updates reach copied source, and the supported platforms. The version,
  ranges, contract counts and deprecations are read from the source.
- The deprecation test compares against the engine's published version; its
  hand-kept version had stayed at 0.3.0.

## [1.0.9] — 2026-09-27

Found by installing Mlola into new Next.js and Vite apps exactly as the docs
say, from npm.

### Packages

- `@mlola-ui/motion`, `@mlola-ui/scene` and `@mlola-ui/icons` ship compiled
  JavaScript with type declarations. They pointed at TypeScript source, which
  a Next.js app refuses to build ("Unknown module type") unless it lists them
  in `transpilePackages`. `"use client"` stays on each module, so Server
  Components can import them. `@mlola-ui/registry/generated/catalog` is
  JavaScript with declarations for the same reason. A test builds the
  packages and imports each by name, and fails if any entry point is source.
- The engine stylesheet places Mlola above Tailwind's preflight whichever is
  imported first. Imported before Tailwind, the preflight used to unstyle
  every component: transparent buttons, square corners, the fallback font.
- The engine carries the glyph base (inline-block, optical centering, the
  optical sizes), so icons sit on the text line without importing
  `@mlola-ui/icons/glyphs.css`, including next to Tailwind's `svg { display:
  block }`.

### CLI

- `init` installs `@mlola-ui/engine`, and `add` installs the packages the
  copied code imports that `package.json` does not declare yet, with the
  project's package manager. The docs never said to install them, so a new
  app failed to build. `--no-install` prints the command instead; the MCP
  server keeps the package manager's output off its protocol channel.
- `init` fits the project: files go where the `@/` alias points, or into
  `src/`. Without an alias, as in a new Vite app, it writes `"imports":
  "relative"` and copied files import each other by relative path, so they
  build with no setup.
- `doctor` checks the packages the installed items import instead of the
  whole registry, finds `data-theme` in a Vite `index.html`, and no longer
  calls Tailwind in the app a forbidden dependency.

### Site

- The Introduction shows the whole setup: what `init` and `add` install,
  where files go, the stylesheet and `data-theme` for Next.js and Vite, and
  that Tailwind can stay.
- Every page now has a link card for X, LinkedIn, Slack and chat apps: its
  own title and description, and an image drawn from the default theme's
  palette. Component, block and template pages name their category and
  tier; the quality and pricing cards show computed facts. A card for a
  name that does not exist answers 404, like its page.

## [1.0.8] — 2026-09-26

### Packages

- Spinner, Copy Button and Password Input: the three behaviors the library
  had written more than once, now each with one owner. Button, Toast,
  Terminal and Node Graph use the Spinner; Code Block, Message, the
  templates and the site share one copy behavior that announces its outcome;
  the auth block uses Password Input, whose strength meter now draws with the
  `-text` roles so its segments reach 3:1.
- 35 everyday glyphs, drawn on the Glyph DNA grid: more, sidebar, grid and
  list views, sort, filter, minimize, first and last, send, archive, inbox,
  tag, bookmark, pin, flag, print, clipboard, sign in and out, zoom, pause,
  image, globe, database, cloud, card, bar chart, trend, key, map pin, phone,
  message, help and idea, each with its plain alias.
- Table headers line up with their columns; browsers centered them.

### Site

- `/docs/quality`: what Mlola proves on every change, with every number
  computed from the source at build: contrast per theme and mode, the
  accessibility sweep, package weight and dependencies, the element contract,
  and what is not proven yet. The home page and the footer link to it.
- Component pages gain a gallery: real uses of the most-used components,
  each live in the reader's theme with its React and its HTML.

### Quality

- `AGENTS.md` is the one source of the rules and the definition of done for
  every person and coding agent; `CLAUDE.md` imports it.
- `check:structure` fails when an item lacks a file, a manifest field or a
  well-named example; `check:content` fails on British spelling, off-limits
  demo content, and names that carry a deity's name.
- Gallery HTML renders and passes axe with no framework, in three engines.

## [1.0.7] — 2026-09-26

### Engine

- Danger, success and info fills carry white text in light mode, darkened
  just enough to reach the target, as primary already did: white reads
  better than dark ink on a red, green or blue. Warning and orange brands
  keep dark ink, as convention expects.
- Every colored fill has a hover token (`--ml-primary-hover`,
  `--ml-danger-hover`, …) solved in the palette with the same guarantee as
  the fill. Hover used to mix toward the page, which on a mid-tone brand in
  light mode took the label below 4.5:1 (aerogel 4.1, nordic 4.4).
- A monochrome brand's links and focus ring are the inverted ink at night,
  not a mid gray (graphite dark).

### Packages

- Button: a busy button keeps its color, so "Saving…" reads at full
  contrast and no longer looks disabled. The danger variant hovers with
  `--ml-danger-hover`.

### Site

- The shadcn/ui guide sits under Guides, below the components, as "Migrate
  from shadcn/ui": it is for people arriving with that library, and cannot
  read as Mlola being built on it. Getting started introduces Mlola alone.
- American spelling throughout: the asset gallery's color labels, asset
  summaries, the legal pages and older changelog entries. Shipped
  identifiers (`/api/pro/licence`, `licenceId`, the `licence` key) keep
  theirs.

## [1.0.6] — 2026-09-26

### Packages

- Every free component has an example beside it (`<name>.example.tsx`): the
  React the docs show, rendered at codegen to the HTML it produces. The
  registry ships them (`generated/examples.json`), and the MCP server's
  `get_component` returns the example with the markup to write without React.
- `check_markup` accepts every value a component renders. A default the
  stylesheet does not draw, such as `data-size="md"`, was reported as an
  error, so an agent checking the library's own output was told to remove
  correct attributes. It now also flags a theme token set inline.
- `@mlola-ui/behavior` ships `examples/`: the markup for each of its ten
  behaviors, the files the browser suite runs. A modal or sheet closes from
  any control marked `data-ml-close`, such as Cancel.
- The registry reads each component's options from its TypeScript types:
  every prop with a fixed set of values, and its default. The hand-kept
  `variants` and `sizes` had drifted from Badge, Alert, Card, Progress and
  Toast.
- Modal takes `role="alertdialog"` for a confirmation; the backdrop then
  does not dismiss it.
- Table is reachable by keyboard while it scrolls sideways.
- AvatarGroup's overflow count and AnimatedCounter's value are text for
  screen readers, not a label a span cannot carry.

### Site

- Migrating from shadcn/ui: the component map, the theme variables, variants
  as attributes, and running both side by side, tested with Tailwind CSS 4.
- Component pages show a real example, its HTML and what that HTML needs
  without React, every class with the values it takes, and every prop with
  fixed values, read from the types.
- An axe sweep of the site's own pages found, and this fixes: the theme menu
  losing its name below full width, code blocks and wide tables that scroll
  but could not be reached by keyboard, and low-contrast category counts.

### Quality

- The site's pages run the axe sweep at a desktop and a phone width.
- The HTML of every free component renders and passes axe with no framework,
  in Chromium, Firefox and WebKit, beside the behavior examples, now with
  modal, sheet, tooltip and toast.
- The runtime dependency audit ignores code samples in template literals.

## [1.0.5] — 2026-09-26

### Packages

- `add asset` asks for each file by the integrity its manifest lists, and the
  site answers with exactly those bytes. An asset redrawn after a release no
  longer breaks that release's CLI. When the server has no such version, the
  error says to update the CLI.
- The framework-free select places its listbox beside the trigger and keeps
  it there while the page scrolls; it used to open in the corner of the
  viewport.
- `placeFloating` is part of `@mlola-ui/behavior/logic`, shared by the React
  components and the framework-free runtime. The runtime loads only the
  interaction decisions now: 8.1 KB gzip for a plain page, down from 9.8.
- In Safari, closing a modal or sheet returns focus to the control that
  opened it. Safari does not focus a button it clicks, so focus used to fall
  to the page.

### Accessibility

A new axe-core sweep checks every registry item against WCAG 2.2 A and AA in
both modes. What it found is fixed:

- Resizable: the separator no longer claims an expanded state; folded reads
  as "Collapsed".
- Shortcut: the spoken keys are text for screen readers, not a label on
  `kbd`.
- Calendar: the filler weeks that align a multi-month view are hidden.
- Select: the clear button, and the notebook's page toggles, are 24 px
  targets (WCAG 2.5.8).
- Tag input: a disabled field says so with `aria-disabled`.
- Node graph: a node's selection is part of its name.
- Editor tabs: the tab list holds only tabs. The close button is for the
  pointer; the keyboard closes with Delete, announced by `aria-keyshortcuts`.
- Block editor: every block is a named text box.
- Diff view: the body scrolls sideways, so it is a focusable region.
- Notebook: nested pages are plain nested lists.

### Quality

- The rendering, keyboard and framework-free suites run in Chromium, Firefox
  and WebKit on every pull request.
- Render coverage includes the Pro components and fails on any uncaught
  error.
- The behavior budget measures what a plain page loads, following imports
  from `index.js`.

### Assets

- Finer detail on checklist, data vault, inventory, maintenance, roadmap,
  secure, settings, storage, success, terminal and workflow.

### Site

- `/asset-files` keeps every released version of every asset file, stored by
  hash and cached as immutable; the current file is still served without an
  integrity. Deploy builds that archive from the release tags
  (`scripts/asset-archive.mjs`).
- Note: the CLI of 1.0.3 and 1.0.4 asks without an integrity and gets the
  current file, so it rejects an asset redrawn since. Update to 1.0.5.

## [1.0.4] — 2026-09-26

### Packages

- `npx mlola-ui mcp`: a Model Context Protocol server for coding agents
  (Claude Code, Cursor, Codex, VS Code), with no dependency and no network.
  It answers from the registry bundled with the CLI, so it matches what
  `add` installs: `get_design_rules`, `search_components`, `get_component`,
  `get_tokens`, `check_markup`, `add_components` and `init_project`, the
  design guide as the resource `mlola://guide`, and a `build_ui` prompt.
- `check_markup` reads HTML or JSX against the element contract: classes
  that do not exist, variant classes, `data-*` values an element does not
  react to, utility classes, hand-written colors, and `data-theme` or
  `data-mode` misused. Each finding says how to fix it.
- `init` tells the project's coding agents about Mlola: `mlola.agents.md`,
  a marked section in `AGENTS.md`, `CLAUDE.md` importing it, `.mcp.json`,
  and the Cursor or VS Code config when the project uses them. Existing
  content is merged, never overwritten. `--no-agents` skips it;
  `npx mlola-ui agents` refreshes it in an existing project.
- `@mlola-ui/engine` ships `generated/agents.json`: the tokens by purpose,
  the rules for new UI and the composition primitives, as data.

### Assets

- 24 new illustrations, 46 in all: analytics, archive, blueprint, bookmarks,
  checklist, cloud sync, dashboard, data vault, documents, download,
  filters, inventory, link, maintenance, modules, notifications, package
  tracking, roadmap, search index, settings, storage, terminal, time and
  workflow.
- The existing illustrations and the 3D models are redrawn with more depth
  and detail. Their ids, props and material names are unchanged.

### Site

- A Coding agents page documents the setup for each agent.

## [1.0.3] — 2026-09-26

### Packages

- Touch sizing keeps shapes. The engine gave every button and input a 44px
  minimum height on a coarse pointer, which stretched checkboxes into bars,
  switches into ovals and icon buttons taller than wide. Now only text fields
  grow; a control drawn smaller than a fingertip adds `data-hit="expand"` and
  widens its target invisibly.
- A last cascade layer, `mlola.accessibility`: on a touch screen every field
  that takes typing is at least 16px, so iOS never zooms the page on focus.
  An app declares its own layers before it.
- New tokens: `--ml-highlight`, `--ml-knob`, `--ml-knob-shadow`, `--ml-sheen`
  and `--ml-shadow-tint`. Recipes no longer write a white, a black or a
  shadow color themselves, so a theme can finish knobs and glints its way.
- Icons draw at the theme's `--ml-icon-stroke`, so the icon channel of the
  theme vector finally shows. `--mlola-glyph-stroke` still overrides it.
- Marks on the page use the `-text` roles: Sparkline, StatusIcon and
  PriorityIcon colors now clear 3:1 against the page in every theme.
- Select, Combobox, NumberInput, OtpInput, DatePicker, TimePicker,
  ColorPicker, TagInput and SegmentedControl forward a ref to the element a
  form focuses, like the other inputs.
- Combobox opens within the visible band and never grows past it; Calendar
  wraps a second month on a narrow screen; OtpInput boxes give way on small
  phones; DiffView and FileChanges truncate the directory, not the file name;
  Scheduler starts on as many days as its width holds; Checkbox's box is a
  label, so a touch near it toggles it.
- Code syntax colors stay above 4.5:1 on highlighted, added and removed
  lines in every theme and mode, with no rule that names dark mode.
- Text alignment and padding that follow reading direction use logical
  properties.
- The agent guide teaches the design language: every token by purpose, the
  composition primitives, and the rules for building new UI that belongs.
- Prose and docs use American English throughout.

### Site and Mlola Pro

- Status words follow the shared vocabulary. **Migration:** TaskList's
  `failed` status is now `error`, and CommitHistory's `failure` check is now
  `error`. Copies already in a project keep working; update them when you
  pull the new source.
- The support and mail templates stop setting `data-mode` on their
  composers, which repainted popovers opened there in the wrong mode.
- Phones: the site header gives way through its search field at every
  width, the search dialog has a close button on touch, the docs pager fits
  320px, links meet the 24px target, and catalog grids mount live previews
  only near the screen.
- `npm run check:design` joins `npm run check`; `npm run audit:mobile` and
  `npm run audit:contrast` check the rendered site.

## [1.0.2] — 2026-09-26

### Packages

- Assets: twelve 2D illustrations (empty, error and success states) and ten
  3D models, all MIT. Illustrations paint with theme tokens, so inlined (each
  ships a React component) they follow `data-theme` and `data-mode`; as an
  image they use their own colors. Models are small glTF files whose
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
  the docs no longer run past the screen. The centered hero's badge sits in
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
  and license granted or ended notices from the Paddle webhook. Without
  RESEND_API_KEY emails are logged instead of sent. Notifications come from
  no-reply@mlola.com with replies going to hello@mlola.com.
- Nightly encrypted database backups to S3 (`scripts/ops/backup.sh`), with
  the restore steps in docs/releasing.md.
- Legal: Terms of Use, Privacy Policy, Refund Policy (14 days, handled by
  Paddle as Merchant of Record) and the Mlola Pro License, linked from the
  footer, pricing and sign-up (which now asks for consent). Delivered Pro
  files link to the license. `npm run data:prune` enforces the 12-month log
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
  file-type badges), Terminal (ANSI colors in theme roles, exit status,
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
  sticky notes, resize, color, undo). Each canvas component loads its own
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
- Notebook template: a page tree with favorites and search, pages with
  covers, icons and properties, the Block Editor, and an assistant that
  summarizes, rewrites with tracked changes and gathers open to-dos.
- Canvas Toolbar: tooltips name each tool with its shortcut key.
- Status Icon and Priority Icon (free): a work item's stage and urgency as
  glyphs readable without color, with label maps and ordered lists.
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
  (grouped, stacked, horizontal), Donut Chart (the center reads the slice
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
- Data Grid and Scheduler (Pro, workflow). The grid virtualizes rows, pins
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
  or latency reads as good news in its color and sparkline; a chart node
  shows its label as a title and takes `format` (`number`, `currency`,
  `percent`) and `stacked`. Stacked bar tooltips end with the total.
- Generative UI streams without stutter: a chart, metric or progress still
  arriving holds a placeholder of its final size and appears once, complete,
  and each new node rises in once rather than every node re-animating on
  every chunk.
- Progress eases steadily toward each new value instead of springing, so a
  bar fed frequent updates moves as one continuous line.
- Light themes whose brand color sits in the mid tones (Aerogel's violet)
  darken the fill slightly so white text reads on it, instead of flipping
  the label to black.
- The home page opens on a live scene: real components (Bot, a streaming
  answer, a tool run, a deploy notice with progress, reviewers and a metric)
  are all on stage from the first frame and tell a short story by changing
  state. Every 3.2 seconds the next canonical theme glides in: colors,
  radii, control sizes and weight are registered tokens that interpolate
  on the scene, so every component inside changes together. The scene
  tilts with the pointer, pauses off screen and holds still for reduced
  motion.
- Theme Studio is built for taste: start from a canonical theme, explore six
  variations around the current one (close, bold or wild), preview each on
  hover and continue from it, lock any channel, the color or the surface
  while exploring, undo and redo, judge the theme on product, assistant and
  data surfaces or beside a canonical theme, and copy the spec or download
  its CSS without saving. A core panel shows the tokens the theme produces
  and its contrast audit in both modes.
- Icons: `IconLock` and `IconUnlock`.
- Mlola Pro delivery. A license belongs to an account: the Paddle webhook
  grants it for the account that opened the checkout (signed, idempotent per
  transaction) and revokes it on a full refund or chargeback;
  `npm run license:grant` grants one by hand. From /account the owner makes
  CLI tokens, shown once, stored as hashes, revocable. `mlola-ui login` and
  `logout` manage the token (`MLOLA_PRO_TOKEN` in CI), and `add` installs Pro
  items from the service with their Pro dependencies, integrity-checked and
  stamped with the license, plus their stylesheets in `styles/mlola-pro.css`
  and Pro's guide for coding agents in `mlola-pro.agents.md`.
  Installs are logged and rate limited per license. Buying requires signing
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
  borrowing the primary and status colors; the first series follows the
  brand's hue. Bars are slimmer with a maximum width, spaced within a group
  and rounder; grid lines are lighter.
- One prop vocabulary across the library (see `docs/component-anatomy.md`):
  `tone` says what a color means (`neutral`, `primary`, `info`, `success`,
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
- In forced-colors mode every focused element draws a system highlight
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
- Timeline: markers sit on a rail drawn through their centers that fills as
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
