import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { DeckValidationMenu } from '@/components/deck/DeckValidationMenu';
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
  /** Desktop: collapse/expand left info drawer */
  infoDrawerOpen?: boolean;
  onToggleInfoDrawer?: () => void;
  /** Mobile: open info / list sheets */
  onOpenInfo?: () => void;
  onOpenList?: () => void;
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
  infoDrawerOpen,
  onToggleInfoDrawer,
  onOpenInfo,
  onOpenList,
}: DeckBuilderToolbarProps) {
  const isMobile = useMobileLayout();
  const showIoActions = !readOnly && (onImport || onExport);

  const panelActions = (
    <View className="shrink-0 flex-row items-center gap-1">
      {isMobile && onOpenInfo ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open deck info"
          className="size-9 items-center justify-center rounded-lg border border-border bg-card active:bg-card-panel"
          onPress={onOpenInfo}
        >
          <ThemedIonicon name="information-circle-outline" size={18} color="foreground" />
        </Pressable>
      ) : null}
      {isMobile && onOpenList ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open deck list"
          className="size-9 items-center justify-center rounded-lg border border-border bg-card active:bg-card-panel"
          onPress={onOpenList}
        >
          <ThemedIonicon name="list-outline" size={18} color="foreground" />
        </Pressable>
      ) : null}
      {!isMobile && onToggleInfoDrawer ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={infoDrawerOpen ? 'Hide deck info' : 'Show deck info'}
          accessibilityState={{ selected: infoDrawerOpen === true }}
          className={cn(
            'size-9 items-center justify-center rounded-lg border bg-card active:bg-card-panel',
            infoDrawerOpen ? 'border-primary/40' : 'border-border'
          )}
          onPress={onToggleInfoDrawer}
        >
          <ThemedIonicon
            name={infoDrawerOpen ? 'menu' : 'menu-outline'}
            size={18}
            color={infoDrawerOpen ? 'primary' : 'foreground'}
          />
        </Pressable>
      ) : null}
    </View>
  );

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
    validation.length > 0 && onToggleValidation ? (
      <DeckValidationMenu
        messages={validation}
        open={validationExpanded}
        onOpenChange={() => onToggleValidation()}
        showLabel={!isMobile}
        align="end"
      />
    ) : null;

  const hasPanelActions =
    (isMobile && (onOpenInfo || onOpenList)) || (!isMobile && onToggleInfoDrawer);

  const trailingActions =
    ioActions || validationAction || hasPanelActions ? (
      <View className="z-20 shrink-0 flex-row items-center gap-1">
        {panelActions}
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
