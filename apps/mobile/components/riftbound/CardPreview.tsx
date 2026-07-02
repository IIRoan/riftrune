import { Image } from 'expo-image';
import { View } from 'react-native';

interface Props {
  imageUrl: string;
  width?: number;
  minHeight?: number;
}

export function CardPreview({ imageUrl, width, minHeight = 520 }: Props) {
  return (
    <View
      className="relative w-full bg-card-panel"
      style={{ minHeight, width, height: minHeight }}
    >
      <Image
        key={imageUrl}
        recyclingKey={imageUrl}
        source={{ uri: imageUrl }}
        className="absolute inset-0"
        contentFit="contain"
        transition={0}
        cachePolicy="memory-disk"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      />
    </View>
  );
}
