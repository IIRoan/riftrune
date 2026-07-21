import { Image } from 'expo-image';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { domainIconFor } from '@/constants/gameAssets';
import { cn } from '@/lib/utils';

/** Official Riftbound domain order from core rules. */
export const AUTH_DOMAINS = ['Fury', 'Calm', 'Mind', 'Body', 'Chaos', 'Order'] as const;

export function AuthDomainStrip({
  className,
  size = 22,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <View
      className={cn('flex-row items-center justify-between gap-1', className)}
      accessibilityRole="image"
      accessibilityLabel="Riftbound domains: Fury, Calm, Mind, Body, Chaos, Order"
    >
      {AUTH_DOMAINS.map((domain) => {
        const source = domainIconFor(domain);
        if (!source) return null;
        return (
          <Image
            key={domain}
            source={source}
            style={{ width: size, height: size }}
            contentFit="contain"
            accessibilityLabel={domain}
          />
        );
      })}
    </View>
  );
}

/** Corner ticks inspired by Riftbound hextech frame language — no glow. */
export function AuthSlabCorners() {
  const tick = 'absolute h-3 w-3 border-foreground/45';
  return (
    <>
      <View className={cn(tick, 'top-3 left-3 border-t border-l')} pointerEvents="none" />
      <View className={cn(tick, 'top-3 right-3 border-t border-r')} pointerEvents="none" />
      <View className={cn(tick, 'bottom-3 left-3 border-b border-l')} pointerEvents="none" />
      <View className={cn(tick, 'right-3 bottom-3 border-r border-b')} pointerEvents="none" />
    </>
  );
}

export function AuthBrandLockup({
  light = false,
  showDomains = true,
}: {
  light?: boolean;
  showDomains?: boolean;
}) {
  return (
    <View className="gap-4">
      <Text
        className={cn(
          'text-[26px] font-semibold tracking-tight',
          light ? 'text-white' : 'text-foreground'
        )}
        accessibilityRole="header"
      >
        Riftrune
      </Text>
      {showDomains ? <AuthDomainStrip size={24} /> : null}
    </View>
  );
}
