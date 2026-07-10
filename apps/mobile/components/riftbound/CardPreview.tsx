import { View } from 'react-native';
import { CardArtImage } from '@/components/cards/CardArtImage';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { cn } from '@/lib/utils';
import { resolveImageUrl } from '@/utils/resolveImageUrl';

interface Props {
  imageUrl: string;
  width?: number;
  minHeight?: number;
}

/** Compact spotlight pedestal for card art — matches riftrune archive detail panel. */
export function CardPreview({ imageUrl, width, minHeight = 188 }: Props) {
  const imageMaxHeight = Math.max(80, minHeight - 28);
  const imageMaxWidth = width ? Math.max(80, width - 28) : undefined;
  const resolvedUrl = resolveImageUrl(imageUrl);

  return (
    <View
      className="relative w-full items-center justify-center overflow-hidden rounded-t-xl bg-card-panel p-3.5"
      style={{ minHeight, width, height: minHeight }}
    >
      <CardArtImage
        uri={resolvedUrl}
        recyclingKey={resolvedUrl ?? imageUrl}
        className={cn(CARD_ART_RADIUS_CLASS)}
        style={{
          aspectRatio: 5 / 7,
          width: imageMaxWidth ?? '100%',
          maxHeight: imageMaxHeight,
          maxWidth: imageMaxWidth,
          height: imageMaxHeight,
        }}
        contentFit="contain"
        contentPosition="center"
      />
    </View>
  );
}
