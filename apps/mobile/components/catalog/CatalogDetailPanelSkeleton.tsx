import { View } from 'react-native';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { cn } from '@/lib/utils';

export function CatalogDetailPanelSkeleton() {
  return (
    <SkeletonGroup>
      <View className="overflow-hidden rounded-xl border border-border bg-card">
        <View className="flex-row gap-3 bg-card-panel p-3">
          <View className="shrink-0 items-center">
            <Skeleton
              className={cn('aspect-[5/7] w-[128px]', CARD_ART_RADIUS_CLASS)}
            />
            <Skeleton className="mt-1 h-2.5 w-14 rounded" />
          </View>

          <View className="min-w-0 flex-1 justify-center gap-2">
            <Skeleton className="h-6 w-[88%] rounded" />
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-[72%] rounded" />
            <View className="mt-1 flex-row gap-1.5">
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
              <Skeleton className="h-7 w-16 rounded-full" />
            </View>
          </View>
        </View>

        <View className="gap-3 p-3">
          <View className="flex-row items-center justify-between gap-3">
            <Skeleton className="h-3 w-20 rounded" />
            <View className="flex-row items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-5 w-6 rounded" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <Skeleton className="h-8 w-[46%] rounded-lg" />
            <Skeleton className="h-8 w-[46%] rounded-lg" />
            <Skeleton className="h-8 w-[46%] rounded-lg" />
          </View>

          <View className="gap-2 rounded-lg border border-border/60 bg-card-panel p-3">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-[92%] rounded" />
            <Skeleton className="h-3 w-[78%] rounded" />
          </View>

          <Skeleton className="h-10 w-full rounded-full" />

          <View className="gap-2 border-t border-border/40 pt-3">
            <View className="flex-row items-end justify-between">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-5 w-16 rounded" />
            </View>
            <Skeleton className="h-[120px] w-full rounded-lg" />
          </View>
        </View>
      </View>
    </SkeletonGroup>
  );
}
