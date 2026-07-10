import { memo } from 'react';
import { View } from 'react-native';
import { CardArtImage } from '@/components/cards/CardArtImage';

type DeckCardArtProps = {
  uri: string;
  variantNumber: string;
};

/** Static deck-builder card art with shimmer loading and disk+memory cache. */
function DeckCardArtInner({ uri, variantNumber }: DeckCardArtProps) {
  return (
    <View className="absolute inset-0 items-center justify-center p-1">
      <CardArtImage
        uri={uri}
        recyclingKey={variantNumber}
        className="h-full w-full"
        contentFit="contain"
        contentPosition="center"
        transition={0}
        priority="high"
      />
    </View>
  );
}

export const DeckCardArt = memo(
  DeckCardArtInner,
  (prev, next) => prev.uri === next.uri && prev.variantNumber === next.variantNumber
);
