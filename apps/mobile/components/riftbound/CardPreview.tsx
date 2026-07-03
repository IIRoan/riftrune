import { Image } from 'expo-image';
import { View } from 'react-native';

interface Props {
  imageUrl: string;
  width?: number;
  minHeight?: number;
}

/** Compact spotlight pedestal for card art — matches riftrune archive detail panel. */
export function CardPreview({ imageUrl, width, minHeight = 188 }: Props) {
  const imageMaxHeight = Math.max(80, minHeight - 28);
  const imageMaxWidth = width ? Math.max(80, width - 28) : undefined;

  return (
    <View
      className="relative w-full items-center justify-center overflow-hidden rounded-t-xl bg-card-panel p-3.5"
      style={{ minHeight, width, height: minHeight }}
    >
      <View
        className="aspect-[5/7] w-full"
        style={{ maxHeight: imageMaxHeight, maxWidth: imageMaxWidth }}
      >
        <Image
          key={imageUrl}
          recyclingKey={imageUrl}
          source={{ uri: imageUrl }}
          className="size-full rounded-lg"
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        />
      </View>
    </View>
  );
}
