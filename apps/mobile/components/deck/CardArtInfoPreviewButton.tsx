import { InfoIcon, ThemedIcon } from '@/components/icons';
import {
  CardArtHoverPreview,
  type CardArtHoverOrientation,
} from '@/components/deck/CardArtHoverPreview';
import { Platform, Pressable, View } from 'react-native';

interface CardArtInfoPreviewButtonProps {
  imageUri: string;
  variantNumber: string;
  name: string;
  orientation?: CardArtHoverOrientation;
}

/** Web-only hover preview trigger shown on deck builder card art. */
export function CardArtInfoPreviewButton({
  imageUri,
  variantNumber,
  name,
  orientation = 'portrait',
}: CardArtInfoPreviewButtonProps) {
  if (Platform.OS !== 'web' || !imageUri) return null;

  return (
    <View className="absolute right-1 top-1 z-10">
      <CardArtHoverPreview
        imageUri={imageUri}
        variantNumber={variantNumber}
        orientation={orientation}
      >
        <Pressable
          accessibilityLabel={`Preview ${name}`}
          className="size-7 items-center justify-center rounded-md border border-white/10 bg-background/92"
          onPress={(event) => {
            event.stopPropagation?.();
          }}
        >
          <ThemedIcon icon={InfoIcon} size={16} color="foreground" />
        </Pressable>
      </CardArtHoverPreview>
    </View>
  );
}
