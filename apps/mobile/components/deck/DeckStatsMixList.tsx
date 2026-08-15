import { View } from 'react-native';
import { DomainIcon, RarityIcon, TypeIcon } from '@/components/riftbound/CardIcons';
import { Text } from '@/components/ui/text';
import { domainFillClass } from '@/lib/domain-fill';
import type { DeckStatMixItem } from '@/lib/deck-stats';
import { cn } from '@/lib/utils';

interface DeckStatsMixListProps {
  items: readonly DeckStatMixItem[];
  emptyLabel: string;
}

export function DeckStatsMixList({ items, emptyLabel }: DeckStatsMixListProps) {
  if (items.length === 0) {
    return (
      <Text className="text-sm leading-5 text-muted-foreground">{emptyLabel}</Text>
    );
  }

  const peak = Math.max(...items.map((item) => item.count), 1);

  return (
    <View className="gap-3">
      {items.map((item) => {
        const ratio = item.count / peak;
        return (
          <View key={item.key} className="gap-1.5">
            <View className="flex-row items-center justify-between gap-2">
              <View className="min-w-0 flex-1 flex-row items-center gap-2">
                {item.kind === 'domain' ? (
                  <DomainIcon name={item.label} size={16} />
                ) : null}
                {item.kind === 'type' ? (
                  <TypeIcon type={item.label} size={16} tone="foreground" />
                ) : null}
                {item.kind === 'rarity' ? (
                  <RarityIcon rarity={item.label} size={16} />
                ) : null}
                <Text
                  className="text-[13px] font-normal text-foreground"
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
              <Text className="font-mono text-[12px] font-medium tabular-nums text-foreground">
                {item.count}
              </Text>
            </View>
            <View className="h-1.5 overflow-hidden rounded-none bg-border/70">
              <View
                className={cn(
                  'h-full rounded-none',
                  item.kind === 'domain' ? domainFillClass(item.label) : 'bg-foreground'
                )}
                style={{ width: `${Math.max(ratio * 100, item.count > 0 ? 6 : 0)}%` }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}
