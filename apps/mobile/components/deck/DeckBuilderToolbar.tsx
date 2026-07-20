import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import { TextInput } from '@/components/ui/text-input';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { useMobileLayout } from '@/hooks/useBreakpoint';
import type { DeckValidationMessage } from '@/lib/deck-types';
import { cn } from '@/lib/utils';

interface DeckBuilderToolbarProps {
  deckName: string;
  readOnly?: boolean;
  validation: DeckValidationMessage[];
  onBack: () => void;
  onNameChange?: (name: string) => void;
  onToggleValidation?: () => void;
  validationExpanded?: boolean;
  onImport?: () => void;
  onExport?: () => void;
}

function validationHeadline(messages: DeckValidationMessage[]): {
  status: 'valid' | 'warning' | 'error';
  label: string;
} {
  const errors = messages.filter((m) => m.type === 'error');
  const warnings = messages.filter((m) => m.type === 'warning');
  if (errors.length > 0) {
    return {
      status: 'error',
      label: `${errors.length} issue${errors.length === 1 ? '' : 's'}`,
    };
  }
  if (warnings.length > 0) {
    return {
      status: 'warning',
      label: `${warnings.length} warning${warnings.length === 1 ? '' : 's'}`,
    };
  }
  return { status: 'valid', label: 'Valid' };
}

function ValidationDropdown({ messages }: { messages: DeckValidationMessage[] }) {
  return (
    <View className="absolute right-0 top-full z-20 mt-1 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
      <View className="gap-1.5 px-3 py-2.5">
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
    </View>
  );
}

export function DeckBuilderToolbar({
  deckName,
  readOnly = false,
  validation,
  onBack,
  onNameChange,
  onToggleValidation,
  validationExpanded = false,
  onImport,
  onExport,
}: DeckBuilderToolbarProps) {
  const isMobile = useMobileLayout();
  const headline = validationHeadline(validation);
  const showValidation = validation.length > 0;
  const showIoActions = !readOnly && (onImport || onExport);

  const ioActions = showIoActions ? (
    <View className="shrink-0 flex-row items-center gap-1">
      {onImport ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Import deck list"
          className="size-9 items-center justify-center rounded-lg border border-border bg-card active:bg-card-panel"
          onPress={onImport}
        >
          <ThemedIonicon name="download-outline" size={18} color="foreground" />
        </Pressable>
      ) : null}
      {onExport ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Export deck list"
          className="size-9 items-center justify-center rounded-lg border border-border bg-card active:bg-card-panel"
          onPress={onExport}
        >
          <ThemedIonicon name="share-outline" size={18} color="foreground" />
        </Pressable>
      ) : null}
    </View>
  ) : null;

  const validationAction =
    showValidation && onToggleValidation ? (
      <View className="relative shrink-0">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: validationExpanded }}
          accessibilityLabel="Toggle deck validation details"
          className="flex-row items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 active:bg-card-panel"
          onPress={onToggleValidation}
        >
          <StatusKeywordBadge status={headline.status} compact />
          {!isMobile ? (
            <Text className="text-[12px] font-semibold text-foreground">{headline.label}</Text>
          ) : null}
          <ThemedIonicon
            name={validationExpanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="muted-foreground"
          />
        </Pressable>
        {validationExpanded ? <ValidationDropdown messages={validation} /> : null}
      </View>
    ) : null;

  const trailingActions =
    ioActions || validationAction ? (
      <View className="z-20 shrink-0 flex-row items-center gap-1">
        {ioActions}
        {validationAction}
      </View>
    ) : null;

  return (
    <View className="z-20 gap-2">
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to decks"
          className="size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card active:bg-card-panel"
          onPress={onBack}
        >
          <ThemedIonicon name="chevron-back" size={22} color="foreground" />
        </Pressable>

        <View className="min-w-0 flex-1">
          {readOnly ? (
            <Text className="text-lg font-semibold text-foreground" numberOfLines={2}>
              {deckName}
            </Text>
          ) : (
            <TextInput
              value={deckName}
              onChangeText={onNameChange}
              placeholder="Deck name"
              className="text-base font-semibold"
            />
          )}
        </View>

        {!isMobile ? trailingActions : null}
      </View>

      {isMobile ? (
        <View className="flex-row items-center justify-end gap-1 pl-12">{trailingActions}</View>
      ) : null}
    </View>
  );
}

export function DeckBuilderSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={cn('gap-3 rounded-xl border border-border bg-card p-4', className)}>
      {children}
    </View>
  );
}
