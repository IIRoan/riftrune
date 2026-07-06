import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
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

  const tone = isValidOnly ? 'success' : errors.length > 0 ? 'error' : 'warning';

  return (
    <View
      className={cn(
        'overflow-hidden rounded-xl border',
        tone === 'success' && 'border-success/40 bg-success/10',
        tone === 'warning' && 'border-warning/40 bg-warning/10',
        tone === 'error' && 'border-destructive/40 bg-destructive/10'
      )}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        className="flex-row items-center gap-2 px-3 py-2.5 active:opacity-90"
        onPress={() => setExpanded((value) => !value)}
      >
        <ThemedIonicon
          name={tone === 'success' ? 'checkmark-circle' : tone === 'error' ? 'alert-circle' : 'warning'}
          size={18}
          color="foreground"
        />
        <Text
          className={cn(
            'flex-1 text-sm font-semibold',
            tone === 'success' && 'text-success',
            tone === 'warning' && 'text-warning',
            tone === 'error' && 'text-destructive'
          )}
        >
          {headline}
        </Text>
        <ThemedIonicon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="muted-foreground"
        />
      </Pressable>

      {expanded ? (
        <View className="gap-1.5 border-t border-archive-soft-line px-3 py-2.5">
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
                  'flex-1 text-[13px] leading-snug',
                  message.type === 'error' && 'text-destructive',
                  message.type === 'warning' && 'text-warning',
                  message.type === 'valid' && 'text-success'
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
