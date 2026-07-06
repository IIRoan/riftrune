import { Pressable, View } from 'react-native';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import {
  catalogToolbarButtonClasses,
  catalogToolbarGroupClass,
  catalogToolbarIconColor,
  catalogToolbarMobileSlotClass,
  catalogToolbarSegmentClasses,
} from '@/constants/catalogToolbar';

interface ViewToggleProps {
  view: 'list' | 'grid';
  onViewChange: (view: 'list' | 'grid') => void;
  mobile?: boolean;
}

export function ViewToggle({ view, onViewChange, mobile = false }: ViewToggleProps) {
  const options = [
    { id: 'list' as const, icon: 'list' as const, label: 'List view' },
    { id: 'grid' as const, icon: 'grid' as const, label: 'Grid view' },
  ];

  if (mobile) {
    return (
      <>
        {options.map(({ id, icon, label }) => {
          const active = view === id;
          const iconTone = active ? 'active' : 'inactive';
          return (
            <View key={id} className={catalogToolbarMobileSlotClass()}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={label}
                onPress={() => {
                  onViewChange(id);
                }}
                className={catalogToolbarButtonClasses(active, true)}
              >
                <ThemedIonicon
                  name={icon}
                  size={18}
                  color={catalogToolbarIconColor(iconTone)}
                />
              </Pressable>
            </View>
          );
        })}
      </>
    );
  }

  return (
    <View accessibilityRole="radiogroup" className={catalogToolbarGroupClass()}>
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
            className={catalogToolbarSegmentClasses(active)}
          >
            <ThemedIonicon
              name={icon}
              size={18}
              color={catalogToolbarIconColor(iconTone)}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
