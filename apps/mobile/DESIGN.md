---
name: Riftrune
description: Factory instrument panel — stark black control surface for Riftbound collection work
colors:
  obsidian-canvas: "#101010"
  carbon-lift: "#1d1a18"
  ash-stroke: "#3d3a39"
  graphite-mid: "#4d4947"
  warm-granite: "#8a8380"
  pale-stone: "#b8b3b0"
  bone: "#eeeeee"
  chalk: "#fafafa"
  signal-orange: "#ee6018"
  metric-green: "#a0ca92"
typography:
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.5
  body-sm:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.43
  caption:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.24px"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-1.12px"
rounded:
  buttons: "3px"
  nav: "3px"
  cards: "10px"
  large-panels: "20px"
spacing:
  "8": "8px"
  "16": "16px"
  "24": "24px"
  "32": "32px"
  "40": "40px"
  "56": "56px"
  "80": "80px"
  "96": "96px"
components:
  button-primary:
    backgroundColor: "{colors.carbon-lift}"
    textColor: "{colors.bone}"
    rounded: "{rounded.buttons}"
    padding: "0 14px"
    height: "40px"
  button-emphasis:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.obsidian-canvas}"
    rounded: "{rounded.buttons}"
    padding: "0 14px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.bone}"
    rounded: "0px"
    padding: "24px 16px"
  button-row-add:
    backgroundColor: "{colors.chalk}"
    textColor: "{colors.obsidian-canvas}"
    rounded: "{rounded.buttons}"
    padding: "0 14px"
    height: "32px"
---

# Design System: Riftrune (Factory)

## Overview

**Creative North Star: "Terminal war room at midnight"**

Riftrune’s product UI follows Factory: a stark black control surface where the work itself is the only bright object in the room. Light bone panels and chalk CTAs land on obsidian like flashlit dispatch — depth from figure/ground contrast, not shadow or glow. Almost all interaction is monochrome; signal orange and metric green speak only as live data and status.

This is an **Operate** surface (catalog, collection, decks, wishlist). Expression never obscures task, printing identity, or ownership state. Card art and Riftbound keyword/rarity marks remain product artifacts inside the Factory chrome — they are content, not a license to restyle buttons in game-UI accents.

**Key Characteristics:**

- Obsidian canvas everywhere; bone/chalk are the only bright figures
- Weight 500 Operate baseline (Geist Medium); weight 600 (SemiBold) for dense emphasis
- Geist Mono Medium for instrument labels; sans for body and actions
- Button radius 3px; cards 10px; no soft pills as the system voice
- Chromatic color = data voice only (trends, live status, keyword badges)
- Zero shadow dependency; hairline ash strokes instead

**Migration note:** `global.css` still carries the legacy archive/lime token map. New and redesigned UI must follow this DESIGN.md. Prefer mapping Factory roles onto Uniwind tokens as they are retargeted (`background` → obsidian, `foreground` → bone, `border` → ash, `secondary`/`card-panel` → carbon, `success` → metric green, primary/status → signal for live pulses only). Until tokens land, implement with semantic classes that match these roles — do not reintroduce soft `primary/12` tint CTAs or champagne outline chrome.

## Colors

Monochrome instrument palette with two functional accents. No third brand accent for chrome.

### Primary (surfaces & text)

- **Obsidian Canvas** (`#101010`): page/app background — the void everything else is measured against
- **Carbon Lift** (`#1d1a18`): raised dark wells, dark filled buttons, subtle panel step-up
- **Bone** (`#eeeeee`): primary text and light card surfaces — the signature bright figure
- **Chalk** (`#fafafa`): high-emphasis light button fill (rare; auth and primary commit CTAs)

### Neutral (structure & secondary copy)

- **Ash Stroke** (`#3d3a39`): hairline borders, ghost outlines, separators
- **Graphite Mid** (`#4d4947`): mid fills for chart bodies / secondary dark surfaces
- **Warm Granite** (`#8a8380`): muted body, secondary copy, inactive labels
- **Pale Stone** (`#b8b3b0`): tertiary text, mono eyebrows, subdued labels

### Functional accents (data voice only)

- **Signal Orange** (`#ee6018`): live status pulses, negative/attention chart strokes, build-state dots — never button fills
- **Metric Green** (`#a0ca92`): positive trends / healthy metrics — never button fills

### Named Rules

**The Monochrome Chrome Rule.** Buttons, nav, and chrome are neutral fills or ghost strokes. Accent colors never paint CTA backgrounds.

**The Flashlit Dispatch Rule.** Hierarchy comes from bone/chalk on obsidian (or carbon step-ups), not from tinted accent washes (`primary/12`, gold outlines, soft glow).

**The Data Voice Rule.** Signal orange and metric green appear only on live status, sparklines, and true state indicators. Keyword badge colors remain domain content inside card rules text — they do not become app chrome.

## Typography

**Body / UI Font:** Geist (bundled)  
**Instrument Font:** Geist Mono (bundled)

**Character:** Medium-weight authority on dark canvas. Geist Regular reads too frail at catalog densities — Operate maps `font-normal` → Medium and `font-medium`/`font-semibold` → SemiBold. Size and tracking still create hierarchy; avoid Black/ExtraBold stacks.

### Hierarchy

- **Display** (500, 72px, lh 1, tracking −2.88px): rare marketing/empty-hero moments only
- **Heading** (500–600, 36–44px, lh ~1.1, tight tracking): screen titles when needed
- **Body** (500, 16px, lh 1.5): primary reading
- **Body-sm** (500, 14px, lh 1.43): dense UI, buttons
- **Caption / Instrument** (Geist Mono 500, 12px, uppercase, tracking −0.24px): section labels, status tags, metric units, printing IDs when treated as instrument labels

### Named Rules

**The Flat Weight Rule.** Operate baseline is Medium (500), not Regular. Use SemiBold (600) when a label must dominate a dense surface (catalog tile titles, prices, owned qty). Do not use Black stacks for everyday UI hierarchy.

**The Two Voices Rule.** Sans = page/body. Mono uppercase 12px = instrument. Seeing mono means system surface, not marketing copy.

## Layout

Base unit 8px. Comfortable density with clear section rhythm.

- Element gaps: 8 / 16 / 24
- Card padding: 24px when a bone card is used; dark instrument rows use 12–16px horizontal with hairline dividers
- Detail panels: stacked sections separated by ash hairlines — not nested soft cards
- Max content width on web ~1200px where applicable
- Mobile Operate surfaces prioritize thumb reach and stable printing identity over marketing whitespace (96px section gaps are for sparse marketing bands, not every catalog row)

## Elevation & Depth

**No drop shadows. No glow. No blur-as-elevation.**

Depth is figure/ground: bone card or chalk control on obsidian/carbon. Optional 1px near-black hairline only — never diffuse shadow.

### Named Rules

**The Contrast Elevation Rule.** If a control needs to feel pressable, raise contrast (chalk on dark, or carbon fill), do not add soft tint, border glow, or shadow.

## Shapes

- **Buttons / nav controls:** 3px radius
- **Cards / panels:** 10px radius
- **Large shells (drawers, major frames):** up to 20px
- Ghost text links may use 0px radius (flat typographic button)
- Do not use pill/`rounded-full` as the default system button shape

## Components

### Buttons

- **Dark filled (default commit on dark):** carbon lift `#1d1a18` / `#1f1d1c`, bone text, 3px radius, ~14px horizontal padding, weight 500 — collection row actions that commit inside a dark surface may use this or chalk when higher emphasis is needed
- **Light filled / chalk (high-emphasis CTA):** chalk fill, obsidian text, 3px radius — use for primary commit actions that must read as flashlit dispatch (e.g. Add to collection in detail rows, auth)
- **Ghost:** transparent, 1px ash stroke, bone text; hover shifts text/border toward chalk — no fill wash
- **Never:** soft `primary/12` tint chips, champagne/gold outlined pills, signal/metric fills

### Chips / filters

Selected state uses bone-on-obsidian or carbon invert — not accent wash. Unselected: ash stroke ghost.

### Cards / containers

Bone cards (`#eeeeee`, 10px) are rare and intentional (featured CTA / empty-state figure). Default instrument UI stays on obsidian with carbon lifts and ash hairlines — card implied by border/divider, not nested frosted panels.

### Inputs

Dark field on carbon or canvas, ash border, bone text, warm-granite placeholder. Focus: border moves toward bone/chalk — no glow ring theater.

### Navigation

Transparent or carbon well on obsidian. Labels weight 500. Active state via contrast, not accent underline glow.

### Catalog detail actions (canonical)

- **Add (printing row):** chalk filled, 3px, compact height (~32px), bone-ink text, optional plus mark in ink — primary commit
- **Wishlist:** ash ghost outline (or carbon filled when active), mono or body-sm label, optional 6px signal status pulse when wishlisted — secondary instrument control, never gold outline

### Status pulse

6px filled circle in signal orange before a live label. Optional 1px stroke. Not animated by default.

### Charts / price history

Sparklines and bars use signal (attention/down) or metric green (up). Axes and labels stay pale-stone / warm-granite.

## Do's and Don'ts

### Do

- **Do** keep the canvas near `#101010` and treat bone/chalk as the only bright figures
- **Do** use weight 500 (Medium) as the Operate baseline; reach for SemiBold on dense labels
- **Do** use Geist Mono Medium 12px uppercase for instrument labels and status
- **Do** set button radius to 3px and card radius to 10px
- **Do** build pressability with chalk or carbon fills — contrast CTAs
- **Do** reserve signal orange and metric green for live data and status pulses
- **Do** separate detail sections with ash hairlines instead of nested soft cards

### Don't

- **Don't** use soft accent tint fills (`bg-primary/12`, champagne outline pills) as the default action language
- **Don't** fill buttons with signal orange, metric green, or legacy archive lime
- **Don't** use Regular/400 as the app-wide body weight on dark Operate surfaces
- **Don't** use Black stacks for everyday UI hierarchy
- **Don't** add drop shadows, glows, or blur to fake elevation
- **Don't** mix serif display faces or decorative marketing type into Operate UI
- **Don't** round buttons into pills as the system default
- **Don't** treat Riftbound keyword colors as app chrome accents
