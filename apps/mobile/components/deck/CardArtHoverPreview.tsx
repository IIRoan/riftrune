import { useId, useRef, useState, type ReactNode } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { DeckCardArt } from '@/components/deck/DeckCardArt';
import { Portal } from '@/components/ui/portal';
import { Text } from '@/components/ui/text';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { cn } from '@/lib/utils';

const PREVIEW_HEIGHT = 340;
const PREVIEW_WIDTH = Math.round(PREVIEW_HEIGHT * (5 / 7));
const EDGE_PAD = 12;
const GAP = 10;

type Anchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface CardArtHoverPreviewProps {
  imageUri: string;
  variantNumber: string;
  label?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Web-only enlarged card art on hover (readable full card).
 * Portaled so parent `overflow-hidden` cards do not clip it.
 * Native: children only.
 */
export function CardArtHoverPreview({
  imageUri,
  variantNumber,
  label,
  children,
  className,
}: CardArtHoverPreviewProps) {
  const portalName = useId();
  const anchorRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  if (Platform.OS !== 'web' || !imageUri) {
    return <>{children}</>;
  }

  const show = (next: Anchor | null) => {
    setAnchor(next);
  };

  const measureAndShow = () => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      show({ x, y, width, height });
    });
  };

  let previewLeft = 0;
  let previewTop = 0;
  if (anchor) {
    const rightSpace = windowWidth - (anchor.x + anchor.width) - EDGE_PAD;
    const leftSpace = anchor.x - EDGE_PAD;
    if (rightSpace >= PREVIEW_WIDTH + GAP) {
      previewLeft = anchor.x + anchor.width + GAP;
    } else if (leftSpace >= PREVIEW_WIDTH + GAP) {
      previewLeft = anchor.x - PREVIEW_WIDTH - GAP;
    } else {
      previewLeft = Math.max(
        EDGE_PAD,
        Math.min(anchor.x + anchor.width / 2 - PREVIEW_WIDTH / 2, windowWidth - PREVIEW_WIDTH - EDGE_PAD)
      );
    }

    previewTop = Math.max(
      EDGE_PAD,
      Math.min(anchor.y + anchor.height / 2 - PREVIEW_HEIGHT / 2, windowHeight - PREVIEW_HEIGHT - EDGE_PAD)
    );
  }

  return (
    <View
      ref={anchorRef}
      className={cn('relative', className)}
      {...({
        onMouseEnter: measureAndShow,
        onMouseLeave: () => {
          show(null);
        },
      } as object)}
    >
      {children}
      {anchor ? (
        <Portal name={`card-art-hover-${portalName}`}>
          <View
            pointerEvents="none"
            style={{
              position: 'fixed',
              left: previewLeft,
              top: previewTop,
              width: PREVIEW_WIDTH,
              zIndex: 50,
            }}
          >
            <View
              className={cn(
                'overflow-hidden border border-border bg-background shadow-lg',
                CARD_ART_RADIUS_CLASS
              )}
              style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }}
            >
              <DeckCardArt uri={imageUri} variantNumber={variantNumber} />
            </View>
            {label ? (
              <View className="mt-1.5 rounded-md border border-border bg-popover px-2 py-1">
                <Text
                  className="text-center text-[12px] font-medium text-popover-foreground"
                  numberOfLines={2}
                >
                  {label}
                </Text>
              </View>
            ) : null}
          </View>
        </Portal>
      ) : null}
    </View>
  );
}
