import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';

interface DeckLegalityBadgeProps {
  isLegal: boolean;
  compact?: boolean;
}

/** Tournament legality — green LEGAL / red ILLEGAL keyword tags. */
export function DeckLegalityBadge({ isLegal, compact = false }: DeckLegalityBadgeProps) {
  return <StatusKeywordBadge status={isLegal ? 'legal' : 'illegal'} compact={compact} />;
}
