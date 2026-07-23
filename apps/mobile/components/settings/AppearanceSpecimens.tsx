import { useMemo, useState } from 'react';
import { Platform, Pressable, View, type LayoutChangeEvent } from 'react-native';
import type { CardListItem } from '@riftbound/contracts';
import { CardTile } from '@/components/cards/CardTile';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/text';
import { useTheme, type ThemeType } from '@/context/ThemeContext';
import { getCatalogIndexItems, useCatalogIndex } from '@/hooks/useCatalogIndex';
import { Layout } from '@/constants/Layout';
import { cn } from '@/lib/utils';
import type { CollectionOwnershipMap } from '@/utils/collectionOwnership';

/** Fixed specimen paints so Light/Dark previews stay readable regardless of live theme. */
const SPECIMEN = {
  light: { bg: '#f5f5f5', ink: '#1a1a1a', panel: '#e8e8e8', line: '#d0d0d0' },
  dark: { bg: '#1c1c1c', ink: '#f2f2f2', panel: '#2a2a2a', line: '#3a3a3a' },
  accent: '#d4f542',
} as const;

const THEMES: { value: ThemeType; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/** Full-size desktop catalog chrome, then scale-to-fit the specimen width. */
const GRID_COLS = 3;
const GRID_ROWS = 2;
const GRID_CARD_COUNT = GRID_COLS * GRID_ROWS;
const GRID_TILE_WIDTH = 156;
const GRID_GAP = Layout.gridGap;
const GRID_LAYOUT_WIDTH = GRID_COLS * GRID_TILE_WIDTH + (GRID_COLS - 1) * GRID_GAP;

const LIST_CARD_COUNT = 4;
/** Typical desktop catalog list column width for a 1:1 scaled sample. */
const LIST_LAYOUT_WIDTH = 420;

/**
 * Specimens fill their panel width. Inflating the virtual canvas makes the
 * same chrome render smaller while gaps/type stay proportionally identical.
 */
const PREVIEW_SCALE_FACTOR = 0.38;
const GRID_CONTENT_WIDTH = GRID_LAYOUT_WIDTH / PREVIEW_SCALE_FACTOR;
const LIST_CONTENT_WIDTH = LIST_LAYOUT_WIDTH / PREVIEW_SCALE_FACTOR;

const EMPTY_OWNERSHIP: CollectionOwnershipMap = new Map();

function ThemeSwatch({ mode }: { mode: 'light' | 'dark' | 'system' }) {
  if (mode === 'system') {
    return (
      <View className="h-16 w-full flex-row overflow-hidden rounded-md">
        <View className="flex-1" style={{ backgroundColor: SPECIMEN.light.bg }}>
          <View className="m-1.5 h-2 w-8 rounded-sm" style={{ backgroundColor: SPECIMEN.light.ink }} />
          <View
            className="mx-1.5 h-6 rounded-sm"
            style={{ backgroundColor: SPECIMEN.light.panel }}
          />
        </View>
        <View className="w-px" style={{ backgroundColor: SPECIMEN.accent }} />
        <View className="flex-1" style={{ backgroundColor: SPECIMEN.dark.bg }}>
          <View className="m-1.5 h-2 w-8 rounded-sm" style={{ backgroundColor: SPECIMEN.dark.ink }} />
          <View
            className="mx-1.5 h-6 rounded-sm"
            style={{ backgroundColor: SPECIMEN.dark.panel }}
          />
        </View>
      </View>
    );
  }

  const paint = SPECIMEN[mode];
  return (
    <View className="h-16 w-full overflow-hidden rounded-md" style={{ backgroundColor: paint.bg }}>
      <View className="flex-row items-center justify-between px-2 pt-2">
        <View className="h-2 w-10 rounded-sm" style={{ backgroundColor: paint.ink }} />
        <View className="size-2.5 rounded-sm" style={{ backgroundColor: SPECIMEN.accent }} />
      </View>
      <View className="mt-2 flex-row gap-1 px-2">
        <View className="h-7 flex-1 rounded-sm" style={{ backgroundColor: paint.panel }} />
        <View className="h-7 flex-1 rounded-sm" style={{ backgroundColor: paint.panel }} />
      </View>
      <View className="mt-1.5 h-px w-full" style={{ backgroundColor: paint.line }} />
    </View>
  );
}

/**
 * Renders real catalog tiles at full size inside a wider virtual canvas, then
 * scales the canvas to the specimen width so chrome reads as a compact miniature.
 */
function ScaleToFitPreview({
  contentWidth,
  layoutWidth,
  children,
}: {
  contentWidth: number;
  layoutWidth: number;
  children: React.ReactNode;
}) {
  const [boxWidth, setBoxWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const scale = boxWidth > 0 ? boxWidth / contentWidth : 0;
  const scaledHeight =
    scale > 0 && contentHeight > 0 ? Math.ceil(contentHeight * scale) : 96;

  const onBoxLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > 0) setBoxWidth((prev) => (prev === next ? prev : next));
  };

  const onContentLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    if (next > 0) setContentHeight((prev) => (prev === next ? prev : next));
  };

  const scaledStyle =
    Platform.OS === 'web'
      ? ({
          width: contentWidth,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        } as const)
      : {
          width: contentWidth,
          transform: [{ scale }],
          transformOrigin: 'top left' as const,
        };

  return (
    <View
      className="w-full overflow-hidden rounded-md bg-background"
      style={{ height: scaledHeight }}
      onLayout={onBoxLayout}
      pointerEvents="none"
    >
      {scale > 0 ? (
        <View style={scaledStyle}>
          <View
            className="items-center"
            style={{ width: contentWidth }}
            onLayout={onContentLayout}
          >
            <View style={{ width: layoutWidth }}>{children}</View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function GridLayoutPreview({ cards }: { cards: CardListItem[] }) {
  const slots = Array.from({ length: GRID_CARD_COUNT }, (_, i) => cards[i] ?? null);

  return (
    <ScaleToFitPreview contentWidth={GRID_CONTENT_WIDTH} layoutWidth={GRID_LAYOUT_WIDTH}>
      <View
        className="flex-row flex-wrap"
        style={{ width: GRID_LAYOUT_WIDTH, gap: GRID_GAP }}
      >
        {slots.map((card, index) => (
          <View key={card?.variantNumber ?? `grid-slot-${index}`} style={{ width: GRID_TILE_WIDTH }}>
            {card ? (
              <CardTile
                card={card}
                layout="grid"
                mode="search"
                enableQuickAdd={false}
                collectionByVariant={EMPTY_OWNERSHIP}
              />
            ) : (
              <View className="overflow-hidden rounded-xl border border-border bg-card p-2 opacity-40">
                <View className="aspect-[5/7] w-full rounded-md bg-card-panel" />
                <View className="mt-2 h-3 w-[70%] rounded bg-card-panel" />
                <View className="mt-1.5 h-2.5 w-[40%] rounded bg-card-panel" />
              </View>
            )}
          </View>
        ))}
      </View>
    </ScaleToFitPreview>
  );
}

function ListLayoutPreview({ cards }: { cards: CardListItem[] }) {
  const slots = Array.from({ length: LIST_CARD_COUNT }, (_, i) => cards[i] ?? null);

  return (
    <ScaleToFitPreview contentWidth={LIST_CONTENT_WIDTH} layoutWidth={LIST_LAYOUT_WIDTH}>
      <View style={{ width: LIST_LAYOUT_WIDTH }}>
        {slots.map((card, index) =>
          card ? (
            <CardTile
              key={card.variantNumber}
              card={card}
              layout="list"
              mode="search"
              enableQuickAdd={false}
              collectionByVariant={EMPTY_OWNERSHIP}
            />
          ) : (
            <View
              key={`list-slot-${index}`}
              className="flex-row items-center gap-4 px-4 py-3.5 opacity-40"
            >
              <View className="h-[78px] w-[56px] rounded-md bg-card-panel" />
              <View className="min-w-0 flex-1 gap-1.5">
                <View className="h-3 w-[65%] rounded bg-card-panel" />
                <View className="h-2.5 w-[40%] rounded bg-card-panel" />
                <View className="h-2 w-[30%] rounded bg-card-panel" />
              </View>
            </View>
          )
        )}
      </View>
    </ScaleToFitPreview>
  );
}

export function AppearanceSpecimens() {
  const { theme, setTheme, defaultLayout, setDefaultLayout } = useTheme();
  const catalogIndex = useCatalogIndex();
  const previewCards = useMemo(() => {
    const items = getCatalogIndexItems(catalogIndex.data);
    const withArt: CardListItem[] = [];
    for (const item of items) {
      if (!item.imageUrl) continue;
      withArt.push(item);
      if (withArt.length >= GRID_CARD_COUNT) break;
    }
    return withArt;
  }, [catalogIndex.data]);

  return (
    <View className="gap-5">
      <View className="gap-2">
        <SectionLabel className="mb-0">Theme</SectionLabel>

        <View className="flex-row gap-2">
          {THEMES.map((item) => {
            const selected = theme === item.value;
            return (
              <Pressable
                key={item.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${item.label} theme`}
                onPress={() => {
                  setTheme(item.value);
                }}
                className={cn(
                  'min-w-0 flex-1 gap-2 rounded-xl border p-2 active:opacity-90',
                  selected
                    ? 'border-ring bg-primary/10'
                    : 'border-border bg-card active:border-border'
                )}
              >
                <ThemeSwatch
                  mode={item.value === 'system' ? 'system' : item.value}
                />
                <Text
                  className={cn(
                    'px-0.5 text-sm font-semibold',
                    selected ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <SectionLabel className="mb-0">Catalog layout</SectionLabel>

        <View className="flex-row items-stretch gap-2">
          {(['list', 'grid'] as const).map((layout) => {
            const selected = defaultLayout === layout;
            return (
              <Pressable
                key={layout}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`${layout} layout`}
                onPress={() => {
                  setDefaultLayout(layout);
                }}
                className={cn(
                  'min-w-0 flex-1 gap-2 rounded-xl border p-2 active:opacity-90',
                  selected
                    ? 'border-ring bg-primary/10'
                    : 'border-border bg-card'
                )}
              >
                {layout === 'list' ? (
                  <ListLayoutPreview cards={previewCards} />
                ) : (
                  <GridLayoutPreview cards={previewCards} />
                )}
                <Text
                  className={cn(
                    'px-0.5 text-sm font-semibold capitalize',
                    selected ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {layout}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
