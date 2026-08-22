import { memo } from 'react';
import { View } from 'react-native';
import { CardArtImage } from '@/components/cards/CardArtImage';
import { CATALOG_ART_THUMB_WIDTH } from '@/constants/CardArt';

type DeckCardArtProps = {
  uri: string;
  variantNumber: string;
};

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
        instant
        thumbWidth={CATALOG_ART_THUMB_WIDTH}
        progressive
      />
    </View>
  );
}

export const DeckCardArt = memo(
  DeckCardArtInner,
  (prev, next) => prev.uri === next.uri && prev.variantNumber === next.variantNumber
);
