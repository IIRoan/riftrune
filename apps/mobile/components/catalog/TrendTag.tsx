import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface TrendTagProps {
  trend: string;
  className?: string;
}

export function TrendTag({ trend, className }: TrendTagProps) {
  const isUp = trend.startsWith('+');
  const isDown = trend.startsWith('-');

  return (
    <Text
      className={cn(
        'font-mono text-xs font-semibold tabular-nums',
        isUp && 'text-success',
        isDown && 'text-warning',
        !isUp && !isDown && 'text-muted-foreground',
        className
      )}
    >
      {isUp ? '▲ ' : isDown ? '▼ ' : ''}
      {trend}
    </Text>
  );
}
