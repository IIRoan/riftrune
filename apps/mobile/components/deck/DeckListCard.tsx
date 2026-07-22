import { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { CardArtHoverPreview } from '@/components/deck/CardArtHoverPreview';
import { DeckCardArt } from '@/components/deck/DeckCardArt';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { getSectionCount, resolveDeckCardImageUrl } from '@/lib/deck-card';
import type { DeckEntry, DeckState } from '@/lib/deck-types';
import { useDeckCardImages } from '@/hooks/useDeckCardImages';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const LEGEND_SIZE = 72;
const PREVIEW_SIZE = 38;
const PREVIEW_LIMIT = 12;

interface DeckListCardProps {
  deck: DeckState;
  onPress: () => void;
  onDelete?: () => void;
  onImport?: () => void;
  importBusy?: boolean;
}

function formatUpdatedAt(updatedAt: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(new Date(updatedAt));
  } catch {
    return '';
  }
}

function CardThumb({
  imageUri,
  variantNumber,
  count,
  fallbackIcon = false,
  size,
}: {
  imageUri: string;
  variantNumber?: string;
  count?: number;
  fallbackIcon?: boolean;
  size: number;
}) {
  const thumb = (
    <View className="relative">
      <View
        className={cn(
          'overflow-hidden border border-white/10 bg-background',
          CARD_ART_RADIUS_CLASS
        )}
        style={{ width: size, height: Math.round(size * 1.4) }}
      >
        {imageUri && variantNumber ? (
          <DeckCardArt uri={imageUri} variantNumber={variantNumber} />
        ) : (
          <View className="flex-1 items-center justify-center bg-card-panel">
            {fallbackIcon ? (
              <ThemedIonicon name="star-outline" size={18} color="muted-foreground" />
            ) : null}
          </View>
        )}
      </View>
      {count != null && count > 1 ? (
        <View className="absolute -bottom-1 -right-1 rounded bg-background/95 px-1 py-px">
          <Text className="font-mono text-[9px] font-bold text-foreground">×{count}</Text>
        </View>
      ) : null}
    </View>
  );

  if (!imageUri || !variantNumber) return thumb;

  return (
    <CardArtHoverPreview imageUri={imageUri} variantNumber={variantNumber}>
      {thumb}
    </CardArtHoverPreview>
  );
}

function DeckListCardInner({
  deck,
  onPress,
  onDelete,
  onImport,
  importBusy = false,
}: DeckListCardProps) {
  const readOnly = deck.readOnly === true;

  const previewEntries = useMemo((): DeckEntry[] => {
    return [...deck.mainDeck.values()]
      .sort((a, b) => {
        if (a.card.energy !== b.card.energy) return a.card.energy - b.card.energy;
        return a.card.name.localeCompare(b.card.name);
      })
      .slice(0, PREVIEW_LIMIT);
  }, [deck.mainDeck]);

  const imageVariants = useMemo(() => {
    const variants = [
      deck.legend?.variantNumber,
      deck.champion?.variantNumber,
      ...previewEntries.map((entry) => entry.card.variantNumber),
    ].filter((value): value is string => Boolean(value));
    return [...new Set(variants)].sort().join('|');
  }, [deck.legend?.variantNumber, deck.champion?.variantNumber, previewEntries]);

  const { data: imageByVariant = new Map<string, string>() } = useDeckCardImages(imageVariants);

  const mainCount = getSectionCount(deck, 'mainDeck') + (deck.champion ? 1 : 0);
  const runeCount = getSectionCount(deck, 'runes');
  const battlefieldCount = getSectionCount(deck, 'battlefields');
  const sideCount = getSectionCount(deck, 'sideboard');
  const uniqueMain = deck.mainDeck.size;
  const updatedLabel = formatUpdatedAt(deck.updatedAt);

  const legendUri = deck.legend
    ? resolveDeckCardImageUrl(deck.legend, imageByVariant)
    : '';
  const championUri = deck.champion
    ? resolveDeckCardImageUrl(deck.champion, imageByVariant)
    : '';

  const identityLine = deck.legend
    ? `${deck.legend.name}${deck.champion ? ` · ${deck.champion.name}` : ''}`
    : 'No legend selected';

  const description = deck.description?.trim() ?? '';
  const remainingMain = Math.max(0, uniqueMain - previewEntries.length);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${deck.name}. ${identityLine}`}
      onPress={() => {
        hapticPress();
        onPress();
      }}
      className="overflow-hidden rounded-xl border border-border bg-card active:border-ring active:bg-card-panel"
    >
      <View className="gap-3 p-3.5">
        <View className="flex-row gap-3">
          <View className="flex-row items-end gap-1.5">
            <CardThumb
              imageUri={legendUri}
              variantNumber={deck.legend?.variantNumber}
              fallbackIcon
              size={LEGEND_SIZE}
            />
            {deck.champion ? (
              <CardThumb
                imageUri={championUri}
                variantNumber={deck.champion.variantNumber}
                size={Math.round(LEGEND_SIZE * 0.72)}
              />
            ) : null}
          </View>

          <View className="min-w-0 flex-1 justify-between gap-2">
            <View className="flex-row items-start gap-2">
              <View className="min-w-0 flex-1">
                <Text
                  className="text-[15px] font-semibold leading-5 text-foreground"
                  numberOfLines={1}
                >
                  {deck.name}
                </Text>
                <Text
                  className="mt-0.5 text-[12px] leading-4 text-muted-foreground"
                  numberOfLines={1}
                >
                  {identityLine}
                </Text>
                {description ? (
                  <Text
                    className="mt-1 text-[12px] leading-4 text-muted-foreground"
                    numberOfLines={2}
                  >
                    {description}
                  </Text>
                ) : null}
              </View>

              {onDelete ? (
                <Pressable
                  accessibilityLabel={`Delete ${deck.name}`}
                  hitSlop={6}
                  className="size-8 shrink-0 items-center justify-center rounded-lg active:bg-destructive/10"
                  onPress={(event) => {
                    event.stopPropagation?.();
                    hapticPress();
                    onDelete();
                  }}
                >
                  <ThemedIonicon name="trash-outline" size={17} color="muted-foreground" />
                </Pressable>
              ) : null}
            </View>

            <View className="gap-0.5">
              <Text className="font-mono text-[11px] tabular-nums text-muted-foreground">
                Main {mainCount}
                {uniqueMain > 0 ? ` · ${uniqueMain} unique` : ''}
                {' · '}Runes {runeCount}
                {' · '}Fields {battlefieldCount}
                {sideCount > 0 ? ` · Side ${sideCount}` : ''}
              </Text>
              <View className="flex-row flex-wrap items-center gap-x-2 gap-y-0.5">
                {readOnly ? (
                  <Text className="text-[11px] font-medium text-muted-foreground">Imported</Text>
                ) : null}
                {updatedLabel ? (
                  <Text className="text-[11px] text-muted-foreground">Edited {updatedLabel}</Text>
                ) : null}
                {deck.legend?.colors?.length ? (
                  <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
                    {deck.legend.colors.join(' · ')}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {previewEntries.length > 0 ? (
          <View className="flex-row flex-wrap items-end gap-1.5">
            {previewEntries.map((entry) => (
              <CardThumb
                key={entry.card.variantNumber}
                imageUri={resolveDeckCardImageUrl(entry.card, imageByVariant)}
                variantNumber={entry.card.variantNumber}
                count={entry.count}
                size={PREVIEW_SIZE}
              />
            ))}
            {remainingMain > 0 ? (
              <View
                className={cn(
                  'items-center justify-center border border-dashed border-border bg-card-panel',
                  CARD_ART_RADIUS_CLASS
                )}
                style={{ width: PREVIEW_SIZE, height: Math.round(PREVIEW_SIZE * 1.4) }}
              >
                <Text className="font-mono text-[11px] font-semibold text-muted-foreground">
                  +{remainingMain}
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <Text className="text-[12px] text-muted-foreground">
            {readOnly
              ? 'Open to view the full imported deck'
              : 'No main deck cards yet · Edit to add cards'}
          </Text>
        )}

        {readOnly && onImport ? (
          <Pressable
            accessibilityLabel={`Import ${deck.name} to my decks`}
            accessibilityState={{ disabled: importBusy }}
            className="self-start rounded-lg border border-primary/30 px-2.5 py-1.5 active:bg-primary/10"
            disabled={importBusy}
            onPress={(event) => {
              event.stopPropagation?.();
              hapticPress();
              onImport();
            }}
          >
            <Text className="text-[12px] font-medium text-primary">
              {importBusy ? 'Importing…' : 'Import to my decks'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

function deckListCardPropsEqual(prev: DeckListCardProps, next: DeckListCardProps): boolean {
  return (
    prev.deck.id === next.deck.id &&
    prev.deck.updatedAt === next.deck.updatedAt &&
    prev.deck.name === next.deck.name &&
    prev.importBusy === next.importBusy &&
    Boolean(prev.onDelete) === Boolean(next.onDelete) &&
    Boolean(prev.onImport) === Boolean(next.onImport)
  );
}

export const DeckListCard = memo(DeckListCardInner, deckListCardPropsEqual);
