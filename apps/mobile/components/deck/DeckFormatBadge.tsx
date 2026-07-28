import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { deckFormatLabel, type DeckFormat } from '@riftbound/contracts';
import { cn } from '@/lib/utils';

export function DeckFormatBadge({
  format,
  className,
  variant = 'default',
}: {
  format: DeckFormat;
  className?: string;
  /** `toolbar` matches deck builder controls (h-9) beside the name input. */
  variant?: 'default' | 'toolbar';
}) {
  const isToolbar = variant === 'toolbar';

  return (
    <View
      className={cn(
        'shrink-0 items-center justify-center border border-border',
        isToolbar
          ? 'h-9 rounded-lg bg-card px-2.5'
          : 'rounded-md bg-card-panel px-2 py-0.5',
        className
      )}
    >
      <Text
        className={cn(
          'font-semibold text-muted-foreground',
          isToolbar ? 'text-[13px]' : 'text-[11px]'
        )}
      >
        {deckFormatLabel(format)}
      </Text>
    </View>
  );
}
