import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { CatalogToolbarBadgeDot, CatalogToolbarButton } from '@/components/catalog/CatalogToolbarButton';
import { FilterKeywordChip } from '@/components/riftbound/RiftboundBadges';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetScrollView,
  BottomSheetTitle,
} from '@/components/ui/bottom-sheet';
import { Button, ButtonText } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import {
  catalogToolbarGroupClass,
  catalogToolbarSegmentClasses,
} from '@/constants/catalogToolbar';
import {
  countDeckBrowseFilters,
  deckBrowseFiltersActive,
  DECK_BROWSE_SET_OPTIONS,
  DEFAULT_DECK_BROWSE_FILTERS,
  type DeckBrowseFilters,
} from '@/constants/deckBrowse';
import { useDebounce } from '@/hooks/useDebounce';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import {
  DECK_BROWSE_FILTER_SEGMENTS,
  deckBrowseFilterSegmentActive,
  type DeckBrowseFilterSegment,
} from '@/lib/deck-browse';
import { api } from '@/src/api/client';
import { cardQueryKeys } from '@/src/api/queryKeys';
import { cn } from '@/lib/utils';

interface DeckBrowseFilterSheetProps {
  visible: boolean;
  filters: DeckBrowseFilters;
  onClose: () => void;
  onFiltersChange: (filters: DeckBrowseFilters) => void;
}

function ToggleRow({
  label,
  subtitle,
  active,
  onPress,
}: {
  label: string;
  subtitle?: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={cn(
        'min-h-12 flex-row items-center justify-between rounded-xl border px-3 py-2.5 active:opacity-90',
        active ? 'border-ring/50 bg-card-panel' : 'border-transparent bg-transparent'
      )}
      onPress={onPress}
    >
      <View className="min-w-0 flex-1 pr-3">
        <Text className="text-sm font-medium text-foreground">{label}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</Text>
        ) : null}
      </View>
      {active ? (
        <ThemedIonicon name="checkmark-circle" size={20} color="archive-accent-text" />
      ) : (
        <View className="size-5 rounded-full border border-border" />
      )}
    </Pressable>
  );
}

function FilterSegmentBar({
  activeSegment,
  filters,
  onSegmentChange,
}: {
  activeSegment: DeckBrowseFilterSegment;
  filters: DeckBrowseFilters;
  onSegmentChange: (segment: DeckBrowseFilterSegment) => void;
}) {
  return (
    <View className={cn(catalogToolbarGroupClass(true), 'mb-3')}>
      {DECK_BROWSE_FILTER_SEGMENTS.map((segment) => {
        const active = activeSegment === segment.id;
        const hasValue = deckBrowseFilterSegmentActive(segment.id, filters);
        return (
          <Pressable
            key={segment.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={cn(
              catalogToolbarSegmentClasses(active, true),
              'relative min-h-10 px-2'
            )}
            onPress={() => onSegmentChange(segment.id)}
          >
            <Text
              className={cn(
                'text-center text-[11px] font-semibold',
                active ? 'text-foreground' : 'text-muted-foreground'
              )}
              numberOfLines={1}
            >
              {segment.label}
            </Text>
            {hasValue ? (
              <View className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function DeckBrowseFilterSheet({
  visible,
  filters,
  onClose,
  onFiltersChange,
}: DeckBrowseFilterSheetProps) {
  const reduceMotion = useReduceMotion();
  const snapPoints = reduceMotion ? ['92%'] : ['72%', '92%'];
  const [activeSegment, setActiveSegment] = useState<DeckBrowseFilterSegment>('legends');
  const [legendQuery, setLegendQuery] = useState('');
  const debouncedLegendQuery = useDebounce(legendQuery.trim(), 300);

  const legendsQuery = useQuery({
    queryKey: cardQueryKeys.search(debouncedLegendQuery || 'type:legend', 50, 'name', 'asc'),
    queryFn: () =>
      api.listCards({
        q: debouncedLegendQuery || undefined,
        types: 'Legend',
        limit: 50,
        page: 1,
        sortBy: 'name',
        dir: 'asc',
      }),
    enabled: visible && activeSegment === 'legends',
    staleTime: 60_000,
  });

  const legendOptions = useMemo(
    () =>
      (legendsQuery.data?.data ?? [])
        .filter((item) => item.type.toLowerCase() === 'legend')
        .map((item) => item.name),
    [legendsQuery.data?.data]
  );

  const update = (patch: Partial<DeckBrowseFilters>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const toggleSet = (code: string) => {
    const next = filters.sets.includes(code)
      ? filters.sets.filter((value) => value !== code)
      : [...filters.sets, code];
    update({ sets: next });
  };

  const renderSegmentContent = () => {
    switch (activeSegment) {
      case 'legends':
        return (
          <View className="gap-2">
            <SearchInput
              value={legendQuery}
              onChangeText={setLegendQuery}
              placeholder="Search legends"
              accessibilityLabel="Search legends"
              className="min-h-11 rounded-xl border-border bg-card"
            />
            {filters.legend ? (
              <ToggleRow
                label={filters.legend}
                subtitle="Selected legend"
                active
                onPress={() => update({ legend: undefined })}
              />
            ) : null}
            {legendsQuery.isLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator />
              </View>
            ) : legendOptions.length === 0 ? (
              <Text className="py-6 text-center text-sm text-muted-foreground">
                No legends match your search.
              </Text>
            ) : (
              legendOptions.map((name) => (
                <ToggleRow
                  key={name}
                  label={name}
                  active={filters.legend === name}
                  onPress={() => update({ legend: filters.legend === name ? undefined : name })}
                />
              ))
            )}
          </View>
        );
      case 'sets':
        return (
          <View className="gap-1">
            {DECK_BROWSE_SET_OPTIONS.map((set) => (
              <ToggleRow
                key={set.code}
                label={set.name}
                subtitle={set.code}
                active={filters.sets.includes(set.code)}
                onPress={() => toggleSet(set.code)}
              />
            ))}
          </View>
        );
      case 'legality':
        return (
          <View className="gap-1">
            <ToggleRow
              label="All decks"
              subtitle="No legality filter"
              active={filters.isLegal === undefined}
              onPress={() => update({ isLegal: undefined })}
            />
            <ToggleRow
              label="Legal only"
              subtitle="Tournament-legal decklists"
              active={filters.isLegal === true}
              onPress={() => update({ isLegal: filters.isLegal === true ? undefined : true })}
            />
            <ToggleRow
              label="Not legal"
              subtitle="Contains banned or restricted cards"
              active={filters.isLegal === false}
              onPress={() => update({ isLegal: filters.isLegal === false ? undefined : false })}
            />
          </View>
        );
      case 'content':
        return (
          <View className="gap-1">
            <ToggleRow
              label="Has guide"
              subtitle="Deck includes a written guide"
              active={filters.hasGuide}
              onPress={() => update({ hasGuide: !filters.hasGuide })}
            />
            <ToggleRow
              label="Has video"
              subtitle="Deck includes a video link"
              active={filters.hasVideo}
              onPress={() => update({ hasVideo: !filters.hasVideo })}
            />
            <ToggleRow
              label="Has matchups"
              subtitle="Deck includes matchup notes"
              active={filters.hasMatchups}
              onPress={() => update({ hasMatchups: !filters.hasMatchups })}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <BottomSheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheetPortal name="deck-browse-filter-sheet">
        <BottomSheetOverlay />
        <BottomSheetContent
          snapPoints={snapPoints}
          defaultSnapIndex={0}
          enablePanDownToClose
          enableOverDrag={!reduceMotion}
        >
          <BottomSheetHeader>
            <BottomSheetTitle>Filters</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetScrollView
            contentContainerClassName="px-4 pb-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <FilterSegmentBar
              activeSegment={activeSegment}
              filters={filters}
              onSegmentChange={setActiveSegment}
            />
            {renderSegmentContent()}
          </BottomSheetScrollView>
          <BottomSheetFooter className="border-t border-border px-4 pb-4 pt-3">
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => {
                  onFiltersChange(DEFAULT_DECK_BROWSE_FILTERS);
                  setLegendQuery('');
                }}
              >
                <ButtonText>Clear all</ButtonText>
              </Button>
              <Button className="flex-1" onPress={onClose}>
                <ButtonText>
                  {deckBrowseFiltersActive(filters)
                    ? `Show decks (${countDeckBrowseFilters(filters)})`
                    : 'Show decks'}
                </ButtonText>
              </Button>
            </View>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
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
    <View className="flex-row flex-wrap gap-2">
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
    </View>
  );
}
