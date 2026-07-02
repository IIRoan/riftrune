import type { TextStyle } from 'react-native';
import { Text as RNText } from 'react-native';
import { KeywordBadge } from '@/components/riftbound/KeywordBadge';
import { Text } from '@/components/ui/text';
import { isStatKeyword } from '@/lib/card-keywords';
import { cn } from '@/lib/utils';

export type CardRulesPart =
  | { type: 'text'; value: string }
  | { type: 'keyword'; value: string }
  | { type: 'stat'; value: string };

export function parseCardRules(text: string): CardRulesPart[] {
  const parts: CardRulesPart[] = [];
  const re = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const inner = match[1];
    parts.push({
      type: isStatKeyword(inner) ? 'stat' : 'keyword',
      value: inner,
    });
    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

function StatInline({ label, compact }: { label: string; compact?: boolean }) {
  const key = label.toLowerCase();
  const display =
    key === 'might' ? 'Might' : key === 'energy' ? 'Energy' : key === 'power' ? 'Power' : label;

  return (
    <Text
      className={cn('font-bold text-muted-foreground', compact ? 'text-[10px]' : 'text-xs')}
    >
      {display}
    </Text>
  );
}

interface CardRulesTextProps {
  text: string;
  style?: TextStyle | TextStyle[];
  compact?: boolean;
  numberOfLines?: number;
}

export function CardRulesText({
  text,
  style,
  compact = false,
  numberOfLines,
}: CardRulesTextProps) {
  const parts = parseCardRules(text);

  return (
    <RNText
      className={cn(
        'text-muted-foreground',
        compact ? 'text-[11.5px] leading-[17px]' : 'text-[13.5px] leading-[22px]'
      )}
      style={style}
      numberOfLines={numberOfLines}
    >
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <RNText key={index}>{part.value}</RNText>;
        }
        if (part.type === 'stat') {
          return <StatInline key={index} label={part.value} compact={compact} />;
        }
        return <KeywordBadge key={index} label={part.value} compact={compact} />;
      })}
    </RNText>
  );
}
