# Design

## System

riftrune.com is a task-first card catalog with a polished collector feel. It uses a restrained light interface, deep ink text, a Riftbound Fury red accent, and calm neutral surfaces so card artwork and market data remain the focus.

## Color

Use OKLCH tokens from `app/globals.css`.

- Background: true neutral off-white, not cream or sand.
- Surface: white and near-white layers for panels, controls, and rows.
- Ink: near-black for body and headings.
- Muted: cool neutral text for secondary metadata, kept at WCAG AA contrast.
- Accent: Fury red for selected state, primary actions, and important game identity.
- Success: green for owned and positive market states.
- Info: blue for watchlist and collection cues.

## Typography

Geist Sans is the single UI family. Use fixed rem sizes, tight product hierarchy, tabular numerals for prices and stats, and balanced wrapping only for card names and short headings.

## Layout

The first screen is the product, not a landing page. Desktop uses a two-column catalog/detail workspace with a sticky detail panel. Mobile collapses into a stacked browsing flow with the selected card preview before dense details. Search and filters stay high in the hierarchy.

## Components

- Top app bar with brand, section tabs, and collection actions.
- Search input with icon, typed placeholder, and clear focus state.
- Segmented filter chips for purpose, color, rarity, and owned state.
- Card result rows/cards with artwork thumbnail, metadata, prices, and collection status.
- Detail panel with official card artwork, stat strip, rules text, printings, and market rows.
- Buttons use one radius scale, visible focus, and small icon support.

## Motion

Motion is 160-220ms, mostly color, transform, and opacity. Hover/active states move subtly. Detail changes crossfade and slide a few pixels only. `prefers-reduced-motion: reduce` removes transitions and smooth scrolling.

## Accessibility

Maintain WCAG AA text contrast, never rely on color alone, keep controls keyboard reachable, and preserve clear focus rings. Images need useful alt text when they identify a card; decorative icons should be hidden from assistive tech.
