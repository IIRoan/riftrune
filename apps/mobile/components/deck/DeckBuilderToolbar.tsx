import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { TextInput } from '@/components/ui/text-input';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
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

export function DeckBuilderToolbar({
  deckName,
  readOnly = false,
  validation,
  onBack,
  onNameChange,
  onToggleValidation,
  validationExpanded = false,
}: DeckBuilderToolbarProps) {
  const headline = validationHeadline(validation);
  const showValidation = validation.length > 0;

  return (
    <View className="gap-3">
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

        {showValidation && onToggleValidation ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: validationExpanded }}
            accessibilityLabel="Toggle deck validation details"
            className="shrink-0 flex-row items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 active:bg-card-panel"
            onPress={onToggleValidation}
          >
            <StatusKeywordBadge status={headline.status} compact />
            <Text className="text-[12px] font-semibold text-foreground">{headline.label}</Text>
            <ThemedIonicon
              name={validationExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color="muted-foreground"
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

interface DeckBuilderActionsProps {
  addToSideboard: boolean;
  sideboardFull?: boolean;
  onImport: () => void;
  onExport: () => void;
  onToggleSideboard: () => void;
}

export function DeckBuilderActions({
  addToSideboard,
  sideboardFull = false,
  onImport,
  onExport,
  onToggleSideboard,
}: DeckBuilderActionsProps) {
  return (
    <View className="flex-row flex-wrap gap-2">
      <Button variant="outline" size="sm" onPress={onImport}>
        <ButtonIcon>
          <ThemedIonicon name="download-outline" size={14} color="foreground" />
        </ButtonIcon>
        <ButtonText>Import</ButtonText>
      </Button>
      <Button variant="outline" size="sm" onPress={onExport}>
        <ButtonIcon>
          <ThemedIonicon name="share-outline" size={14} color="foreground" />
        </ButtonIcon>
        <ButtonText>Export</ButtonText>
      </Button>
      <Button
        variant={addToSideboard ? 'default' : 'outline'}
        size="sm"
        disabled={sideboardFull && !addToSideboard}
        onPress={onToggleSideboard}
      >
        <ButtonIcon>
          <ThemedIonicon
            name={addToSideboard ? 'albums' : 'albums-outline'}
            size={14}
            color={addToSideboard ? 'primary-foreground' : 'foreground'}
          />
        </ButtonIcon>
        <ButtonText>{addToSideboard ? 'Sideboard mode' : 'Add to sideboard'}</ButtonText>
      </Button>
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
