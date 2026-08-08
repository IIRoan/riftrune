import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { XIcon } from '@/components/icons';
import { DomainIcon } from '@/components/riftbound/CardIcons';
import { Text } from '@/components/ui/text';
import type { CatalogFilterChip } from '@/constants/catalogFilters';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

function parseCatalogFilterChipDisplay(
  chip: CatalogFilterChip
): { category: string; value?: string } {
  if (chip.colorNames && chip.colorNames.length > 0) {
    return { category: chip.label };
  }

  const colonIdx = chip.label.indexOf(': ');
  if (colonIdx !== -1) {
    return {
      category: chip.label.slice(0, colonIdx),
      value: chip.label.slice(colonIdx + 2),
    };
  }

  const statMatch = chip.label.match(/^(Energy|Power|Might)\s+(.+)$/);
  if (statMatch) {
    return { category: statMatch[1]!, value: statMatch[2] };
  }

  return { category: chip.label };
}

function FilterChipDismissButton({
  label,
  onPress,
  compact = false,
  className,
}: {
  label: string;
  onPress: () => void;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        hapticPress();
        onPress();
      }}
      hitSlop={compact ? 6 : 4}
      className={cn(
        'shrink-0 items-center justify-center rounded-md active:bg-accent/80',
        compact ? 'size-8' : 'size-7',
        className
      )}
    >
      <XIcon className={cn('text-muted-foreground', compact ? 'size-4' : 'size-3.5')} />
    </Pressable>
  );
}

function FilterChipValuePill({
  children,
  onRemove,
  removeLabel,
  compact = false,
}: {
  children: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
  compact?: boolean;
}) {
  return (
    <View
      className={cn(
        'flex-row items-center rounded-md bg-background/80',
        compact ? 'px-1 py-0.5' : 'px-1.5 py-0.5'
      )}
    >
      {children}
      {onRemove ? (
        <FilterChipDismissButton
          label={removeLabel ?? 'Remove'}
          onPress={onRemove}
          compact={compact}
          className={compact ? 'size-6' : 'size-5'}
        />
      ) : null}
    </View>
  );
}

interface CatalogActiveFilterChipProps {
  chip: CatalogFilterChip;
  colorImageByName?: Map<string, { imageUrl?: string } | undefined>;
  onClear: () => void;
  onRemoveColor?: (name: string) => void;
  /** Tighter sizing for phone horizontal scroll rows. */
  compact?: boolean;
}

/** Shared active-filter chip — category, value, dismiss. Used on phone and desktop. */
export function CatalogActiveFilterChip({
  chip,
  colorImageByName,
  onClear,
  onRemoveColor,
  compact = false,
}: CatalogActiveFilterChipProps) {
  const { category, value } = parseCatalogFilterChipDisplay(chip);

  const valueContent =
    chip.colorNames && chip.colorNames.length > 0 ? (
      <View className="flex-row flex-wrap items-center gap-1">
        {chip.colorNames.map((name) => (
          <FilterChipValuePill
            key={name}
            compact={compact}
            removeLabel={`Remove ${name} color filter`}
            onRemove={
              onRemoveColor
                ? () => {
                    onRemoveColor(name);
                  }
                : undefined
            }
          >
            <View className="flex-row items-center gap-1 pr-0.5">
              <DomainIcon
                name={name}
                imageUrl={colorImageByName?.get(name)?.imageUrl}
                size={compact ? 13 : 14}
              />
              <Text
                className={cn(
                  'font-medium text-foreground',
                  compact ? 'text-[11px]' : 'text-[12px]'
                )}
              >
                {name}
              </Text>
            </View>
          </FilterChipValuePill>
        ))}
      </View>
    ) : value ? (
      <Text
        className={cn('font-medium text-foreground', compact ? 'text-[11px]' : 'text-[12px]')}
        numberOfLines={compact ? 1 : 2}
      >
        {value}
      </Text>
    ) : null;

  return (
    <View
      className={cn(
        'flex-row items-stretch overflow-hidden rounded-md border border-border',
        compact ? 'bg-card' : 'bg-card-panel/50'
      )}
    >
      <View
        className={cn(
          'justify-center border-r border-border/60',
          compact ? 'px-2 py-1' : 'px-2.5 py-1.5'
        )}
      >
        <Text
          className={cn(
            'font-semibold leading-none text-muted-foreground',
            compact ? 'text-[10px]' : 'text-[11px]'
          )}
        >
          {category}
        </Text>
      </View>

      {valueContent ? (
        <View className={cn('min-w-0 justify-center', compact ? 'px-1.5 py-0.5' : 'px-2 py-1')}>
          {valueContent}
        </View>
      ) : null}

      <View className="justify-center border-l border-border/60">
        <FilterChipDismissButton
          label={`Clear ${category} filter`}
          onPress={onClear}
          compact={compact}
        />
      </View>
    </View>
  );
}
