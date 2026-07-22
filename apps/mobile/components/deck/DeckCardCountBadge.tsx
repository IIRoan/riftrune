import { View } from 'react-native';
import { QuantityPip } from '@/components/riftbound/RiftboundBadges';
import { cn } from '@/lib/utils';

interface DeckCardCountBadgeProps {
  count: number;
  className?: string;
}

/** Printed-card copy count — quantity pip at bottom-left of art. */
export function DeckCardCountBadge({ count, className }: DeckCardCountBadgeProps) {
  if (count <= 1) return null;

  return (
    <View className={cn('absolute bottom-1 left-1', className)}>
      <QuantityPip value={count} size={22} />
    </View>
  );
}
