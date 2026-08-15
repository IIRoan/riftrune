import { View } from 'react-native';
import { CatalogResultsTransition } from '@/components/catalog/CatalogResultsTransition';
import { DECK_INFO_DRAWER_WIDTH } from '@/components/deck/DeckBuilderInfoDrawer';
import type { DeckBuilderMiddlePanel } from '@/components/deck/DeckBuilderMiddlePanelToggle';
import { DECK_COMPOSITION_LIST_WIDTH } from '@/components/deck/DeckCompositionList';
import { Layout } from '@/constants/Layout';
import { cn } from '@/lib/utils';

interface DeckBuilderWorkspaceProps {
  readOnly: boolean;
  isMobile: boolean;
  infoDrawerOpen: boolean;
  middlePanel: DeckBuilderMiddlePanel;
  infoDrawer: React.ReactNode;
  descriptionPanel: React.ReactNode;
  catalogPanel: React.ReactNode;
  statsPanel: React.ReactNode;
  compositionList: React.ReactNode;
  showcasePanel: React.ReactNode;
}

function middleContent(
  readOnly: boolean,
  middlePanel: DeckBuilderMiddlePanel,
  panels: {
    descriptionPanel: React.ReactNode;
    catalogPanel: React.ReactNode;
    statsPanel: React.ReactNode;
    showcasePanel: React.ReactNode;
  }
) {
  if (middlePanel === 'stats') return panels.statsPanel;
  if (readOnly) return panels.showcasePanel;
  if (middlePanel === 'description') return panels.descriptionPanel;
  return panels.catalogPanel;
}

function CenterColumn({
  panelKey,
  framed = false,
  children,
}: {
  panelKey: string;
  framed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <CatalogResultsTransition
      transitionKey={panelKey}
      className={cn(
        'min-h-0 min-w-0 flex-1',
        framed &&
          'overflow-hidden rounded-[10px] border border-border bg-card px-3 py-3'
      )}
    >
      {children}
    </CatalogResultsTransition>
  );
}

export function DeckBuilderWorkspace({
  readOnly,
  isMobile,
  infoDrawerOpen,
  middlePanel,
  infoDrawer,
  descriptionPanel,
  catalogPanel,
  statsPanel,
  compositionList,
  showcasePanel,
}: DeckBuilderWorkspaceProps) {
  const center = middleContent(readOnly, middlePanel, {
    descriptionPanel,
    catalogPanel,
    statsPanel,
    showcasePanel,
  });

  if (readOnly) {
    if (isMobile) {
      return <CenterColumn panelKey={middlePanel}>{center}</CenterColumn>;
    }

    return (
      <View className="min-h-0 flex-1 flex-row" style={{ gap: Layout.gridGap }}>
        <CenterColumn panelKey={middlePanel} framed>
          {center}
        </CenterColumn>
        <View
          className="min-h-0 overflow-hidden rounded-[10px] border border-border bg-card"
          style={{ width: DECK_COMPOSITION_LIST_WIDTH }}
        >
          {compositionList}
        </View>
      </View>
    );
  }

  if (isMobile) {
    return <CenterColumn panelKey={middlePanel}>{center}</CenterColumn>;
  }

  return (
    <View className="min-h-0 flex-1 flex-row" style={{ gap: Layout.gridGap }}>
      <View
        className={cn(
          'min-h-0 overflow-hidden rounded-[10px] border border-border bg-card',
          !infoDrawerOpen && 'border-0'
        )}
        style={{
          width: infoDrawerOpen ? DECK_INFO_DRAWER_WIDTH : 0,
          opacity: infoDrawerOpen ? 1 : 0,
        }}
        pointerEvents={infoDrawerOpen ? 'auto' : 'none'}
      >
        {infoDrawer}
      </View>

      <CenterColumn panelKey={middlePanel}>{center}</CenterColumn>

      <View
        className="min-h-0 overflow-hidden rounded-[10px] border border-border bg-card"
        style={{ width: DECK_COMPOSITION_LIST_WIDTH }}
      >
        {compositionList}
      </View>
    </View>
  );
}
