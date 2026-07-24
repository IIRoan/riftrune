import { ThemedIcon, ChevronLeftIcon, DownloadIcon, InfoIcon, ListIcon, MenuIcon, PencilIcon, SlidersHorizontalIcon } from '@/components/icons';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { DeckShareMenu } from '@/components/deck/DeckShareMenu';
import { DeckValidationMenu } from '@/components/deck/DeckValidationMenu';
import { PillNav, type PillNavItem } from '@/components/shell/FloatingPillNav';
import { TextInput } from '@/components/ui/text-input';
import { Text } from '@/components/ui/text';
import { countCatalogFilters, type CatalogFilters } from '@/constants/catalogFilters';
import { useMobileLayout } from '@/hooks/useBreakpoint';
import type { DeckState, DeckValidationMessage } from '@/lib/deck-types';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

type DeckCatalogSection = 'mainDeck' | 'sideboard';

/** Shared size for every deck-builder toolbar control (36×36). */
const TOOLBAR_CONTROL =
  'size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card active:bg-card-panel';

interface DeckBuilderToolbarProps {
  deck: DeckState;
  deckName: string;
  readOnly?: boolean;
  validation: DeckValidationMessage[];
  onBack: () => void;
  backAccessibilityLabel?: string;
  onNameChange?: (name: string) => void;
  onToggleValidation?: () => void;
  validationExpanded?: boolean;
  onImport?: () => void;
  /** Owned view mode → enter the deck builder */
  onEdit?: () => void;
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
  deck,
  deckName,
  readOnly = false,
  validation,
  onBack,
  backAccessibilityLabel = 'Back to decks',
  onNameChange,
  onToggleValidation,
  validationExpanded = false,
  onImport,
  onEdit,
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
  const showCatalogFilters =
    isMobile && !readOnly && catalogFilters != null && onOpenCatalogFilters != null;
  const filterCount = showCatalogFilters ? countCatalogFilters(catalogFilters) : 0;
  const filterActive = filterCount > 0;

  const panelActions = (
    <>
      {isMobile && onOpenInfo ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open deck info"
          className={TOOLBAR_CONTROL}
          onPress={onOpenInfo}
        >
          <ThemedIcon icon={InfoIcon} size={18} color="foreground" />
        </Pressable>
      ) : null}
      {isMobile && onOpenList ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open deck list"
          className={TOOLBAR_CONTROL}
          onPress={onOpenList}
        >
          <ThemedIcon icon={ListIcon} size={18} color="foreground" />
        </Pressable>
      ) : null}
      {!isMobile && onToggleInfoDrawer ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={infoDrawerOpen ? 'Hide deck info' : 'Show deck info'}
          accessibilityState={{ selected: infoDrawerOpen === true }}
          className={cn(TOOLBAR_CONTROL, infoDrawerOpen && 'border-primary/40')}
          onPress={onToggleInfoDrawer}
        >
          <ThemedIcon
            icon={MenuIcon}
            size={18}
            color={infoDrawerOpen ? 'primary' : 'foreground'}
          />
        </Pressable>
      ) : null}
    </>
  );

  const editAction = onEdit ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Edit deck"
      className="h-9 shrink-0 flex-row items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-2.5 active:bg-primary/20"
      onPress={() => {
        hapticPress();
        onEdit();
      }}
    >
      <ThemedIcon icon={PencilIcon} size={16} color="primary" />
      <Text className="text-[13px] font-semibold text-primary">Edit</Text>
    </Pressable>
  ) : null;

  const ioActions = (
    <>
      {onImport ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Import deck list"
          className={TOOLBAR_CONTROL}
          onPress={onImport}
        >
          <ThemedIcon icon={DownloadIcon} size={18} color="foreground" />
        </Pressable>
      ) : null}
      <DeckShareMenu deck={deck} />
    </>
  );

  const validationAction =
    validation.length > 0 && onToggleValidation ? (
      <DeckValidationMenu
        messages={validation}
        open={validationExpanded}
        onOpenChange={() => onToggleValidation()}
        showLabel={!isMobile}
        align="end"
        className={isMobile ? 'h-9' : undefined}
      />
    ) : null;

  const catalogFilterAction = showCatalogFilters ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open filters"
      className={cn(TOOLBAR_CONTROL, 'relative', filterActive && 'border-ring/50 bg-card-panel')}
      onPress={() => {
        hapticPress();
        onOpenCatalogFilters();
      }}
    >
      <ThemedIcon icon={SlidersHorizontalIcon}
        size={18}
        color={filterActive ? 'foreground' : 'muted-foreground'}
      />
      {filterActive ? (
        filterCount === 1 ? (
          <View className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
        ) : (
          <View className="absolute -right-1 -top-1 size-4 items-center justify-center rounded-full bg-primary">
            <Text className="font-mono text-[9px] font-semibold text-primary-foreground">
              {filterCount}
            </Text>
          </View>
        )
      ) : null}
    </Pressable>
  ) : null;

  const trailingActions = (
    <View className="z-20 shrink-0 flex-row items-center gap-1">
      {catalogFilterAction}
      {panelActions}
      {ioActions}
      {validationAction}
      {editAction}
    </View>
  );

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
    <View className="z-20 h-9 min-w-0 flex-row items-center gap-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backAccessibilityLabel}
        className={TOOLBAR_CONTROL}
        onPress={onBack}
      >
        <ThemedIcon icon={ChevronLeftIcon} size={20} color="foreground" />
      </Pressable>

      {isMobile ? (
        <>
          {sectionNav}
          <View className="min-w-0 flex-1" />
          {trailingActions}
        </>
      ) : (
        <>
          <View className="min-h-0 min-w-0 flex-1 justify-center">
            {!readOnly && onNameChange ? (
              <TextInput
                value={deckName}
                onChangeText={onNameChange}
                placeholder="Deck name"
                className="h-9 min-h-9 py-0 text-base font-semibold"
              />
            ) : (
              <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>
                {deckName}
              </Text>
            )}
          </View>
          {sectionNav}
          {trailingActions}
        </>
      )}
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
