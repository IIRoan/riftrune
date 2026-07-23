import { ChevronDownIcon, ChevronUpIcon, ThemedIcon } from '@/components/icons';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import type { DeckValidationMessage } from '@/lib/deck-types';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

export function deckValidationHeadline(messages: DeckValidationMessage[]): {
  status: 'valid' | 'warning' | 'error';
  label: string;
} {
  const errors = messages.filter((m) => m.type === 'error');
  const warnings = messages.filter((m) => m.type === 'warning');
  if (errors.length > 0) {
    return {
      status: 'error',
      label: errors.length === 1 ? '1 issue' : `${errors.length} issues`,
    };
  }
  if (warnings.length > 0) {
    return {
      status: 'warning',
      label: warnings.length === 1 ? '1 warning' : `${warnings.length} warnings`,
    };
  }
  return { status: 'valid', label: 'Valid' };
}

function messageTone(type: DeckValidationMessage['type']) {
  if (type === 'error') {
    return {
      dot: 'bg-destructive',
      text: 'text-foreground',
    };
  }
  if (type === 'warning') {
    return {
      dot: 'bg-warning',
      text: 'text-foreground',
    };
  }
  return {
    dot: 'bg-success',
    text: 'text-muted-foreground',
  };
}

function triggerTone(status: 'valid' | 'warning' | 'error') {
  if (status === 'error') {
    return {
      border: 'border-destructive/40',
      bg: 'bg-card',
      ink: 'text-destructive',
    };
  }
  if (status === 'warning') {
    return {
      border: 'border-warning/45',
      bg: 'bg-card',
      ink: 'text-warning',
    };
  }
  return {
    border: 'border-success/40',
    bg: 'bg-card',
    ink: 'text-success',
  };
}

interface DeckValidationMenuProps {
  messages: DeckValidationMessage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showLabel?: boolean;
  align?: 'start' | 'end' | 'stretch';
  className?: string;
}

/**
 * Quiet validation disclosure for the deck toolbar.
 * Trigger stays compact; details open as a popover list (not nested status cards).
 */
export function DeckValidationMenu({
  messages,
  open,
  onOpenChange,
  showLabel = true,
  align = 'end',
  className,
}: DeckValidationMenuProps) {
  if (messages.length === 0) return null;

  const headline = deckValidationHeadline(messages);
  const tone = triggerTone(headline.status);

  return (
    <View className={cn('relative shrink-0', className)}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Deck validation: ${headline.label}`}
        className={cn(
          'h-9 flex-row items-center rounded-lg border active:bg-card-panel',
          showLabel ? 'gap-1.5 px-2.5' : 'min-w-9 justify-center gap-1 px-1.5',
          tone.border,
          tone.bg
        )}
        onPress={() => {
          hapticPress();
          onOpenChange(!open);
        }}
      >
        <View
          className={cn(
            'size-1.5 rounded-full',
            headline.status === 'error' && 'bg-destructive',
            headline.status === 'warning' && 'bg-warning',
            headline.status === 'valid' && 'bg-success'
          )}
        />
        {showLabel ? (
          <Text className={cn('text-[12px] font-medium', tone.ink)}>{headline.label}</Text>
        ) : (
          <Text className={cn('font-mono text-[12px] font-semibold tabular-nums', tone.ink)}>
            {messages.length}
          </Text>
        )}
        <ThemedIcon
          icon={open ? ChevronUpIcon : ChevronDownIcon}
          size={14}
          color="muted-foreground"
        />
      </Pressable>

      {open ? (
        <View
          className={cn(
            'absolute top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-border bg-popover shadow-md',
            align === 'end' && 'right-0 w-[min(19rem,calc(100vw-2rem))]',
            align === 'start' && 'left-0 w-[min(19rem,calc(100vw-2rem))]',
            align === 'stretch' && 'left-0 right-0'
          )}
        >
          <View className="border-b border-border px-3 py-2.5">
            <Text className="text-[13px] font-semibold text-foreground">{headline.label}</Text>
            <Text className="mt-0.5 text-[12px] text-muted-foreground">
              Fix these before the list is tournament-ready.
            </Text>
          </View>

          <View className="py-1">
            {messages.map((message, index) => {
              const row = messageTone(message.type);
              return (
                <View
                  key={message.message}
                  className={cn(
                    'flex-row items-start gap-2.5 px-3 py-2.5',
                    index < messages.length - 1 && 'border-b border-border/60'
                  )}
                >
                  <View className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', row.dot)} />
                  <Text className={cn('min-w-0 flex-1 text-[13px] leading-snug', row.text)}>
                    {message.message}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}
