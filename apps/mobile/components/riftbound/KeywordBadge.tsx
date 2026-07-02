import { Badge, BadgeText } from '@/components/ui/badge';
import { getKeywordBadgeClassName } from '@/lib/card-keywords';
import { cn } from '@/lib/utils';

/** Inline action-keyword badge — matches printed card keywords like ACCELERATE. */
export function KeywordBadge({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <Badge
      className={cn(
        'rounded-md border-0 px-2 py-0.5',
        compact && 'rounded px-1.5 py-0.5',
        getKeywordBadgeClassName(label)
      )}
    >
      <BadgeText
        className={cn(
          'text-[11px] font-extrabold uppercase tracking-wide text-white',
          compact && 'text-[9px]'
        )}
      >
        {label.toUpperCase()}
      </BadgeText>
    </Badge>
  );
}
