import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { CardArtHoverPreview } from '@/components/deck/CardArtHoverPreview';
import { DeckCardArt } from '@/components/deck/DeckCardArt';
import { DeckBuilderStatusStrip } from '@/components/deck/DeckBuilderStatusStrip';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { isCardTournamentIllegal } from '@/lib/card-legality';
import { getSectionCount, resolveDeckCardImageUrl } from '@/lib/deck-card';
import { deckSectionProgress } from '@/lib/deck-display';
import type { DeckCard, DeckEntry, DeckSectionKey, DeckState } from '@/lib/deck-types';
import { ownedCountForCardName } from '@/lib/deck-validation';
import { openCard } from '@/utils/cardNavigation';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

export const DECK_COMPOSITION_LIST_WIDTH = 320;
const THUMB_WIDTH = 36;
const THUMB_HEIGHT = Math.round(THUMB_WIDTH * 1.4);

type CompositionRow = {
  key: string;
  name: string;
  card: DeckCard;
  count: number;
  section: DeckSectionKey;
  single?: boolean;
};

interface DeckCompositionListProps {
  deck: DeckState;
  readOnly?: boolean;
  imageByVariant: ReadonlyMap<string, string>;
  collectionByName: ReadonlyMap<string, number>;
  onMinus?: (section: Exclude<DeckSectionKey, 'legend' | 'champion'>, name: string) => void;
  onPlus?: (section: Exclude<DeckSectionKey, 'legend' | 'champion'>, name: string) => void;
  onRemove?: (section: DeckSectionKey, name?: string) => void;
  onAddSection?: (section: DeckSectionKey) => void;
  onSectionPress?: (section: DeckSectionKey) => void;
  paddingBottom?: number;
  /** Hide left border when shown in a sheet / standalone column. */
  bordered?: boolean;
}

function sortedMapEntries(map: Map<string, DeckEntry>): DeckEntry[] {
  return [...map.values()].sort((a, b) => {
    if (a.card.energy !== b.card.energy) return a.card.energy - b.card.energy;
    return a.card.name.localeCompare(b.card.name);
  });
}

function ownershipTotals(
  deck: DeckState,
  collectionByName: ReadonlyMap<string, number>
): { owned: number; required: number } {
  let owned = 0;
  let required = 0;

  const add = (name: string, count: number) => {
    required += count;
    const have = ownedCountForCardName(name, collectionByName);
    if (have != null) owned += Math.min(have, count);
  };

  if (deck.legend) add(deck.legend.name, 1);
  if (deck.champion) add(deck.champion.name, 1);
  for (const entry of deck.mainDeck.values()) add(entry.card.name, entry.count);
  for (const entry of deck.sideboard.values()) add(entry.card.name, entry.count);

  return { owned, required };
}

function SectionHeader({
  title,
  countLabel,
  onAdd,
}: {
  title: string;
  countLabel: string;
  onAdd?: () => void;
}) {
  return (
    <View className="mb-1.5 mt-3 flex-row items-center justify-between gap-2 first:mt-0">
      <View className="min-w-0 flex-1 flex-row items-baseline gap-2">
        <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </Text>
        <Text className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {countLabel}
        </Text>
      </View>
      {onAdd ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add to ${title}`}
          className="size-7 items-center justify-center rounded-md border border-border bg-card-panel active:opacity-90"
          onPress={() => {
            hapticPress();
            onAdd();
          }}
        >
          <ThemedIonicon name="add" size={14} color="primary" />
        </Pressable>
      ) : null}
    </View>
  );
}

function CompositionRowView({
  row,
  imageUri,
  owned,
  illegal,
  readOnly,
  onMinus,
  onPlus,
  onRemove,
}: {
  row: CompositionRow;
  imageUri: string;
  owned: number | null;
  illegal: boolean;
  readOnly?: boolean;
  onMinus?: () => void;
  onPlus?: () => void;
  onRemove?: () => void;
}) {
  const router = useRouter();
  const shortfall = owned != null && owned < row.count;
  const canStep = !readOnly && !row.single && row.section !== 'legend' && row.section !== 'champion';

  const thumb = (
    <View
      className={cn(
        'overflow-hidden border border-white/10 bg-background',
        CARD_ART_RADIUS_CLASS
      )}
      style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }}
    >
      {imageUri ? (
        <DeckCardArt uri={imageUri} variantNumber={row.card.variantNumber} />
      ) : (
        <View className="flex-1 items-center justify-center bg-card-panel">
          <ThemedIonicon name="image-outline" size={14} color="muted-foreground" />
        </View>
      )}
    </View>
  );

  return (
    <View
      className={cn(
        'mb-1 flex-row items-center gap-2 rounded-lg border px-1.5 py-1.5',
        illegal
          ? 'border-destructive/50 bg-destructive/5'
          : shortfall
            ? 'border-warning/40 bg-warning/5'
            : 'border-border/70 bg-card'
      )}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${row.name}`}
        className="active:opacity-90"
        onPress={() => {
          hapticPress();
          openCard(router, row.card.variantNumber, 'modal');
        }}
      >
        {imageUri ? (
          <CardArtHoverPreview
            imageUri={imageUri}
            variantNumber={row.card.variantNumber}
          >
            {thumb}
          </CardArtHoverPreview>
        ) : (
          thumb
        )}
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${row.name}${illegal ? ', illegal' : ''}`}
        className="min-w-0 flex-1 active:opacity-90"
        onPress={() => {
          hapticPress();
          openCard(router, row.card.variantNumber, 'modal');
        }}
      >
        <Text
          className={cn(
            'text-[12px] font-semibold',
            illegal ? 'text-destructive' : 'text-foreground'
          )}
          numberOfLines={1}
        >
          {row.name}
        </Text>
        <View className="mt-0.5 flex-row flex-wrap items-center gap-1.5">
          <Text className="font-mono text-[10px] font-bold tabular-nums text-foreground">
            ×{row.count}
          </Text>
          {owned != null ? (
            <Text
              className={cn(
                'font-mono text-[10px] tabular-nums',
                shortfall ? 'text-warning' : 'text-success'
              )}
            >
              Own {Math.min(owned, row.count)}/{row.count}
            </Text>
          ) : null}
          {illegal ? <StatusKeywordBadge status="illegal" compact /> : null}
        </View>
      </Pressable>

      {!readOnly ? (
        <View className="shrink-0 flex-row items-center overflow-hidden rounded-md border border-border bg-card-panel">
          {canStep || row.single || row.section === 'legend' || row.section === 'champion' ? (
            <Pressable
              accessibilityLabel={`Decrease ${row.name}`}
              className="size-7 items-center justify-center active:bg-accent/80"
              onPress={() => {
                hapticPress();
                if (row.single || row.count <= 1 || row.section === 'legend' || row.section === 'champion') {
                  onRemove?.();
                  return;
                }
                onMinus?.();
              }}
            >
              <ThemedIonicon name="remove" size={14} color="foreground" />
            </Pressable>
          ) : null}
          {canStep ? (
            <Pressable
              accessibilityLabel={`Increase ${row.name}`}
              className="size-7 items-center justify-center active:bg-accent/80"
              onPress={() => {
                hapticPress();
                onPlus?.();
              }}
            >
              <ThemedIonicon name="add" size={14} color="foreground" />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function DeckCompositionList({
  deck,
  readOnly = false,
  imageByVariant,
  collectionByName,
  onMinus,
  onPlus,
  onRemove,
  onAddSection,
  onSectionPress,
  paddingBottom = 0,
  bordered = true,
}: DeckCompositionListProps) {
  const ownership = useMemo(
    () => ownershipTotals(deck, collectionByName),
    [deck, collectionByName]
  );
  const sideProgress = deckSectionProgress(deck, 'sideboard');

  const championRows = useMemo((): CompositionRow[] => {
    const rows: CompositionRow[] = [];
    if (deck.legend) {
      rows.push({
        key: `legend-${deck.legend.variantNumber}`,
        name: deck.legend.name,
        card: deck.legend,
        count: 1,
        section: 'legend',
        single: true,
      });
    }
    if (deck.champion) {
      rows.push({
        key: `champion-${deck.champion.variantNumber}`,
        name: deck.champion.name,
        card: deck.champion,
        count: 1,
        section: 'champion',
        single: true,
      });
    }
    return rows;
  }, [deck.legend, deck.champion]);

  const mainRows = useMemo(
    (): CompositionRow[] =>
      sortedMapEntries(deck.mainDeck).map((entry) => ({
        key: `main-${entry.card.name}`,
        name: entry.card.name,
        card: entry.card,
        count: entry.count,
        section: 'mainDeck' as const,
      })),
    [deck.mainDeck]
  );

  const sideRows = useMemo(
    (): CompositionRow[] =>
      sortedMapEntries(deck.sideboard).map((entry) => ({
        key: `side-${entry.card.name}`,
        name: entry.card.name,
        card: entry.card,
        count: entry.count,
        section: 'sideboard' as const,
      })),
    [deck.sideboard]
  );

  const renderRows = (rows: CompositionRow[]) =>
    rows.map((row) => {
      const owned = ownedCountForCardName(row.name, collectionByName);
      const imageUri = resolveDeckCardImageUrl(row.card, imageByVariant);
      const illegal = isCardTournamentIllegal(row.card, deck);
      const mapSection = row.section as Exclude<DeckSectionKey, 'legend' | 'champion'>;
      return (
        <CompositionRowView
          key={row.key}
          row={row}
          imageUri={imageUri}
          owned={owned}
          illegal={illegal}
          readOnly={readOnly}
          onMinus={
            row.section === 'legend' || row.section === 'champion'
              ? undefined
              : () => onMinus?.(mapSection, row.name)
          }
          onPlus={
            row.section === 'legend' || row.section === 'champion'
              ? undefined
              : () => onPlus?.(mapSection, row.name)
          }
          onRemove={() => {
            if (row.section === 'legend') {
              onRemove?.('legend');
              return;
            }
            if (row.section === 'champion') {
              onRemove?.('champion');
              return;
            }
            onRemove?.(row.section, row.name);
          }}
        />
      );
    });

  return (
    <View
      className={cn(
        'min-h-0 flex-1 bg-card-panel/40',
        bordered && 'border-l border-border'
      )}
    >
      <View className="gap-3 border-b border-border px-3 py-3">
        <Text className="text-sm font-semibold text-foreground">Deck list</Text>
        <DeckBuilderStatusStrip
          deck={deck}
          readOnly={readOnly}
          onSectionPress={onSectionPress}
          ownershipLabel={`${ownership.owned}/${ownership.required} owned`}
        />
      </View>

      <ScrollView
        className="min-h-0 flex-1"
        contentContainerStyle={{ paddingBottom, paddingHorizontal: 12, paddingTop: 4 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader
          title="Champions"
          countLabel={`${championRows.length}/2`}
          onAdd={
            readOnly || (deck.legend && deck.champion)
              ? undefined
              : () => onAddSection?.(deck.legend ? 'champion' : 'legend')
          }
        />
        {championRows.length > 0 ? (
          renderRows(championRows)
        ) : (
          <Text className="mb-1 text-[11px] text-muted-foreground">No champion selected</Text>
        )}

        <SectionHeader
          title="Main deck"
          countLabel={`${getSectionCount(deck, 'mainDeck')}/39`}
          onAdd={readOnly ? undefined : () => onAddSection?.('mainDeck')}
        />
        {mainRows.length > 0 ? (
          renderRows(mainRows)
        ) : (
          <Text className="mb-1 text-[11px] text-muted-foreground">No main deck cards</Text>
        )}

        <SectionHeader
          title="Sideboard"
          countLabel={`${sideProgress.current}/${sideProgress.target}`}
          onAdd={readOnly ? undefined : () => onAddSection?.('sideboard')}
        />
        {sideRows.length > 0 ? (
          renderRows(sideRows)
        ) : (
          <Text className="mb-1 text-[11px] text-muted-foreground">No sideboard cards</Text>
        )}
      </ScrollView>
    </View>
  );
}
