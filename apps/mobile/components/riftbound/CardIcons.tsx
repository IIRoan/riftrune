import { Image } from 'expo-image';
import { View } from 'react-native';
import { typeIconFor, rarityIconFor, domainIconFor, mightIcon } from '@/constants/gameAssets';
import { KeywordBadge } from '@/components/riftbound/KeywordBadge';
import { Text } from '@/components/ui/text';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

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
}: {
  name: string;
  imageUrl?: string;
  size?: number;
}) {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: resolveImageUrl(imageUrl) }}
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
      style={{ width: size, height: size }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
      accessibilityLabel={name}
    />
  );
}

export function TypeIcon({ type, size = 15 }: { type: string; size?: number }) {
  const source = typeIconFor(type);
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

export function RarityIcon({ rarity, size = 15 }: { rarity: string; size?: number }) {
  const source = rarityIconFor(rarity);
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
