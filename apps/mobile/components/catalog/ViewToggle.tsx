import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  view: 'list' | 'grid';
  onViewChange: (view: 'list' | 'grid') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  const options = [
    { id: 'list' as const, icon: 'list' as const, label: 'List view' },
    { id: 'grid' as const, icon: 'grid' as const, label: 'Grid view' },
  ];

  return (
    <View
      accessibilityRole="radiogroup"
      className="flex-row items-center rounded-lg border border-border p-0.5"
    >
      {options.map(({ id, icon, label }) => (
        <Pressable
          key={id}
          accessibilityRole="radio"
          accessibilityState={{ checked: view === id }}
          accessibilityLabel={label}
          onPress={() => {
            onViewChange(id);
          }}
          className={cn(
            'size-8 items-center justify-center rounded-md',
            view === id ? 'bg-card-panel' : 'active:opacity-70'
          )}
        >
          <Ionicons
            name={icon}
            size={18}
            className={view === id ? 'text-foreground' : 'text-muted-foreground'}
          />
        </Pressable>
      ))}
    </View>
  );
}
