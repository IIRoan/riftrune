import { View } from 'react-native';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import { cn } from '@/lib/utils';

/** ILLEGAL keyword overlay for banned cards on art thumbnails. */
export function CardBannedOverlay({
  compact = true,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <View
      pointerEvents="none"
      className={cn('absolute left-1 top-1 z-10', className)}
    >
      <StatusKeywordBadge status="illegal" compact={compact} />
    </View>
  );
}
