import { Pressable, View } from 'react-native';
import { CardsIcon, PencilIcon, ThemedIcon } from '@/components/icons';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

export type DeckBuilderMiddlePanel = 'catalog' | 'description';

const OPTIONS: readonly {
  value: DeckBuilderMiddlePanel;
  label: string;
  icon: typeof CardsIcon;
}[] = [
  { value: 'catalog', label: 'Cards', icon: CardsIcon },
  { value: 'description', label: 'Desc', icon: PencilIcon },
];

interface DeckBuilderMiddlePanelToggleProps {
  value: DeckBuilderMiddlePanel;
  onChange: (panel: DeckBuilderMiddlePanel) => void;
  className?: string;
}

/** Left-rail control that swaps the middle builder column. */
export function DeckBuilderMiddlePanelToggle({
  value,
  onChange,
  className,
}: DeckBuilderMiddlePanelToggleProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      className={cn(
        'flex-row gap-1 rounded-lg border border-border bg-card-panel p-1',
        className
      )}
    >
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={
              option.value === 'catalog' ? 'Show card catalog' : 'Edit deck description'
            }
            className={cn(
              'min-h-9 flex-1 flex-row items-center justify-center gap-1.5 rounded-md px-2 py-1.5',
              selected ? 'border border-border bg-card' : 'active:bg-accent/60'
            )}
            onPress={() => {
              if (selected) return;
              hapticPress();
              onChange(option.value);
            }}
          >
            <ThemedIcon
              icon={option.icon}
              size={14}
              color={selected ? 'foreground' : 'muted-foreground'}
            />
            <Text
              className={cn(
                'text-[13px] font-semibold',
                selected ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
