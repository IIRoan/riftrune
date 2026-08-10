import { FlashList } from '@shopify/flash-list';
import { Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { useCallback } from 'react';
import {
  deckSectionsForFormat,
  type DeckSectionKey,
  type DeckState,
} from '@/lib/deck-types';
import { getSectionCount } from '@/lib/deck-card';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface DeckSectionListProps {
  deck: DeckState;
  activeSection: DeckSectionKey;
  onSectionChange: (section: DeckSectionKey) => void;
  onRemove: (section: DeckSectionKey, name?: string) => void;
  onChangeQty: (
    section: Exclude<DeckSectionKey, 'legend' | 'champion'>,
    name: string,
    delta: number
  ) => void;
  onToggleSideboard?: () => void;
  onBrowseCards?: () => void;
  collectionByName?: ReadonlyMap<string, number>;
  paddingBottom?: number;
}

function sectionLabel(
  deck: DeckState,
  section: ReturnType<typeof deckSectionsForFormat>[number]
): string {
  const count = getSectionCount(deck, section.key);
  if (section.optional) return `${section.title} ${count}/${section.target}`;
  if (section.isMin) return `${section.title} ${count}/${section.target}+`;
  if (section.single) return `${section.title} ${count}/${section.target}`;
  return `${section.title} ${count}/${section.target}`;
}

export function DeckSectionTabs({
  deck,
  activeSection,
  onSectionChange,
}: Pick<DeckSectionListProps, 'deck' | 'activeSection' | 'onSectionChange'>) {
  const sections = deckSectionsForFormat(deck.format);

  const renderSectionTab = useCallback(
    ({ item: section }: { item: (typeof sections)[number] }) => {
      const selected = activeSection === section.key;
      const count = getSectionCount(deck, section.key);
      const complete =
        section.single || section.isMin
          ? count >= section.target
          : count === section.target;

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected }}
          onPress={() => {
            hapticPress();
            onSectionChange(section.key);
          }}
          className={cn(
            'rounded-[3px] px-3 py-2 active:opacity-90',
            selected ? 'bg-card-panel' : 'bg-card-panel active:bg-card'
          )}
        >
          <Text
            className={cn(
              'text-[12px] font-normal',
              selected ? 'text-foreground' : 'text-muted-foreground',
              !selected && complete && count > 0 && 'text-success'
            )}
          >
            {sectionLabel(deck, section)}
          </Text>
        </Pressable>
      );
    },
    [activeSection, deck, onSectionChange]
  );

  return (
    <FlashList
      horizontal
      data={sections}
      keyExtractor={(section) => section.key}
      renderItem={renderSectionTab}
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-1.5 pr-2"
      className="max-h-10"
    />
  );
}
