import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { furyIcon } from '@/assets/icons';
import { typeIconFor, rarityIconFor } from '@/constants/gameAssets';
import { KeywordBadge } from '@/components/riftbound/KeywordBadge';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

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
  return (
    <Image
      source={furyIcon}
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
    <MaterialCommunityIcons
      name="sword-cross"
      size={size}
      className={cn('text-muted-foreground', className)}
    />
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
        source={{ uri: imageUrl }}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    );
  }
  if (name.toLowerCase() === 'fury') {
    return <FuryIcon size={size} />;
  }
  return null;
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
