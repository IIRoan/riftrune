import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Badge, BadgeText } from '@/components/ui/badge';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export function CardStat({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <Stack
      className={cn(
        'flex-1 items-center',
        compact ? 'gap-1 px-2 py-2' : 'gap-2 px-5 py-4'
      )}
    >
      <Text
        className={cn(
          'font-semibold uppercase tracking-widest text-muted-foreground',
          compact ? 'text-[9px] tracking-wide' : 'text-[10px]'
        )}
      >
        {label}
      </Text>
      {children}
    </Stack>
  );
}

export function CardAttributeRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-4 border-t border-border py-3">
      <Text className="w-12 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Text>
      <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">{children}</View>
    </View>
  );
}

export function CardTag({ label }: { label: string }) {
  return (
    <Badge variant="secondary" className="rounded">
      <BadgeText className="text-xs">{label}</BadgeText>
    </Badge>
  );
}

export function CardPriceRow({ finish, price }: { finish: string; price: string }) {
  return (
    <View className="flex-row items-baseline justify-between border-t border-border py-3">
      <Text className="text-[13px] font-medium text-muted-foreground">{finish}</Text>
      <Text className="text-xl font-black tabular-nums text-success">{price}</Text>
    </View>
  );
}

export function CardSectionLabel({ children }: { children: string }) {
  return <SectionLabel className="mb-3">{children}</SectionLabel>;
}
