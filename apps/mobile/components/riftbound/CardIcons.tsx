import { Image } from 'expo-image';
import { Platform, View } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { typeIconFor, rarityIconFor, domainIconFor, mightIcon } from '@/constants/gameAssets';
import { KeywordBadge } from '@/components/riftbound/KeywordBadge';
import { Text } from '@/components/ui/text';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { cn } from '@/lib/utils';

export type GameIconTone = 'default' | 'foreground';

function useForegroundIconTint(tone: GameIconTone): string | undefined {
  const foreground = useCSSVariable('--color-foreground') as string | undefined;
  if (tone !== 'foreground' || !foreground) return undefined;
  return foreground;
}

function gameIconClassName(tone: GameIconTone, className?: string): string | undefined {
  if (tone !== 'foreground') return className;
  return cn(
    className,
    Platform.OS === 'web' ? 'brightness-0 dark:brightness-100' : undefined
  );
}

function gameIconStyle(size: number, tint?: string) {
  return tint ? { width: size, height: size, tintColor: tint } : { width: size, height: size };
}

interface PipProps {
  value: number | string;
  size?: number;
}

export function EnergyPip({ value, size = 32 }: PipProps) {
  return (
    <View
      className="items-center justify-center rounded-full border border-border bg-background"
      style={{ width: size, height: size }}
      accessibilityLabel={`${String(value)} energy`}
    >
      <Text className="font-extrabold text-foreground" style={{ fontSize: size * 0.42 }}>
        {value}
      </Text>
    </View>
  );
}

export function AccelerateBadge() {
  return <KeywordBadge label="ACCELERATE" />;
}

export function FuryIcon({ size = 15 }: { size?: number }) {
  const source = domainIconFor('Fury');
  if (!source) return null;
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

export function UnitIcon({ size = 15 }: { size?: number }) {
  const source = typeIconFor('Unit');
  if (!source) return null;
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

export function RarityCoin({ size = 15 }: { size?: number }) {
  const source = rarityIconFor('Common');
  if (!source) return null;
  return (
    <Image
      source={source}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

export function MightIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <View className={className} style={{ width: size, height: size }}>
      <Image
        source={mightIcon}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
        accessibilityLabel="Might"
      />
    </View>
  );
}

export function DomainIcon({
  name,
  imageUrl,
  size = 15,
  className,
}: {
  name: string;
  imageUrl?: string;
  size?: number;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: resolveImageUrl(imageUrl) }}
        className={className}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
        accessibilityLabel={name}
      />
    );
  }
  const source = domainIconFor(name);
  if (!source) return null;
  return (
    <Image
      source={source}
      className={className}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
      accessibilityLabel={name}
    />
  );
}

export function TypeIcon({
  type,
  size = 15,
  tone = 'default',
  className,
}: {
  type: string;
  size?: number;
  tone?: GameIconTone;
  className?: string;
}) {
  const source = typeIconFor(type);
  if (!source) return null;
  const tint = useForegroundIconTint(tone);
  return (
    <Image
      source={source}
      className={gameIconClassName(tone, className)}
      style={gameIconStyle(size, tint)}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}

export function RarityIcon({
  rarity,
  size = 15,
  className,
}: {
  rarity: string;
  size?: number;
  className?: string;
}) {
  const source = rarityIconFor(rarity);
  if (!source) return null;
  return (
    <Image
      source={source}
      className={className}
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  );
}
