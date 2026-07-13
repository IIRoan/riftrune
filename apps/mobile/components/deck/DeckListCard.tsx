import { DeckCardArt } from '@/components/deck/DeckCardArt';
import { DeckLegalityBadge } from '@/components/deck/DeckLegalityBadge';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { getSectionCount, resolveDeckCardImageUrl } from '@/lib/deck-card';
import type { DeckState } from '@/lib/deck-types';
import { deckValidationHasErrors } from '@riftbound/contracts';
import { deckHasBannedCards } from '@/lib/card-legality';
import { validateDeck } from '@/lib/deck-validation';
import { useDeckCardImages } from '@/hooks/useDeckCardImages';
import { useDeckLiveLegality } from '@/hooks/useBanDatesByVariant';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { Pressable, View } from 'react-native';

const PREVIEW_SIZE = 44;

interface DeckListCardProps {
  deck: DeckState;
  onPress: () => void;
  onDelete?: () => void;
  onImport?: () => void;
  importBusy?: boolean;
}

function DeckPreviewThumb({
  imageUri,
  variantNumber,
  label,
  showLegendFallback = false,
}: {
  imageUri: string;
  variantNumber?: string;
  label?: string;
  showLegendFallback?: boolean;
}) {
  return (
    <View className="relative">
      <View
        className={cn(
          'overflow-hidden border border-white/10 bg-background',
          CARD_ART_RADIUS_CLASS
        )}
        style={{ width: PREVIEW_SIZE, height: Math.round(PREVIEW_SIZE * 1.4) }}
      >
        {imageUri ? (
          <DeckCardArt uri={imageUri} variantNumber={variantNumber ?? imageUri} />
        ) : (
          <View className="flex-1 items-center justify-center bg-card-panel">
            {showLegendFallback ? (
              <ThemedIonicon name="star-outline" size={18} color="muted-foreground" />
            ) : null}
          </View>
        )}
      </View>
      {label ? (
        <View className="absolute -bottom-1 -right-1 rounded bg-background/95 px-1 py-px">
          <Text className="font-mono text-[9px] font-bold text-muted-foreground">{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function DeckListCard({
  deck,
  onPress,
  onDelete,
  onImport,
  importBusy = false,
}: DeckListCardProps) {
  const readOnly = deck.readOnly === true;
  const previewVariants = [
    deck.legend?.variantNumber,
    deck.champion?.variantNumber,
    ...[...deck.mainDeck.values()].slice(0, 3).map((entry) => entry.card.variantNumber),
  ].filter((value): value is string => Boolean(value));
  const variantKey = [...new Set(previewVariants)].sort().join('|');

  const { data: imageByVariant = new Map<string, string>() } = useDeckCardImages(variantKey);
  const { deck: liveDeck } = useDeckLiveLegality(deck);
  const displayDeck = liveDeck ?? deck;
  const messages = validateDeck(displayDeck);
  const hasErrors = deckValidationHasErrors(messages);
  const hasBannedCards = deckHasBannedCards(displayDeck);
  const mainCount = getSectionCount(deck, 'mainDeck') + (deck.champion ? 1 : 0);
  const runeCount = getSectionCount(deck, 'runes');
  const battlefieldCount = getSectionCount(deck, 'battlefields');

  const legendUri = deck.legend
    ? resolveDeckCardImageUrl(deck.legend, imageByVariant)
    : '';
  const previewCards = [...deck.mainDeck.values()].slice(0, 3);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        hapticPress();
        onPress();
      }}
      className="overflow-hidden rounded-xl border border-archive-soft-line bg-card active:border-ring active:bg-card-panel"
    >
      <View className="flex-row gap-3 p-4">
        <DeckPreviewThumb
          imageUri={legendUri}
          variantNumber={deck.legend?.variantNumber}
          label="L"
          showLegendFallback
        />

        <View className="min-w-0 flex-1 gap-2">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1">
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {deck.name}
              </Text>
              {deck.description ? (
                <Text className="mt-0.5 text-[12px] text-muted-foreground" numberOfLines={2}>
                  {deck.description}
                </Text>
              ) : null}
              <Text className="mt-0.5 font-mono text-[12px] text-muted-foreground">
                Main {mainCount} · Runes {runeCount}/12 · Fields {battlefieldCount}/3
              </Text>
              {deck.legend ? (
                <Text className="mt-0.5 text-[12px] text-muted-foreground" numberOfLines={1}>
                  {deck.legend.name}
                  {deck.champion ? ` · ${deck.champion.name}` : ''}
                </Text>
              ) : null}
            </View>
            <View className="shrink-0 items-end gap-1.5">
              {hasBannedCards ? (
                <DeckLegalityBadge isLegal={false} compact />
              ) : null}
              <StatusKeywordBadge
                status={
                  readOnly ? 'imported' : hasErrors ? 'warning' : 'valid'
                }
                compact
              />
            </View>
          </View>

          {previewCards.length > 0 ? (
            <View className="flex-row items-end gap-1.5">
              {previewCards.map((entry) => (
                <DeckPreviewThumb
                  key={entry.card.name}
                  imageUri={resolveDeckCardImageUrl(entry.card, imageByVariant)}
                  variantNumber={entry.card.variantNumber}
                />
              ))}
            </View>
          ) : readOnly ? (
            <Text className="text-[12px] text-muted-foreground">
              Open to view the full imported deck
            </Text>
          ) : (
            <Text className="text-[12px] text-muted-foreground">No main deck cards yet</Text>
          )}
        </View>
      </View>

      {onDelete ? (
        <Pressable
          accessibilityLabel={`Delete ${deck.name}`}
          className="border-t border-archive-soft-line px-4 py-2.5 active:bg-destructive/5"
          onPress={(event) => {
            event.stopPropagation?.();
            void onDelete();
          }}
        >
          <Text className="text-right text-sm font-medium text-destructive">Delete deck</Text>
        </Pressable>
      ) : readOnly && onImport ? (
        <Pressable
          accessibilityLabel={`Import ${deck.name} to my decks`}
          className="border-t border-archive-soft-line px-4 py-2.5 active:bg-primary/5"
          disabled={importBusy}
          onPress={(event) => {
            event.stopPropagation?.();
            onImport();
          }}
        >
          <Text className="text-right text-sm font-medium text-primary">
            {importBusy ? 'Importing…' : 'Import to my decks'}
          </Text>
        </Pressable>
      ) : readOnly ? (
        <View className="border-t border-archive-soft-line px-4 py-2.5">
          <Text className="text-right text-sm text-muted-foreground">View only</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
