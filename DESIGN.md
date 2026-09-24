---
name: SpendWise
description: The Kanso Ledger — a personal-finance workbook stripped to its quiet essentials
colors:
  field-green: "oklch(0.47 0.12 158)"
  field-green-bright: "oklch(0.72 0.14 155)"
  rice-paper: "oklch(0.975 0.006 85)"
  card-white: "oklch(0.995 0.003 85)"
  ink-green: "oklch(0.24 0.015 160)"
  warm-chalk: "oklch(0.92 0.01 95)"
  pine-charcoal: "oklch(0.2 0.014 160)"
  quiet-sage: "oklch(0.52 0.02 130)"
  stone-line: "oklch(0.895 0.012 90)"
  slate-spend: "oklch(0.5 0.06 250)"
  moss: "oklch(0.5 0.13 155)"
  amber-caution: "oklch(0.62 0.14 75)"
  band: "oklch(0.4 0.11 158)"
  band-foreground: "oklch(0.97 0.006 85)"
  wash-moss: "oklch(0.965 0.018 150)"
  signal-red: "oklch(0.58 0.21 25)"
  chart-blue: "oklch(0.6 0.12 230)"
  chart-amber: "oklch(0.7 0.13 80)"
  chart-violet: "oklch(0.55 0.16 290)"
  chart-coral: "oklch(0.62 0.17 20)"
typography:
  display:
    fontFamily: "Fraunces, Inter, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 1.875rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  display-hero:
    fontFamily: "Fraunces, Inter, sans-serif"
    fontSize: "clamp(2.25rem, 8vw, 4.5rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label-mono:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  full: "9999px"
spacing:
  tight: "4px"
  stack: "12px"
  card: "20px"
  dialog: "24px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.field-green}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "oklch(0.47 0.12 158 / 0.9)"
  button-outline:
    backgroundColor: "{colors.rice-paper}"
    textColor: "{colors.ink-green}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink-green}"
    rounded: "{rounded.xl}"
    padding: "8px 14px"
    height: "44px"
  card-surface:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.ink-green}"
    rounded: "{rounded.xl}"
    padding: "20px"
  badge-tint:
    backgroundColor: "oklch(0.47 0.12 158 / 0.1)"
    textColor: "{colors.field-green}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  nav-active:
    backgroundColor: "oklch(0.47 0.12 158 / 0.1)"
    textColor: "{colors.field-green}"
    rounded: "{rounded.lg}"
    padding: "10px 12px"
  dialog-panel:
    backgroundColor: "{colors.rice-paper}"
    textColor: "{colors.ink-green}"
    rounded: "{rounded.xl}"
    padding: "24px"
---

# Design System: SpendWise

## Overview

**Creative North Star: "The Kanso Ledger"**

SpendWise is a money workbook that has been swept clean. The system pairs a warm paper ground with deep green-charcoal ink, one editorial serif voice for the moments that carry meaning (page titles, the wordmark, the landing promise), a workhorse grotesque for everything the user actually operates, and a monospaced micro-label for the taxonomy that organizes the ledger. Nothing decorative survives; what remains is structure, restraint, and numerals aligned like a well-kept account book.

The voice is Japanese *kanso* — simplicity as a form of respect for the reader's attention. A dashboard should lower the user's heart rate, not spike it. Emphasis comes from scale and the display face, never from saturation; alarm comes from a single amber or red token, used sparingly, so that when it appears it is instantly credible. Dark mode is not an inversion but a second material: deep pine-charcoal paper with warm chalk ink, tuned so long evening sessions don't strain the eye.

**Key Characteristics:**
- Three type voices, one job each: Fraunces (display), Inter (UI/body), IBM Plex Mono (micro-labels)
- Warm off-white / green-charcoal paper-and-ink neutrals in both themes
- `--spend` slate blue carries all spending semantics; brand green never does
- Flat by default; elevation appears only as a whisper at rest or a response to state
- Tabular numerals on every money figure, always in Inter, never in the display face
- 50 ms stagger rhythm; motion is 150–250 ms ease-out and dies under `prefers-reduced-motion`

## Colors

The palette is paper and ink with one green voice; semantics are carried by four named state colors. Light values below are the `:root` tokens; every one has a tuned `.dark` counterpart (the bright field-green, pine-charcoal, and warm-chalk entries in the frontmatter).

### Primary
- **Field Green** (`oklch(0.47 0.12 158)`): the brand voice — primary buttons, active nav, links, the wordmark's badge, focus rings. In dark mode it brightens to **Field Green Bright** (`oklch(0.72 0.14 155)`) to stay AA on pine-charcoal.

### Secondary
- **Slate Spend** (`oklch(0.5 0.06 250)`): the spending semantic — budget progress fills and chart series that mean "money out." Deliberately *not* green.

### Tertiary
- **Signal Red** (`oklch(0.58 0.21 25)`): destructive actions, over-budget values, error states.
- **Amber Caution** (`oklch(0.62 0.14 75)`): warnings — near-limit budgets, paused subscriptions.
- **Moss** (`oklch(0.5 0.13 155)`): success / income confirmations.

### Neutral
- **Rice Paper** (`oklch(0.975 0.006 85)`): page ground, light. **Pine Charcoal** (`oklch(0.2 0.014 160)`): page ground, dark.
- **Card White** (`oklch(0.995 0.003 85)`): content surface, one step brighter than the ground — surfaces separate by tone, not shadow.
- **Ink Green** (`oklch(0.24 0.015 160)`): primary text, light. **Warm Chalk** (`oklch(0.92 0.01 95)`): primary text, dark.
- **Quiet Sage** (`oklch(0.52 0.02 130)`): secondary text, eyebrows, muted labels.
- **Stone Line** (`oklch(0.895 0.012 90)`): borders, inputs, dividers, scrollbar thumb.

### Chart Series
- **Chart Green/Blue/Amber/Violet/Coral** (`--chart-1..5` in both themes): categorical data only; green holds the lead series.

### Named Rules
**The Green-Is-Not-Spend Rule.** Brand green means "the product"; slate blue means "money leaving." A chart, progress bar, or figure that spends green on outflow is a bug, not a choice.

**The One Alarm Rule.** Red and amber appear only for genuine state (error, overage, warning) — never decoration. Their rarity is what makes them credible.

## Typography

**Display Font:** Fraunces (variable; SOFT 50, WONK 1, optical sizing on), fallback Inter
**Body Font:** Inter (fallback ui-sans-serif/system-ui)
**Label/Mono Font:** IBM Plex Mono 400/500

**Character:** The quirky old-style serif gives the ledger an editorial, human voice at heading scale; Inter keeps everything the user touches neutral and fast; Plex Mono turns small labels into taxonomy. The pairing is calm-first — the serif never touches controls or numbers.

### Hierarchy
- **Display Hero** (600, `clamp(2.25rem, 8vw, 4.5rem)`, 1.02, -0.02em): landing h1 only.
- **Display** (600, 24→30px dashboard h1 / 24→36px marketing h2, -0.01em): every page title, section headline, the wordmark.
- **Title** (600, 18px): empty-state h2s, dialog titles.
- **Body** (400, 14px UI / 16px marketing prose, 1.5): all UI text; money figures at 14–24px in `tabular-nums`; the dashboard hero number is Inter 36→48px bold tabular.
- **Label** (500, 11px, 0.08em, uppercase, Plex Mono): `.label-mono` — eyebrows, card titles, table headers, auth dividers.

### Named Rules
**The One Voice Rule.** Fraunces appears only in headings, the wordmark, and the landing promise. It never sets a button, a label, a body sentence, or a number.

**The Tabular Money Rule.** Every amount gets `tabular-nums` and the Inter face; a column of figures that doesn't align is a broken ledger.

**The Single Label Rule.** `.label-mono` is the only micro-label vocabulary. No hand-rolled `text-xs uppercase tracking-wider` variants.

## Layout

Desktop: a fixed 15rem sidebar (its own tonal layer) + a max-width content column; dashboard pages run `space-y-5/6` stacks of full-width cards. Cards pad at 20px, dialogs at 24px, section gaps at 64px (marketing py-16). The page header is a fixed recipe — `.label-mono` eyebrow, display h1, one muted sentence — identical on all seven dashboard pages. Mobile: sidebar collapses to an off-canvas drawer, headers stack, table rows become definition lists, the h1 recipe holds. Density is comfortable, not dense: this is an Operate surface read in glances, so groups stay tight and separation stays generous.

## Elevation & Depth

The system is tonal first, shadowed second. Surfaces separate by paper value (ground → card → popover step up in light mode, step up in luminance in dark). Shadows exist only as a 1px whisper at rest and as a response to state: hover on opt-in `hoverable` cards, and the floating dialog. In dark mode shadows strengthen (0.3–0.5 alpha) because black-on-black depth is invisible otherwise.

### Shadow Vocabulary
- **Whisper** (`0 1px 2px rgb(0 0 0 / 0.04)`): default card and primary-button rest state.
- **Lift** (`0 4px 12px / 0.06, 0 1px 3px / 0.04`): `hover:shadow-card-hover` on interactive cards.
- **Float** (`0 12px 40px / 0.08, 0 4px 12px / 0.04`): dialogs and auth cards.
- **Frosted** (`.glass` / `.glass-sidebar`: 80% surface + 24px blur + hairline border): sticky marketing header and sidebar only.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are quiet at rest. Elevation is a message about state, never ornament.

## Shapes

Corners run on one rem-based ramp from a 0.625rem base: controls (buttons, nav) take `lg` (10px), surfaces (cards, inputs, dialogs) take `xl` (14px), chips and progress tracks go fully round. Borders are 1px stone-line hairlines — the primary structural device; a card reads as a card because of border + tonal step, not thickness. The recurring silhouette is the rounded-full pill: badges, filter chips, eyebrow pills, the progress track.

## Components

### Buttons
- **Shape:** softly curved (10px), 40px tall default, 36/44px small/large.
- **Primary:** field green fill, off-white text, whisper shadow; hover drops to 90% opacity green; active presses `scale-[0.98]`.
- **Hover / Focus:** 150 ms color transition; focus is a 1px green ring (no double outline).
- **Outline / Secondary / Ghost / Destructive / Link:** hairline-bordered paper, tonal secondary, transparent-to-accent, signal-red, and underlined-green respectively — all sharing the same shape and size ladder.

### Badges / Chips
- **Style:** fully rounded pill, 1px border or 10%-tinted semantic background, 12px medium text.
- **State:** tint follows meaning — green primary, red destructive, amber warning, moss success.

### Cards / Containers
- **Corner Style:** 14px radius; **Background:** card-white (light) / pine-card (dark); **Border:** 1px stone-line.
- **Shadow Strategy:** whisper at rest, lift on `hoverable` only.
- **Internal Padding:** 20px; header/body share it, titles ride as `.label-mono`.

### Inputs / Fields
- **Style:** 44px tall, 14px radius, transparent fill, hairline border, whisper shadow, 80%-alpha placeholder.
- **Focus:** 2px green ring + border shift to ring color.
- **Error:** border turns signal red with a 25% red ring (`aria-invalid` driven).

### Navigation
- Sidebar links: 10px radius, icon+label, 150 ms transition; **active = 10% green tint + green text + `aria-current`**; hover = tonal sidebar-accent. Mobile: off-canvas drawer with the same recipe.

### Progress
- 8px fully-rounded track in muted; indicator in a semantic tone (`primary/success/warning/danger/spend`) with a 500 ms width transition. Tone is chosen by `budgetTone()`, never by hand.

### Dialogs
- 512px max, paper panel, 24px padding, float shadow, zoom-95 + fade in 200 ms; close is a ghost X top-right.

### Page Header (signature pattern)
- `.label-mono` eyebrow → display h1 → one muted sentence. Identical on every dashboard page; the auth funnel mirrors it centered.

## Do's and Don'ts

### Do:
- **Do** display money in Inter `tabular-nums` via `formatCurrency(amount, currency)`. Amounts are totalled in the user's preferred currency, so a total is a plain sum of the resolved value (`txValue`). Show a foreign amount in its **own** currency with the converted value as a secondary `≈` value (`US$9.99 ≈ J$1,565`), never instead of it.
- **Do** use `.label-mono` for every eyebrow, card title, and table header — one label voice.
- **Do** reserve Fraunces for headings and the wordmark, with optical sizing and the WONK character on.
- **Do** pick progress/chart outflow colors from `--spend` and state colors from the semantic four.
- **Do** verify every surface in both themes at 390px and desktop widths; dark mode is first-class.
- **Do** keep motion 150–250 ms ease-out on a 50 ms stagger, and respect `prefers-reduced-motion`.

### Don't:
- **Don't** set brand green on spending semantics, or red/amber as decoration.
- **Don't** hand-roll a second uppercase micro-label recipe when `.label-mono` exists.
- **Don't** leak the display face into buttons, labels, body copy, or numerals.
- **Don't** ship a control that has no column behind it in the `user` table (no DDL via anon key — decorative settings are forbidden).
- **Don't** use nested cards, zero-blur hard-offset shadows, or glass on content surfaces (frosted is for sticky chrome only).
- **Don't** fabricate testimonials, customer counts, prices, or benchmarks — none exist as evidence.
