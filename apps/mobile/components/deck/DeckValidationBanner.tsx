import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import type { DeckValidationMessage } from '@/lib/deck-types';
import { cn } from '@/lib/utils';

interface DeckValidationBannerProps {
  messages: DeckValidationMessage[];
}

export function DeckValidationBanner({ messages }: DeckValidationBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const { errors, warnings, valid } = useMemo(() => {
    const errorItems = messages.filter((message) => message.type === 'error');
    const warningItems = messages.filter((message) => message.type === 'warning');
    const validItems = messages.filter((message) => message.type === 'valid');
    return { errors: errorItems, warnings: warningItems, valid: validItems };
  }, [messages]);

  if (!messages.length) return null;

  const isValidOnly = valid.length > 0 && errors.length === 0 && warnings.length === 0;
  const headline = isValidOnly
    ? 'Deck is valid'
    : errors.length > 0
      ? `${errors.length} issue${errors.length === 1 ? '' : 's'} to fix`
      : `${warnings.length} warning${warnings.length === 1 ? '' : 's'}`;

  const status = isValidOnly ? 'valid' : errors.length > 0 ? 'error' : 'warning';

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card-panel">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="flex-row items-center gap-2.5 px-3 py-2.5 active:opacity-90"
        onPress={() => setExpanded((value) => !value)}
      >
        <StatusKeywordBadge status={status} compact />
        <Text className="min-w-0 flex-1 text-sm font-medium text-foreground">{headline}</Text>
        <ThemedIonicon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="muted-foreground"
        />
      </Pressable>

      {expanded ? (
        <View className="gap-1.5 border-t border-border px-3 py-2.5">
          {messages.map((message) => (
            <View key={message.message} className="flex-row items-start gap-2">
              <Text
                className={cn(
                  'mt-0.5 font-mono text-[10px] font-bold',
                  message.type === 'error' && 'text-destructive',
                  message.type === 'warning' && 'text-warning',
                  message.type === 'valid' && 'text-success'
                )}
              >
                {message.type === 'error' ? '×' : message.type === 'warning' ? '!' : '✓'}
              </Text>
              <Text
                className={cn(
                  'min-w-0 flex-1 text-[13px] leading-snug text-foreground',
                  message.type === 'error' && 'text-destructive',
                  message.type === 'warning' && 'text-warning'
                )}
              >
                {message.message}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
