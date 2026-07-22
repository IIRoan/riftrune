import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { KeywordBadge } from '@/components/riftbound/KeywordBadge';
import { Text } from '@/components/ui/text';
import { hapticPress } from '@/utils/haptics';

export type StatusKeyword =
  | 'valid'
  | 'warning'
  | 'error'
  | 'imported'
  | 'legal'
  | 'illegal';

const STATUS_KEYWORDS: Record<StatusKeyword, { label: string; keywordBase: string }> = {
  valid: { label: 'VALID', keywordBase: 'ACCELERATE' },
  legal: { label: 'LEGAL', keywordBase: 'ACCELERATE' },
  warning: { label: 'WARNING', keywordBase: 'COMBAT' },
  error: { label: 'INVALID', keywordBase: 'ASSAULT' },
  illegal: { label: 'ILLEGAL', keywordBase: 'ASSAULT' },
  imported: { label: 'IMPORTED', keywordBase: 'VISION' },
};

/** Deck / validation status — printed keyword styling. */
export function StatusKeywordBadge({
  status,
  compact = false,
}: {
  status: StatusKeyword;
  compact?: boolean;
}) {
  const config = STATUS_KEYWORDS[status];
  return (
    <KeywordBadge label={config.label} keywordBase={config.keywordBase} compact={compact} />
  );
}

const CONTENT_KEYWORDS = {
  video: { label: 'VIDEO', keywordBase: 'REACTION' },
  guide: { label: 'GUIDE', keywordBase: 'VISION' },
  matchups: { label: 'MATCHUPS', keywordBase: 'DEATHKNELL' },
} as const;

export type ContentKeyword = keyof typeof CONTENT_KEYWORDS;

/** Browse content flags — keyword tags for video, guide, matchups. */
export function ContentKeywordBadge({
  type,
  compact = true,
}: {
  type: ContentKeyword;
  compact?: boolean;
}) {
  const config = CONTENT_KEYWORDS[type];
  return (
    <KeywordBadge label={config.label} keywordBase={config.keywordBase} compact={compact} />
  );
}

/** Active browse filter chip with keyword styling. */
export function FilterKeywordChip({
  label,
  keywordBase,
  onClear,
  trailing,
}: {
  label: string;
  keywordBase: string;
  onClear: () => void;
  trailing?: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-1.5">
      <KeywordBadge label={label} keywordBase={keywordBase} compact />
      {trailing}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Clear ${label} filter`}
        className="active:opacity-80"
        onPress={() => {
          hapticPress();
          onClear();
        }}
      >
        <Text className="text-sm font-semibold text-muted-foreground">×</Text>
      </Pressable>
    </View>
  );
}

/** White energy-disc quantity marker — matches printed card copy counts. */
export function QuantityPip({
  value,
  size = 22,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  return (
    <View
      accessibilityLabel={`${value} copies`}
      className={className}
      style={{ width: size, height: size, minWidth: size }}
    >
      <View
        className="size-full items-center justify-center rounded-full border border-black/25 bg-white"
        style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 1, shadowOffset: { width: 0, height: 1 } }}
      >
        <Text
          className="font-extrabold text-black"
          style={{ fontSize: Math.max(9, Math.round(size * 0.46)), lineHeight: Math.round(size * 0.5) }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}
