import { View } from 'react-native';
import { DECK_INFO_DRAWER_WIDTH } from '@/components/deck/DeckBuilderInfoDrawer';
import {
  DeckBuilderMiddlePanelToggle,
  type DeckBuilderMiddlePanel,
} from '@/components/deck/DeckBuilderMiddlePanelToggle';
import { DECK_COMPOSITION_LIST_WIDTH } from '@/components/deck/DeckCompositionList';
import { Layout } from '@/constants/Layout';
import { cn } from '@/lib/utils';

interface DeckBuilderWorkspaceProps {
  readOnly: boolean;
  isMobile: boolean;
  infoDrawerOpen: boolean;
  middlePanel: DeckBuilderMiddlePanel;
  onMiddlePanelChange: (panel: DeckBuilderMiddlePanel) => void;
  infoDrawer: React.ReactNode;
  descriptionPanel: React.ReactNode;
  catalogPanel: React.ReactNode;
  compositionList: React.ReactNode;
  showcasePanel: React.ReactNode;
}

export function DeckBuilderWorkspace({
  readOnly,
  isMobile,
  infoDrawerOpen,
  middlePanel,
  onMiddlePanelChange,
  infoDrawer,
  descriptionPanel,
  catalogPanel,
  compositionList,
  showcasePanel,
}: DeckBuilderWorkspaceProps) {
  if (readOnly) {
    if (isMobile) {
      return <View className="min-h-0 flex-1">{showcasePanel}</View>;
    }

    return (
      <View className="min-h-0 flex-1 flex-row" style={{ gap: Layout.gridGap }}>
        <View className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-[10px] border border-border bg-card px-3 py-3">
          {showcasePanel}
        </View>
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
    return (
      <View className="min-h-0 flex-1 gap-3">
        <DeckBuilderMiddlePanelToggle value={middlePanel} onChange={onMiddlePanelChange} />
        {middlePanel === 'description' ? descriptionPanel : catalogPanel}
      </View>
    );
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

      <View className="min-h-0 min-w-0 flex-1">
        {middlePanel === 'description' ? descriptionPanel : catalogPanel}
      </View>

      <View
        className="min-h-0 overflow-hidden rounded-[10px] border border-border bg-card"
        style={{ width: DECK_COMPOSITION_LIST_WIDTH }}
      >
        {compositionList}
      </View>
    </View>
  );
}
