import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { getSectionCount, resolveDeckCardImageUrl } from '@/lib/deck-card';
import type { DeckState } from '@/lib/deck-types';
import { deckHasErrors, validateDeck } from '@/lib/deck-validation';
import { useDeckCardImages } from '@/hooks/useDeckCardImages';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

const PREVIEW_SIZE = 44;

interface DeckListCardProps {
  deck: DeckState;
  onPress: () => void;
  onDelete: () => void;
}

function DeckPreviewThumb({
  imageUri,
  label,
  showLegendFallback = false,
}: {
  imageUri: string;
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
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            contentPosition="top"
            transition={120}
            cachePolicy="memory-disk"
          />
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

export function DeckListCard({ deck, onPress, onDelete }: DeckListCardProps) {
  const variantNumbers = [
    deck.legend?.variantNumber,
    deck.champion?.variantNumber,
    ...[...deck.mainDeck.values()].slice(0, 3).map((entry) => entry.card.variantNumber),
  ].filter((value): value is string => Boolean(value));

  const { data: imageByVariant = new Map<string, string>() } = useDeckCardImages(variantNumbers);
  const messages = validateDeck(deck);
  const hasErrors = deckHasErrors(messages);
  const mainCount = getSectionCount(deck, 'mainDeck');
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
        <DeckPreviewThumb imageUri={legendUri} label="L" showLegendFallback />

        <View className="min-w-0 flex-1 gap-2">
          <View className="flex-row items-start justify-between gap-2">
            <View className="min-w-0 flex-1">
              <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
                {deck.name}
              </Text>
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
            <View
              className={cn(
                'shrink-0 rounded-full px-2 py-1',
                hasErrors ? 'bg-warning/15' : 'bg-success/15'
              )}
            >
              <Text
                className={cn(
                  'text-[11px] font-semibold',
                  hasErrors ? 'text-warning' : 'text-success'
                )}
              >
                {hasErrors ? 'Needs work' : 'Valid'}
              </Text>
            </View>
          </View>

          {previewCards.length > 0 ? (
            <View className="flex-row items-end gap-1.5">
              {previewCards.map((entry) => (
                <DeckPreviewThumb
                  key={entry.card.name}
                  imageUri={resolveDeckCardImageUrl(entry.card, imageByVariant)}
                />
              ))}
            </View>
          ) : (
            <Text className="text-[12px] text-muted-foreground">No main deck cards yet</Text>
          )}
        </View>
      </View>

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
    </Pressable>
  );
}
