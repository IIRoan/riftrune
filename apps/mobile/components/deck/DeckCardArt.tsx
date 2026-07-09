import { Image } from 'expo-image';
import { memo } from 'react';
import { View } from 'react-native';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';

type DeckCardArtProps = {
  uri: string;
  variantNumber: string;
};

/** Static deck-builder card art — no fade transition, disk+memory cache. */
function DeckCardArtInner({ uri, variantNumber }: DeckCardArtProps) {
  if (!uri) {
    return (
      <View className="flex-1 items-center justify-center bg-card-panel">
        <ThemedIonicon name="image-outline" size={20} color="muted-foreground" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      recyclingKey={variantNumber}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      contentFit="cover"
      contentPosition="top"
      transition={0}
      cachePolicy="memory-disk"
      priority="high"
    />
  );
}

export const DeckCardArt = memo(
  DeckCardArtInner,
  (prev, next) => prev.uri === next.uri && prev.variantNumber === next.variantNumber
);
