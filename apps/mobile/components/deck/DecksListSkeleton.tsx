import { View } from 'react-native';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';

export function DeckListSkeleton() {
  return (
    <SkeletonGroup>
      <View className="gap-3">
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            className="overflow-hidden rounded-xl border border-border bg-card p-3.5"
          >
            <View className="gap-3">
              <View className="flex-row gap-3">
                <Skeleton className="h-[100px] w-[72px] rounded-lg" />
                <View className="min-w-0 flex-1 gap-2">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                  <Skeleton className="h-3 w-48 rounded" />
                  <Skeleton className="mt-1 h-3 w-36 rounded" />
                </View>
              </View>
              <View className="flex-row gap-1.5">
                <Skeleton className="h-14 w-10 rounded-md" />
                <Skeleton className="h-14 w-10 rounded-md" />
                <Skeleton className="h-14 w-10 rounded-md" />
                <Skeleton className="h-14 w-10 rounded-md" />
              </View>
            </View>
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}
