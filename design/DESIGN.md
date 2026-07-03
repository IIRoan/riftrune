# Design

## System

riftrune.com is a task-first card catalog with a pure monochrome dark aesthetic: a zero-chroma neutral ramp where card artwork and foils pop against the flat black. A single chartreuse accent carries selection and primary actions only. Navigation lives in a floating side rail. No hue tints, no red, no decorative color.

## Color

Use OKLCH tokens from `app/globals.css` (`--archive-*`).

- Background / neutral ramp: zero-chroma pure gray (`oklch(L 0 0)`), five stepped layers from bg through raised.
- Ink: near-white at chroma 0.
- Muted / subtle: mid-gray steps, all chroma 0, WCAG AA on their surfaces.
- Accent: chartreuse `oklch(0.82 0.20 112)` for primary actions, selection rings, active tab indicators, and progress fills. Used nowhere decorative. `--archive-accent-ink` is near-black (text on chartreuse bg). `--archive-accent-text` is the lighter chartreuse for text on dark surfaces.
- Success: green for owned cues and positive market trends.
- Warning: muted amber for negative market trends.
- Trends carry sign + arrow, never color alone.

## Typography

Geist Sans for UI labels, names, and prose. Geist Mono for card numbers (OGN-001), prices, percentages, counts, and stat values; always tabular-nums. Fixed rem sizes with a tight product scale.

## Layout

The first screen is the product, not a landing page. Desktop uses a two-column catalog/detail workspace with a sticky detail panel; an xl-only rail carries Collection and Week movers. Mobile collapses into a stacked browsing flow. Search and quick filters (game-facet chips only: color, type, rarity) stay high in the hierarchy; ownership and wishlist filtering lives in Advanced filters.

## Components

- Slim top app bar: blue rune mark + wordmark, hairline divider, nav tabs with a blue underline on the active tab, icon-button alerts, blue Add card (icon-only on mobile).
- Search input with icon, `/` keyboard hint, and blue focus ring.
- Filters dropdown (Base UI Menu): grouped radio list (All cards / Collection: Owned, Wishlist / Game: Fury, Units, Rares), blue count badge on the trigger when active, and an inline clear chip showing the active filter. No quick chip row.
- Card result rows inside one bordered list card: thumbnail with white/10 ring (blue 2px ring when selected), name + mono card number, meta line, ownership dot, mono price + trend tag.
- Collection rail: bordered summary card with mono fraction counts (123/202) and 1px blue progress bars, wishlist row, and a Week movers list with trend tags.
- Detail panel: fits one desktop screen without internal scrolling. Art on a compact radial "spotlight" pedestal with drop shadow, title row with a kebab (3-dot) menu holding secondary actions (Price history, Compare printings, Add to wishlist, Share card), stat strip (Cost pip, Might, Owned), meta grid, rules text with real game symbols, side-by-side Normal/Foil market cells, and one full-width blue Watch button.

## Motion

Motion is 160-220ms with ease-out. Detail panel content fades and slides 4px on card change (`archive-detail-enter`). Hover states shift background/color only. `prefers-reduced-motion: reduce` removes transitions and animations.

## Accessibility

Maintain WCAG AA text contrast on dark surfaces, never rely on color alone (trends carry sign + arrow, ownership carries text), keep controls keyboard reachable with visible offset focus rings, `aria-pressed` on selectable rows and chips, and useful alt text on identifying card images.
