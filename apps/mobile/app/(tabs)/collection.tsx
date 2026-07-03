import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import {
  BreakdownSection,
  DashboardStat,
  DashboardStatGrid,
  mergeSetStats,
  computeTypeStats,
  SetCardGrid,
  rarityIconFor,
  typeIconFor,
} from '@/components/collection/CollectionDashboard';
import { ScreenLayout } from '@/components/shell/ScreenLayout';
import { Text } from '@/components/ui/text';
import { Button, ButtonText } from '@/components/ui/button';
import { useCollection } from '@/hooks/useCollection';
import { useCollectionInsights } from '@/hooks/useCollectionInsights';
import { useFiltersData } from '@/hooks/useFiltersData';

export default function CollectionScreen() {
  const router = useRouter();

  const { data: collection = [], isLoading, refetch } = useCollection();
  const filtersQuery = useFiltersData();
  const insightsQuery = useCollectionInsights(collection);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const totalCards = useMemo(
    () => collection.reduce((sum, e) => sum + e.quantity, 0),
    [collection]
  );

  const apiSets = useMemo(
    () =>
      (filtersQuery.data?.sets ?? []).map((s) => ({
        code: s.code ?? s.id,
        name: s.name,
        count: s.printCount ?? s.count,
      })),
    [filtersQuery.data?.sets]
  );
  const apiTypes = filtersQuery.data?.types ?? [];
  const apiRarities = filtersQuery.data?.rarities ?? [];
  const catalogTotal = filtersQuery.data?.variantCount ?? 0;
  const catalogTotalLabel =
    catalogTotal > 0
      ? catalogTotal.toLocaleString()
      : filtersQuery.isLoading
        ? '…'
        : '—';

  const mergedSets = useMemo(
    () => mergeSetStats(collection, apiSets),
    [collection, apiSets]
  );

  const totalFoilOwned = mergedSets.reduce((sum, s) => sum + s.foilOwned, 0);

  const rarityStats = useMemo(() => {
    const ownedByRarity = new Map<string, number>();
    for (const entry of collection) {
      const r = entry.rarity || 'Unknown';
      ownedByRarity.set(r, (ownedByRarity.get(r) ?? 0) + entry.quantity);
    }
    return apiRarities.map((r) => ({
      name: r.name,
      owned: ownedByRarity.get(r.name) ?? 0,
      total: r.count,
    }));
  }, [collection, apiRarities]);

  const typeStats = useMemo(
    () => computeTypeStats(collection, apiTypes),
    [collection, apiTypes]
  );

  const completion = catalogTotal > 0 ? (collection.length / catalogTotal) * 100 : 0;
  const estimatedValue = insightsQuery.data?.estimatedValue ?? 0;

  return (
    <ScreenLayout>
      <View className="pb-6">
        <Text className="text-xl font-semibold tracking-tight text-foreground">
          Collection Dashboard
        </Text>
        <Text className="mt-1 font-mono text-[13px] text-muted-foreground">
          {collection.length.toLocaleString()} of {catalogTotalLabel} cards available ·{' '}
          {totalFoilOwned} foils · €{estimatedValue.toFixed(2)} estimated value
        </Text>
      </View>

      <View className="mb-8">
        <Text className="mb-4 text-sm font-semibold text-muted-foreground">Sets</Text>
        <SetCardGrid sets={mergedSets} />
      </View>

      <DashboardStatGrid>
        <DashboardStat
          label="Cards Collected"
          value={collection.length.toLocaleString()}
          sub={
            catalogTotal > 0
              ? `of ${catalogTotal.toLocaleString()} available`
              : filtersQuery.isLoading
                ? 'loading catalog…'
                : 'catalog count unavailable'
          }
        />
        <DashboardStat
          label="Total Cards"
          value={totalCards.toLocaleString()}
          sub="including duplicates"
        />
        <DashboardStat
          label="Completion"
          value={`${completion.toFixed(2)}%`}
          sub="overall progress"
          progress={completion / 100}
        />
        <DashboardStat
          label="Estimated Value"
          value={`€${estimatedValue.toFixed(2)}`}
          sub="based on Cardmarket"
        />
      </DashboardStatGrid>

      <View className="mb-8 gap-4 md:flex-row">
        {apiTypes.length > 0 ? (
          <View className="flex-1">
            <BreakdownSection
              title="Cards by Type"
              stats={typeStats}
              iconFor={typeIconFor}
            />
          </View>
        ) : null}
        {apiRarities.length > 0 ? (
          <View className="flex-1">
            <BreakdownSection
              title="Cards by Rarity"
              stats={rarityStats}
              iconFor={rarityIconFor}
            />
          </View>
        ) : null}
      </View>

      {collection.length === 0 && !isLoading ? (
        <Button
          className="mt-6"
          onPress={() => {
            router.push('/(tabs)/search');
          }}
        >
          <ButtonText>Search cards</ButtonText>
        </Button>
      ) : null}
    </ScreenLayout>
  );
}
