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
  countDeckBrowseFilters,
  deckBrowseFiltersActive,
  DEFAULT_DECK_BROWSE_FILTERS,
  type DeckBrowseFilters,
} from '@/constants/deckBrowse';
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
            summary={deckBrowseFilterSegmentSummary(segment.id, filters)}
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
      icon="options-outline"
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
  if (!deckBrowseFiltersActive(filters)) return null;

  const chips: Array<{ key: string; label: string; clear: () => void }> = [];

  if (filters.legend) {
    chips.push({
      key: 'legend',
      label: filters.legend,
      clear: () => onFiltersChange({ ...filters, legend: undefined }),
    });
  }
  if (filters.sets.length > 0) {
    chips.push({
      key: 'sets',
      label: `Sets: ${filters.sets.join(', ')}`,
      clear: () => onFiltersChange({ ...filters, sets: [] }),
    });
  }
  if (filters.isLegal === true) {
    chips.push({
      key: 'legal',
      label: 'Legal',
      clear: () => onFiltersChange({ ...filters, isLegal: undefined }),
    });
  }
  if (filters.isLegal === false) {
    chips.push({
      key: 'not-legal',
      label: 'Not legal',
      clear: () => onFiltersChange({ ...filters, isLegal: undefined }),
    });
  }
  if (filters.hasGuide) {
    chips.push({
      key: 'guide',
      label: 'Has guide',
      clear: () => onFiltersChange({ ...filters, hasGuide: false }),
    });
  }
  if (filters.hasVideo) {
    chips.push({
      key: 'video',
      label: 'Has video',
      clear: () => onFiltersChange({ ...filters, hasVideo: false }),
    });
  }
  if (filters.hasMatchups) {
    chips.push({
      key: 'matchups',
      label: 'Has matchups',
      clear: () => onFiltersChange({ ...filters, hasMatchups: false }),
    });
  }

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
              onPress={chip.clear}
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
            onClear={chip.clear}
          />
        );
      })}
    </ScrollView>
  );
}
