# Agent instructions for @riftbound/mobile

## Expo

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## UI: tetra-ui + Uniwind

This app uses [tetra-ui](https://tetra-ui.com) — shadcn/ui-style copy-paste components for React Native, styled with [Uniwind](https://docs.uniwind.dev/) (Tailwind for RN).

**All UI must use tetra-ui components and Uniwind `className` tokens. Do not use `RiftTheme`, `Colors.ts`, or `StyleSheet.create` for styling.**

### Requirements

- React 19, React Native New Architecture (`newArchEnabled: true`)
- Uniwind + Tailwind CSS v4 (`global.css`, `metro.config.js`)
- Components live in `components/ui/` (owned source, not an npm package)

### Adding components

Always use the shadcn CLI — never invent component source from scratch:

```bash
npx shadcn@latest add @tetra-ui/button
npx shadcn@latest add @tetra-ui/select
```

Registry is configured in `components.json`:

```json
{
  "registries": {
    "@tetra-ui": "https://tetra-ui.com/r/{name}.json"
  }
}
```

### Imports

```tsx
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { SearchInput } from '@/components/ui/search-input';
import { cn } from '@/lib/utils';
```

### Styling conventions

- **Visual authority:** [`PRODUCT.md`](./PRODUCT.md) + [`DESIGN.md`](./DESIGN.md). Prefer DESIGN.md over legacy soft-tint / archive-accent CTA habits when they conflict.
- Use Uniwind `className` props exclusively — never `StyleSheet.create` or inline color styles
- Use `cn()` from `@/lib/utils` for conditional classes
- Theme tokens are defined in `global.css` and mapped in `@theme inline` — color roles map to obsidian / carbon / ash / bone / chalk; signal + metric remain data only
- Standard tokens today: `bg-background`, `bg-card`, `bg-card-panel`, `bg-cta`, `text-cta-foreground`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-success` — map new work to DESIGN.md semantics
- Keyword badge colors: `bg-keyword-accelerate`, `bg-keyword-combat`, `bg-keyword-ability`, `bg-keyword-default` (see `lib/card-keywords.ts`) — domain content, not chrome
- **Riftbound UI kit** (`components/riftbound/`): use `KeywordBadge`, `StatusKeywordBadge`, `ContentKeywordBadge`, `QuantityPip`, and `EnergyPip` for game-native labels instead of generic pills. Import from `@/components/riftbound/RiftboundBadges` or the specific component file.
- Child `Text` elements must be styled directly; styles do not cascade from parent `View` classes
- `ThemeContext` syncs accent color and light/dark/system mode to Uniwind via `Uniwind.setTheme` and `Uniwind.updateCSSVariables`
- For React Navigation tab bar colors, use `useCSSVariable` from `uniwind`

### Action language

- Primary commit: chalk (`bg-cta`) with `text-cta-foreground` — 3px radius, weight 500–700
- Secondary: bordered `card-panel` or ash ghost — no soft `primary/12` tint chips
- Never: champagne/gold outline pills, chromatic CTA fills, pill radius as default
- Functional color (trends, status pulses) is data voice only — see DESIGN.md
- **Typography:** Lato (bundled) with honest weights — `font-normal` → 400, `font-medium` → 500, `font-semibold` → 600, `font-bold` → 700 (`lib/fonts.ts`). Body/UI defaults to Regular; SemiBold for structure; Bold for primary CTAs. Dense tile labels + commit CTAs use shared tokens in `constants/operateType.ts`. Instrument/mono remains Geist Mono.
- **Web / Firefox / Zen:** `ensureWebFontFaces()` registers unified `Lato` / `Geist Mono` `@font-face` rules with explicit `font-weight` and `font-display: block`. Inject before first paint (`+html.tsx` + module init) and wait on `document.fonts` in `useAppFonts` — do not register in a post-paint `useEffect` (that FOUTs a system face). Do not force `antialiased`/`grayscale` font-smoothing — that thins light-on-dark in Gecko while Chrome still looks fine. Zen on Linux often disables subpixel AA (`zen.view.experimental-rounded-view`); that is a browser bug, not a missing face.

### App providers

- `TetraProvider` wraps `KeyboardProvider`, `PortalHost`, `Toaster`, and `SafeAreaListener`
- Import `global.css` in `app/_layout.tsx`

### Do not

- Use `RiftTheme`, `constants/Colors.ts`, or hardcoded hex colors in components
- Install tetra-ui as an npm package dependency
- Use web shadcn/ui, `react-native-paper`, or DOM elements (`div`, `span`)
- Use `StyleSheet.create` — use tetra-ui primitives and `className` instead
- Generate component code without checking https://tetra-ui.com/docs/components/{name}

### Docs

- [tetra-ui docs](https://tetra-ui.com/docs)
- [Registry index](https://tetra-ui.com/r/registry.json)
- [Full LLM context](https://tetra-ui.com/llms-full.txt)
- [Uniwind quickstart](https://docs.uniwind.dev/quickstart)
