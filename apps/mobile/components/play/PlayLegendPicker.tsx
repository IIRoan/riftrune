import { CheckIcon, ThemedIcon, ImageIcon, SearchIcon } from '@/components/icons';
import { AppLoader } from '@/components/ui/app-loader';
import { Button, ButtonText } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Text } from '@/components/ui/text';
import { DeckCardArt } from '@/components/deck/DeckCardArt';
import { useLegendCatalog } from '@/hooks/useLegendCatalog';
import type { SeatLegend } from '@/lib/score-tracker';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { Pressable, View } from 'react-native';

type PlayLegendPickerProps = {
  selectedVariantNumber?: string | null;
  onSelect: (legend: SeatLegend) => void;
  onClear?: () => void;
};

export function PlayLegendPicker({
  selectedVariantNumber,
  onSelect,
  onClear,
}: PlayLegendPickerProps) {
  const {
    query,
    setQuery,
    legends,
    loading,
    loadingMore,
    hasNextPage,
    fetchNextPage,
  } = useLegendCatalog();

  return (
    <View className="gap-4">
      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search legends"
        autoFocus
      />

      {onClear && selectedVariantNumber ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear legend"
          onPress={() => {
            hapticPress();
            onClear();
          }}
          className="min-h-11 justify-center border-b border-border pb-3 active:opacity-70"
        >
          <Text className="text-sm font-medium text-muted-foreground">Clear legend</Text>
        </Pressable>
      ) : null}

      {loading && legends.length === 0 ? (
        <View className="items-center py-12">
          <AppLoader size="md" />
        </View>
      ) : legends.length === 0 ? (
        <View className="items-center gap-2 py-12">
          <ThemedIcon icon={SearchIcon} size={28} color="muted-foreground" />
          <Text className="text-sm text-muted-foreground">No legends match your search</Text>
        </View>
      ) : (
        <View>
          {legends.map((legend, index) => {
            const selected = legend.variantNumber === selectedVariantNumber;
            const artLabel =
              legend.variantType && legend.variantType !== 'Standard'
                ? legend.variantType
                : null;
            const isLast = index === legends.length - 1;
            return (
              <Pressable
                key={legend.variantNumber}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Select ${legend.name}${artLabel ? `, ${artLabel}` : ''}`}
                onPress={() => {
                  hapticPress();
                  onSelect({
                    name: legend.name,
                    variantNumber: legend.variantNumber,
                    imageUrl: legend.imageUrl ?? null,
                    ...(artLabel ? { variantLabel: artLabel } : {}),
                  });
                }}
                className={cn(
                  'min-h-16 flex-row items-center gap-3 py-3 active:bg-accent/60',
                  !isLast && 'border-b border-border'
                )}
              >
                <View className="h-14 w-10 overflow-hidden bg-card-panel">
                  {legend.imageUrl ? (
                    <DeckCardArt
                      uri={resolveImageUrl(legend.imageUrl)}
                      variantNumber={legend.variantNumber}
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <ThemedIcon icon={ImageIcon} size={16} color="muted-foreground" />
                    </View>
                  )}
                </View>
                <View className="min-w-0 flex-1 gap-0.5">
                  <Text
                    className={cn(
                      'text-sm font-semibold',
                      selected ? 'text-primary' : 'text-foreground'
                    )}
                    numberOfLines={2}
                  >
                    {legend.name}
                  </Text>
                  <Text className="font-mono text-[11px] text-muted-foreground" numberOfLines={1}>
                    {legend.variantNumber}
                    {artLabel ? ` · ${artLabel}` : ''}
                    {legend.colors.length > 0 ? ` · ${legend.colors.join(' · ')}` : ''}
                  </Text>
                </View>
                {selected ? (
                  <ThemedIcon icon={CheckIcon} size={18} color="archive-accent-text" />
                ) : null}
              </Pressable>
            );
          })}

          {hasNextPage ? (
            <View className="pt-3">
              <Button
                variant="outline"
                busy={loadingMore}
                disabled={loadingMore}
                onPress={fetchNextPage}
              >
                <ButtonText>{loadingMore ? 'Loading…' : 'Load more legends'}</ButtonText>
              </Button>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}
