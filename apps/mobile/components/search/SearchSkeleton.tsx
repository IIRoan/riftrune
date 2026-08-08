import { useMemo } from 'react';
import { View } from 'react-native';
import { CardTileSkeleton } from '@/components/cards/CardTile';
import { SkeletonGroup } from '@/components/ui/skeleton';
import {
  catalogGridListStyle,
  catalogGridSkeletonCellStyle,
  catalogGridTileStyle,
} from '@/lib/catalog-grid-layout';

interface SearchSkeletonProps {
  layout?: 'grid' | 'list';
  count?: number;
  tileWidth: number;
  compact?: boolean;
}

export function SearchSkeleton({
  layout = 'grid',
  count = 6,
  tileWidth,
  compact = false,
}: SearchSkeletonProps) {
  const items = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  const gridListStyle = useMemo(() => catalogGridListStyle(), []);
  const gridCellStyle = useMemo(
    () => catalogGridSkeletonCellStyle(tileWidth),
    [tileWidth]
  );
  const gridTileStyle = useMemo(() => catalogGridTileStyle(tileWidth), [tileWidth]);

  return (
    <SkeletonGroup>
      {layout === 'list' ? (
        <View className="gap-2">
          {items.map((i) => (
            <CardTileSkeleton key={i} layout="list" compact={compact} />
          ))}
        </View>
      ) : (
        <View className="flex-row flex-wrap" style={gridListStyle}>
          {items.map((i) => (
            <View key={i} style={gridCellStyle}>
              <View style={gridTileStyle}>
                <CardTileSkeleton layout="grid" compact={compact} />
              </View>
            </View>
          ))}
        </View>
      )}
    </SkeletonGroup>
  );
}
