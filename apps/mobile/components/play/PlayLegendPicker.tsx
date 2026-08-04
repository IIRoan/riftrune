import { ThemedIcon, ImageIcon, SearchIcon } from '@/components/icons';
import { AppLoader } from '@/components/ui/app-loader';
import { Button, ButtonText } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Text } from '@/components/ui/text';
import { DeckCardArt } from '@/components/deck/DeckCardArt';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
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
    <View className="gap-3">
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
          className="rounded-xl border border-border bg-card px-4 py-3 active:opacity-90"
        >
          <Text className="text-sm font-semibold text-muted-foreground">Clear legend</Text>
        </Pressable>
      ) : null}

      {loading && legends.length === 0 ? (
        <View className="items-center py-10">
          <AppLoader size="md" />
        </View>
      ) : legends.length === 0 ? (
        <View className="items-center gap-2 py-10">
          <ThemedIcon icon={SearchIcon} size={28} color="muted-foreground" />
          <Text className="text-sm text-muted-foreground">No legends match your search</Text>
        </View>
      ) : (
        <View className="gap-2">
          {legends.map((legend) => {
            const selected = legend.variantNumber === selectedVariantNumber;
            const artLabel =
              legend.variantType && legend.variantType !== 'Standard'
                ? legend.variantType
                : null;
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
                  'flex-row items-center gap-3 rounded-xl border px-3 py-2.5 active:opacity-90',
                  selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                )}
              >
                <View
                  className={cn(
                    'h-14 w-10 overflow-hidden border border-white/10 bg-background',
                    CARD_ART_RADIUS_CLASS
                  )}
                >
                  {legend.imageUrl ? (
                    <DeckCardArt
                      uri={resolveImageUrl(legend.imageUrl)}
                      variantNumber={legend.variantNumber}
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center bg-card-panel">
                      <ThemedIcon icon={ImageIcon} size={16} color="muted-foreground" />
                    </View>
                  )}
                </View>
                <View className="min-w-0 flex-1 gap-0.5">
                  <Text
                    className="text-sm font-semibold text-foreground"
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
              </Pressable>
            );
          })}

          {hasNextPage ? (
            <Button
              variant="outline"
              busy={loadingMore}
              disabled={loadingMore}
              onPress={fetchNextPage}
            >
              <ButtonText>{loadingMore ? 'Loading…' : 'Load more legends'}</ButtonText>
            </Button>
          ) : null}
        </View>
      )}
    </View>
  );
}
