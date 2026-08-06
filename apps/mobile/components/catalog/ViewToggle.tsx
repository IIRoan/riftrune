import { LayoutGridIcon, ListIcon, ThemedIcon } from '@/components/icons';
import { Pressable, View } from 'react-native';
import {
  catalogToolbarGroupClass,
  catalogToolbarIconColor,
  catalogToolbarSegmentClasses,
} from '@/constants/catalogToolbar';

interface ViewToggleProps {
  view: 'list' | 'grid';
  onViewChange: (view: 'list' | 'grid') => void;
  mobile?: boolean;
}

/** Segmented list/grid control — same chrome on phone and desktop. */
export function ViewToggle({ view, onViewChange, mobile = false }: ViewToggleProps) {
  const options = [
    { id: 'list' as const, icon: ListIcon, label: 'List view' },
    { id: 'grid' as const, icon: LayoutGridIcon, label: 'Grid view' },
  ] as const;

  return (
    <View accessibilityRole="radiogroup" className={catalogToolbarGroupClass(mobile)}>
      {options.map(({ id, icon, label }) => {
        const active = view === id;
        const iconTone = active ? 'active' : 'inactive';
        return (
          <Pressable
            key={id}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={label}
            onPress={() => {
              onViewChange(id);
            }}
            className={catalogToolbarSegmentClasses(active, mobile)}
          >
            <ThemedIcon icon={icon} size={18} color={catalogToolbarIconColor(iconTone)} />
          </Pressable>
        );
      })}
    </View>
  );
}
