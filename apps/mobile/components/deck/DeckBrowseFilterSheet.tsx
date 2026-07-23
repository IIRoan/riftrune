import { SlidersHorizontalIcon } from '@/components/icons';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { CatalogToolbarBadgeDot, CatalogToolbarButton } from '@/components/catalog/CatalogToolbarButton';
import { DeckBrowseFilterSegmentPanel } from '@/components/deck/DeckBrowseFilterPanels';
import {
  FilterAccordionGroup,
  FilterAccordionSection,
  MobileFilterSheet,
} from '@/components/filters/MobileFilterSheet';
import { FilterKeywordChip } from '@/components/riftbound/RiftboundBadges';
import { Text } from '@/components/ui/text';
import {
  buildDeckBrowseFilterChips,
  countDeckBrowseFilters,
  deckBrowseFiltersActive,
  DEFAULT_DECK_BROWSE_FILTERS,
  type DeckBrowseFilters,
} from '@/constants/deckBrowse';
import { useDeckBrowseFilterOptions } from '@/hooks/useDeckBrowseFilters';
import {
  DECK_BROWSE_FILTER_SEGMENTS,
  deckBrowseFilterSegmentActive,
  deckBrowseFilterSegmentSummary,
} from '@/lib/deck-browse';

interface DeckBrowseFilterSheetProps {
  visible: boolean;
  filters: DeckBrowseFilters;
  onClose: () => void;
  onFiltersChange: (filters: DeckBrowseFilters) => void;
}

function defaultOpenSegments(filters: DeckBrowseFilters): string[] {
  const active = DECK_BROWSE_FILTER_SEGMENTS.filter((segment) =>
    deckBrowseFilterSegmentActive(segment.id, filters)
  ).map((segment) => segment.id);

  if (active.length > 0) return active;
  return ['legends'];
}

export function DeckBrowseFilterSheet({
  visible,
  filters,
  onClose,
  onFiltersChange,
}: DeckBrowseFilterSheetProps) {
  const activeCount = countDeckBrowseFilters(filters);
  const { setNameByCode } = useDeckBrowseFilterOptions();
  const accordionKey = visible ? 'open' : 'closed';
  const defaultOpen = useMemo(() => defaultOpenSegments(filters), [filters, accordionKey]);

  return (
    <MobileFilterSheet
      visible={visible}
      onClose={onClose}
      activeCount={activeCount}
      hasActiveFilters={deckBrowseFiltersActive(filters)}
      onClear={() => onFiltersChange(DEFAULT_DECK_BROWSE_FILTERS)}
      doneLabel="Show decks"
      portalName="deck-browse-filter-sheet"
    >
      <FilterAccordionGroup key={accordionKey} defaultOpen={defaultOpen}>
        {DECK_BROWSE_FILTER_SEGMENTS.map((segment) => (
          <FilterAccordionSection
            key={segment.id}
            value={segment.id}
            label={segment.label}
            summary={deckBrowseFilterSegmentSummary(segment.id, filters, setNameByCode)}
            active={deckBrowseFilterSegmentActive(segment.id, filters)}
          >
            <DeckBrowseFilterSegmentPanel
              segment={segment.id}
              filters={filters}
              onFiltersChange={onFiltersChange}
              enabled={visible}
              presentation="mobile"
            />
          </FilterAccordionSection>
        ))}
      </FilterAccordionGroup>
    </MobileFilterSheet>
  );
}

export function DeckBrowseFilterTrigger({
  filters,
  onPress,
}: {
  filters: DeckBrowseFilters;
  onPress: () => void;
}) {
  const activeCount = countDeckBrowseFilters(filters);
  const active = activeCount > 0;

  return (
    <CatalogToolbarButton
      icon={SlidersHorizontalIcon}
      onPress={onPress}
      accessibilityLabel="Open filters"
      active={active}
      mobile
      label="Filters"
      badge={
        active ? (
          activeCount === 1 ? (
            <CatalogToolbarBadgeDot />
          ) : (
            <View className="size-5 items-center justify-center rounded-full bg-primary">
              <Text className="font-mono text-[11px] font-semibold text-primary-foreground">
                {activeCount}
              </Text>
            </View>
          )
        ) : null
      }
    />
  );
}

export function DeckBrowseActiveFilterChips({
  filters,
  onFiltersChange,
}: {
  filters: DeckBrowseFilters;
  onFiltersChange: (filters: DeckBrowseFilters) => void;
}) {
  const { setNameByCode } = useDeckBrowseFilterOptions();
  const chips = useMemo(
    () => buildDeckBrowseFilterChips(filters, setNameByCode),
    [filters, setNameByCode]
  );

  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="flex-row gap-2 pr-1"
    >
      {chips.map((chip) => {
        const keywordBase =
          chip.key === 'legal'
            ? 'ACCELERATE'
            : chip.key === 'not-legal'
              ? 'ASSAULT'
              : chip.key === 'video'
                ? 'REACTION'
                : chip.key === 'guide'
                  ? 'VISION'
                  : chip.key === 'matchups'
                    ? 'DEATHKNELL'
                    : 'DEFAULT';

        const keywordLabel =
          chip.key === 'legal'
            ? 'LEGAL'
            : chip.key === 'not-legal'
              ? 'ILLEGAL'
              : chip.key === 'video'
                ? 'VIDEO'
                : chip.key === 'guide'
                  ? 'GUIDE'
                  : chip.key === 'matchups'
                    ? 'MATCHUPS'
                    : chip.label.toUpperCase();

        if (chip.key === 'legend' || chip.key === 'sets') {
          return (
            <Pressable
              key={chip.key}
              className="h-9 flex-row items-center gap-1.5 rounded-xl border border-border bg-card-panel px-3 active:opacity-80"
              onPress={() => onFiltersChange(chip.applyClear(filters))}
              accessibilityLabel={`Clear ${chip.label} filter`}
            >
              <Text className="text-sm font-semibold text-foreground">{chip.label}</Text>
              <Text className="text-muted-foreground">×</Text>
            </Pressable>
          );
        }

        return (
          <FilterKeywordChip
            key={chip.key}
            label={keywordLabel}
            keywordBase={keywordBase}
            onClear={() => onFiltersChange(chip.applyClear(filters))}
          />
        );
      })}
    </ScrollView>
  );
}
