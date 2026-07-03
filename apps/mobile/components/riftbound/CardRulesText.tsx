import { Image } from 'expo-image';
import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { Text as RNText, View } from 'react-native';
import { KeywordBadge } from '@/components/riftbound/KeywordBadge';
import { Text } from '@/components/ui/text';
import { domainIconFor, mightIcon, runeIcon, tapIcon } from '@/constants/gameAssets';
import {
  groupParagraphSegments,
  parseCardRules,
  splitRuleParagraphs,
  type CardRulesPart,
  type ParagraphSegment,
} from '@/lib/card-rules';
import { cn } from '@/lib/utils';

export type { CardRulesPart } from '@/lib/card-rules';
export {
  groupInlineSegments,
  groupParagraphSegments,
  parseCardRules,
  splitRuleParagraphs,
  summarizeRulesRender,
} from '@/lib/card-rules';

function iconSize(compact?: boolean) {
  return compact ? 14 : 16;
}

type ReminderChunk = { value: string; reminder?: boolean };

export function splitReminderText(text: string): ReminderChunk[] {
  const chunks: ReminderChunk[] = [];
  const re = /\([^)]*\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      chunks.push({ value: text.slice(lastIndex, match.index) });
    }
    chunks.push({ value: match[0], reminder: true });
    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) {
    chunks.push({ value: text.slice(lastIndex) });
  }

  return chunks.length > 0 ? chunks : [{ value: text }];
}

function InlineAssetIcon({
  source,
  size,
  label,
}: {
  source: ImageSourcePropType;
  size: number;
  label: string;
}) {
  return (
    <View className="mx-0.5 items-center justify-center" style={{ width: size, height: size }}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
        accessibilityLabel={label}
      />
    </View>
  );
}

function InlineDomainIcon({ name, size }: { name: string; size: number }) {
  const source = domainIconFor(name);
  if (!source) return null;
  return (
    <View className="mx-0.5 items-center justify-center" style={{ width: size, height: size }}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
        accessibilityLabel={name}
      />
    </View>
  );
}

function InlineEnergyText({ value, compact }: { value: string; compact?: boolean }) {
  const size = iconSize(compact);

  return (
    <RNText
      className="mx-0.5 rounded-full bg-white px-[3px] text-center font-bold text-black ring-1 ring-black/20"
      style={{ fontSize: size * 0.55, lineHeight: size * 0.65, minWidth: size }}
      accessibilityLabel={`${value} energy`}
    >
      {value}
    </RNText>
  );
}

function ReminderText({
  value,
  textClass,
  reminderClass,
}: {
  value: string;
  textClass: string;
  reminderClass: string;
}) {
  const chunks = splitReminderText(value);

  if (chunks.length === 1 && !chunks[0]?.reminder) {
    return (
      <Text className={cn(textClass, 'shrink')}>
        <RNText>{value}</RNText>
      </Text>
    );
  }

  return (
    <Text className={cn(textClass, 'shrink')}>
      {chunks.map((chunk, index) => (
        <RNText key={index} className={chunk.reminder ? reminderClass : undefined}>
          {chunk.value}
        </RNText>
      ))}
    </Text>
  );
}

function RulesPartView({
  part,
  compact,
  textClass,
  reminderClass,
}: {
  part: CardRulesPart;
  compact?: boolean;
  textClass: string;
  reminderClass: string;
}) {
  if (part.type === 'text') {
    return <ReminderText value={part.value} textClass={textClass} reminderClass={reminderClass} />;
  }

  if (part.type === 'keyword') {
    return (
      <KeywordBadge label={part.display} keywordBase={part.keywordBase} compact={compact} />
    );
  }

  if (part.type === 'energy') {
    return (
      <Text className={cn(textClass, 'shrink')}>
        <InlineEnergyText value={part.value} compact={compact} />
      </Text>
    );
  }

  if (
    part.type === 'might' ||
    part.type === 'tap' ||
    part.type === 'rune' ||
    part.type === 'domain'
  ) {
    const size = iconSize(compact);

    if (part.type === 'might') {
      return <InlineAssetIcon source={mightIcon} size={size} label="Might" />;
    }
    if (part.type === 'tap') {
      return <InlineAssetIcon source={tapIcon} size={size} label="Tap" />;
    }
    if (part.type === 'rune') {
      return <InlineAssetIcon source={runeIcon} size={size} label="Rune" />;
    }
    return <InlineDomainIcon name={part.value} size={size} />;
  }

  const display =
    part.value.toLowerCase() === 'might'
      ? 'Might'
      : part.value.toLowerCase() === 'energy'
        ? 'Energy'
        : part.value.toLowerCase() === 'power'
          ? 'Power'
          : part.value;

  return (
    <Text className={cn(textClass, 'shrink')}>
      <RNText className={cn('font-bold', compact ? 'text-[10px]' : 'text-xs')}>{display}</RNText>
    </Text>
  );
}

function InlineSegmentRow({
  parts,
  compact,
  textClass,
  reminderClass,
}: {
  parts: CardRulesPart[];
  compact?: boolean;
  textClass: string;
  reminderClass: string;
}) {
  return (
    <View className="max-w-full flex-row flex-wrap items-center">
      {parts.map((part, index) => (
        <RulesPartView
          key={index}
          part={part}
          compact={compact}
          textClass={textClass}
          reminderClass={reminderClass}
        />
      ))}
    </View>
  );
}

function ParagraphSegmentView({
  segment,
  compact,
  textClass,
  reminderClass,
}: {
  segment: ParagraphSegment;
  compact?: boolean;
  textClass: string;
  reminderClass: string;
}) {
  return (
    <InlineSegmentRow
      parts={segment.parts}
      compact={compact}
      textClass={textClass}
      reminderClass={reminderClass}
    />
  );
}

interface CardRulesTextProps {
  text: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  numberOfLines?: number;
}

export function CardRulesText({
  text,
  style,
  compact = false,
  numberOfLines,
}: CardRulesTextProps) {
  const paragraphs = splitRuleParagraphs(text);
  const textClass = cn(
    'font-medium text-foreground',
    compact ? 'text-[11.5px] leading-[17px]' : 'text-[13px] leading-[21px]'
  );
  const reminderClass = 'italic text-muted-foreground';
  const lineHeight = compact ? 17 : 21;

  return (
    <View
      style={[
        style,
        numberOfLines ? { maxHeight: numberOfLines * lineHeight, overflow: 'hidden' } : undefined,
      ]}
    >
      {paragraphs.map((paragraph, paragraphIndex) => {
        if (!paragraph) {
          return paragraphIndex > 0 ? <View key={paragraphIndex} className="h-1" /> : null;
        }

        const segments = groupParagraphSegments(parseCardRules(paragraph));

        return (
          <View
            key={paragraphIndex}
            className={cn(
              'max-w-full flex-row flex-wrap items-center',
              paragraphIndex > 0 ? 'mt-1.5' : undefined
            )}
          >
            {segments.map((segment, segmentIndex) => (
              <ParagraphSegmentView
                key={segmentIndex}
                segment={segment}
                compact={compact}
                textClass={textClass}
                reminderClass={reminderClass}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}
