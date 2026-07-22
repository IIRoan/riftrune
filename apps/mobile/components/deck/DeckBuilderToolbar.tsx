import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { CatalogFilterTrigger } from '@/components/catalog/FilterSheet';
import { DeckValidationMenu } from '@/components/deck/DeckValidationMenu';
import { PillNav, type PillNavItem } from '@/components/shell/FloatingPillNav';
import { TextInput } from '@/components/ui/text-input';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import type { CatalogFilters } from '@/constants/catalogFilters';
import { useMobileLayout } from '@/hooks/useBreakpoint';
import type { DeckValidationMessage } from '@/lib/deck-types';
import { cn } from '@/lib/utils';

type DeckCatalogSection = 'mainDeck' | 'sideboard';

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
  catalogSection?: DeckCatalogSection;
  onCatalogSectionChange?: (section: DeckCatalogSection) => void;
  catalogSectionItems?: readonly PillNavItem<DeckCatalogSection>[];
  catalogFilters?: CatalogFilters;
  onOpenCatalogFilters?: () => void;
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
  catalogSection,
  onCatalogSectionChange,
  catalogSectionItems,
  catalogFilters,
  onOpenCatalogFilters,
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

  const showCatalogFilters =
    isMobile && !readOnly && catalogFilters != null && onOpenCatalogFilters != null;

  const catalogFilterAction = showCatalogFilters ? (
    <CatalogFilterTrigger
      filters={catalogFilters}
      onPress={onOpenCatalogFilters}
      compact
      mobile
    />
  ) : null;

  const trailingActions =
    catalogFilterAction || ioActions || validationAction || hasPanelActions ? (
      <View className="z-20 shrink-0 flex-row items-center gap-1">
        {catalogFilterAction}
        {panelActions}
        {ioActions}
        {validationAction}
      </View>
    ) : null;

  const sectionNav =
    catalogSection != null &&
    onCatalogSectionChange &&
    catalogSectionItems &&
    catalogSectionItems.length > 0 ? (
      <PillNav
        items={catalogSectionItems}
        value={catalogSection}
        onChange={onCatalogSectionChange}
        compact
        iconOnly={isMobile}
        className="shrink-0"
      />
    ) : null;

  return (
    <View className="z-20 min-w-0 flex-row items-center gap-1.5 sm:gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to decks"
        className={cn(
          'shrink-0 items-center justify-center rounded-lg border border-border bg-card active:bg-card-panel',
          isMobile ? 'size-9' : 'size-10'
        )}
        onPress={onBack}
      >
        <ThemedIonicon name="chevron-back" size={isMobile ? 20 : 22} color="foreground" />
      </Pressable>

      <View className="min-w-0 flex-1">
        {readOnly ? (
          <Text
            className={cn('font-semibold text-foreground', isMobile ? 'text-base' : 'text-lg')}
            numberOfLines={1}
          >
            {deckName}
          </Text>
        ) : (
          <TextInput
            value={deckName}
            onChangeText={onNameChange}
            placeholder="Deck name"
            className={cn('font-semibold', isMobile ? 'text-sm' : 'text-base')}
          />
        )}
      </View>

      {sectionNav}
      {trailingActions}
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
