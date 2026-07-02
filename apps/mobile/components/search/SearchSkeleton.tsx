import { useMemo } from 'react';
import { View } from 'react-native';
import { CardTileSkeleton } from '@/components/cards/CardTile';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchSkeletonProps {
  layout?: 'grid' | 'list';
  count?: number;
  tileWidth?: number;
  compact?: boolean;
}

export function SearchSkeleton({
  layout = 'grid',
  count = 6,
  tileWidth,
  compact = false,
}: SearchSkeletonProps) {
  const items = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  if (layout === 'list') {
    return (
      <View className="gap-2">
        {items.map((i) => (
          <Skeleton key={i} className="w-full rounded-lg">
            <CardTileSkeleton layout="list" compact={compact} />
          </Skeleton>
        ))}
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-4">
      {items.map((i) => (
        <View
          key={i}
          style={tileWidth != null ? { width: tileWidth, maxWidth: tileWidth } : undefined}
        >
          <CardTileSkeleton layout="grid" compact={compact} />
        </View>
      ))}
    </View>
  );
}
