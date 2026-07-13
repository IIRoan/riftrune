import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Children } from 'react';
import { Platform, Pressable, View, type ImageSourcePropType } from 'react-native';
import { TrendTag } from '@/components/catalog/TrendTag';
import { rarityIconFor, typeIconFor } from '@/constants/gameAssets';
import { Text } from '@/components/ui/text';
import { useFillGridLayout } from '@/hooks/useFillGridLayout';
import { useScreenLayout } from '@/components/shell/ScreenLayout';
import type { CollectionEntry } from '@/services/collectionService';
import { openCard } from '@/utils/cardNavigation';
import type { MergedSetStat } from '@/utils/collectionStats';
import { cn } from '@/lib/utils';

const SET_CARD_MIN_WIDTH = 280;
const SET_CARD_MAX_COLUMNS = 4;
const SET_GRID_GAP = 16;
const STAT_MIN_WIDTH = 140;
const STAT_MAX_COLUMNS = 4;
const STAT_GRID_GAP = 12;

function ArchiveProgressBar({
  progress,
  className,
  thin = false,
}: {
  progress: number;
  className?: string;
  thin?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, progress * 100));
  return (
    <View
      className={cn(
        'overflow-hidden rounded-full bg-card-panel',
        thin ? 'h-1' : 'h-1.5',
        className
      )}
    >
      <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </View>
  );
}

function SetLogoImage({ source }: { source: ImageSourcePropType }) {
  return (
    <Image
      source={source}
      style={{ width: 88, height: 22 }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

export type { MergedSetStat } from '@/utils/collectionStats';

export function DashboardStat({
  label,
  value,
  sub,
  progress,
}: {
  label: string;
  value: string;
  sub: string;
  progress?: number;
}) {
  return (
    <View className="w-full rounded-xl border border-border bg-card p-4">
      <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
      <Text className="mt-2 font-mono text-2xl font-bold tabular-nums text-foreground">
        {value}
      </Text>
      <Text className="mt-1 text-xs text-archive-subtle">{sub}</Text>
      {progress !== undefined ? (
        <ArchiveProgressBar progress={progress} className="mt-3" />
      ) : null}
    </View>
  );
}

export function BreakdownSection({
  title,
  stats,
  iconFor,
}: {
  title: string;
  stats: { name: string; owned: number; total: number }[];
  iconFor?: (name: string) => ReturnType<typeof typeIconFor>;
}) {
  return (
    <View className="rounded-xl border border-border bg-card p-4">
      <Text className="mb-3 text-sm font-semibold text-foreground">{title}</Text>
      <View className="gap-3">
        {stats.map((stat) => {
          const pct = stat.total > 0 ? (stat.owned / stat.total) * 100 : 0;
          const icon = iconFor?.(stat.name);
          return (
            <View key={stat.name}>
              <View className="flex-row items-center justify-between gap-4">
                <View className="min-w-0 flex-1 flex-row items-center gap-2">
                  {icon ? (
                    <Image source={icon} className="size-5 shrink-0" contentFit="contain" />
                  ) : null}
                  <Text className="text-[13px] font-medium text-foreground">{stat.name}</Text>
                </View>
                <Text className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
                  {stat.owned} / {stat.total}
                </Text>
              </View>
              <View className="mt-1.5">
                <ArchiveProgressBar progress={pct / 100} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function SetCard({ set }: { set: MergedSetStat }) {
  const completion = set.total > 0 ? (set.owned / set.total) * 100 : 0;
  const foilCompletion = set.total > 0 ? (set.foilOwned / set.total) * 100 : 0;

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      {set.art ? (
        <View
          className="relative w-full overflow-hidden bg-card-panel"
          style={{ aspectRatio: 16 / 5 }}
        >
          <Image
            source={set.art}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            contentFit="cover"
            accessibilityLabel={`${set.name} key art`}
          />
          {Platform.OS === 'web' ? (
            <View className="absolute inset-0 bg-gradient-to-t from-card from-0% via-card/40 via-40% to-transparent to-100%" />
          ) : (
            <>
              <View className="absolute inset-0 bg-background/50" />
              <View className="absolute bottom-0 left-0 right-0 h-1/2 bg-card/90" />
            </>
          )}
          <View className="absolute bottom-2 left-3 flex-row items-center gap-2">
            {set.logo ? <SetLogoImage source={set.logo} /> : null}
            <Text className="font-mono text-xs font-semibold text-foreground">{set.code}</Text>
          </View>
        </View>
      ) : set.logo ? (
        <View className="flex-row items-center justify-between bg-card-panel px-4 py-3">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <SetLogoImage source={set.logo} />
            <Text className="font-mono text-xs font-semibold text-foreground">{set.code}</Text>
          </View>
          <Text className="shrink-0 font-mono text-xs text-archive-subtle">{set.total} cards</Text>
        </View>
      ) : (
        <View className="flex-row items-center justify-between bg-card-panel px-4 py-3">
          <Text className="font-mono text-xs font-semibold text-foreground">{set.code}</Text>
          <Text className="font-mono text-xs text-archive-subtle">{set.total} cards</Text>
        </View>
      )}

      <View className="p-4">
        <View className="flex-row items-baseline justify-between gap-3">
          <Text className="min-w-0 flex-1 text-sm font-semibold text-foreground">{set.name}</Text>
          {set.released ? (
            <Text className="shrink-0 font-mono text-xs text-archive-subtle">{set.released}</Text>
          ) : null}
        </View>
        {set.art ? (
          <Text className="mt-1 font-mono text-xs text-archive-subtle">{set.total} cards</Text>
        ) : null}
        <View className="mt-3 gap-3">
          <ProgressRow label="Main set" value={`${set.owned}/${set.total}`} progress={completion / 100} />
          <ProgressRow label="Foils" value={`${set.foilOwned}/${set.total}`} progress={foilCompletion / 100} />
        </View>
        <View className="mt-3 flex-row items-center justify-between border-t border-archive-soft-line pt-3">
          <Text className="text-[13px] text-muted-foreground">Completion</Text>
          <Text className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
            {completion.toFixed(2)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

function ProgressRow({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress: number;
}) {
  return (
    <View>
      <View className="flex-row items-center justify-between gap-4">
        <Text className="text-[13px] font-medium text-muted-foreground">{label}</Text>
        <Text className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
          {value}
        </Text>
      </View>
      <View className="mt-2">
        <ArchiveProgressBar progress={progress} thin />
      </View>
    </View>
  );
}

export function SetCardGrid({ sets }: { sets: MergedSetStat[] }) {
  const { itemWidth } = useFillGridLayout({
    minItemWidth: SET_CARD_MIN_WIDTH,
    maxColumns: SET_CARD_MAX_COLUMNS,
    gap: SET_GRID_GAP,
  });

  return (
    <View className="flex-row flex-wrap" style={{ gap: SET_GRID_GAP }}>
      {sets.map((set) => (
        <View key={set.code} style={{ width: itemWidth }}>
          <SetCard set={set} />
        </View>
      ))}
    </View>
  );
}

export function DashboardStatGrid({ children }: { children: React.ReactNode }) {
  const { contentWidth } = useScreenLayout();
  const { columns, itemWidth } = useFillGridLayout({
    minItemWidth: STAT_MIN_WIDTH,
    maxColumns: STAT_MAX_COLUMNS,
    gap: STAT_GRID_GAP,
  });

  return (
    <View className="mb-6 flex-row flex-wrap" style={{ gap: STAT_GRID_GAP }}>
      {Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            width: columns === 1 ? contentWidth : itemWidth,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

export function CollectionListPanel({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('rounded-xl border border-border bg-card', className)}>
      <View className="flex-row items-baseline justify-between gap-3 px-4 pt-4">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        {subtitle ? (
          <Text className="font-mono text-xs text-archive-subtle">{subtitle}</Text>
        ) : null}
      </View>
      <View className="px-4 pb-2 pt-2">{children}</View>
    </View>
  );
}

export function WishlistRow({
  name,
  variantNumber,
  price,
  trend,
  onPress,
}: {
  name: string;
  variantNumber: string;
  price: string;
  trend: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="min-h-11 flex-row items-center justify-between gap-3 rounded-lg px-1 py-3 active:opacity-80"
      onPress={onPress}
    >
      <View className="min-w-0 flex-1">
        <Text className="text-[13px] font-medium text-foreground" numberOfLines={1}>
          {name}
        </Text>
        <Text className="font-mono text-[11px] text-archive-subtle">{variantNumber}</Text>
      </View>
      <View className="flex-row items-center gap-3">
        <Text className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
          {price}
        </Text>
        <TrendTag trend={trend} />
      </View>
    </Pressable>
  );
}

export function CollectionMoverRow({
  entry,
  trend,
}: {
  entry: CollectionEntry;
  trend: string;
}) {
  const router = useRouter();
  return (
    <Pressable
      className="min-h-11 flex-row items-center justify-between gap-3 rounded-lg px-1 py-3 active:opacity-80"
      onPress={() => {
        openCard(router, entry.variantNumber, 'modal');
      }}
    >
      <View className="min-w-0 flex-1">
        <Text className="text-[13px] font-medium text-foreground" numberOfLines={1}>
          {entry.name}
        </Text>
        <Text className="font-mono text-[11px] text-archive-subtle">{entry.variantNumber}</Text>
      </View>
      <TrendTag trend={trend} />
    </Pressable>
  );
}

export function computeTypeStats(
  collection: CollectionEntry[],
  apiTypes: { name: string; count: number }[]
) {
  const namesByType = new Map<string, Set<string>>();
  for (const entry of collection) {
    if (!entry.type || entry.quantity <= 0) continue;
    const names = namesByType.get(entry.type) ?? new Set<string>();
    names.add(entry.name);
    namesByType.set(entry.type, names);
  }

  return apiTypes
    .filter((t) => t.name !== 'Card')
    .map((t) => ({
      name: t.name,
      owned: namesByType.get(t.name)?.size ?? 0,
      total: t.count,
    }));
}
