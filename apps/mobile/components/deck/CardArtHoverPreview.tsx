import { useId, useRef, useState, type ReactNode } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { BattlefieldCardArt } from '@/components/deck/BattlefieldCardArt';
import { DeckCardArt } from '@/components/deck/DeckCardArt';
import { Portal } from '@/components/ui/portal';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { cn } from '@/lib/utils';

const PORTRAIT_PREVIEW_HEIGHT = 460;
const PORTRAIT_PREVIEW_WIDTH = Math.round(PORTRAIT_PREVIEW_HEIGHT * (5 / 7));
const LANDSCAPE_PREVIEW_WIDTH = 560;
const LANDSCAPE_PREVIEW_HEIGHT = Math.round(LANDSCAPE_PREVIEW_WIDTH * (5 / 7));
const EDGE_PAD = 12;
const GAP = 10;

type Anchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CardArtHoverOrientation = 'portrait' | 'landscape';

interface CardArtHoverPreviewProps {
  imageUri: string;
  variantNumber: string;
  /** Battlefield cards render landscape (rotated art). */
  orientation?: CardArtHoverOrientation;
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
  orientation = 'portrait',
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

  const baseWidth =
    orientation === 'landscape' ? LANDSCAPE_PREVIEW_WIDTH : PORTRAIT_PREVIEW_WIDTH;
  const baseHeight =
    orientation === 'landscape' ? LANDSCAPE_PREVIEW_HEIGHT : PORTRAIT_PREVIEW_HEIGHT;
  const maxWidth = Math.max(160, windowWidth - EDGE_PAD * 2);
  const maxHeight = Math.max(200, windowHeight - EDGE_PAD * 2);
  const fitScale = Math.min(1, maxWidth / baseWidth, maxHeight / baseHeight);
  const previewWidth = Math.round(baseWidth * fitScale);
  const previewHeight = Math.round(baseHeight * fitScale);

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
    if (rightSpace >= previewWidth + GAP) {
      previewLeft = anchor.x + anchor.width + GAP;
    } else if (leftSpace >= previewWidth + GAP) {
      previewLeft = anchor.x - previewWidth - GAP;
    } else {
      previewLeft = Math.max(
        EDGE_PAD,
        Math.min(anchor.x + anchor.width / 2 - previewWidth / 2, windowWidth - previewWidth - EDGE_PAD)
      );
    }

    previewTop = Math.max(
      EDGE_PAD,
      Math.min(anchor.y + anchor.height / 2 - previewHeight / 2, windowHeight - previewHeight - EDGE_PAD)
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
              width: previewWidth,
              zIndex: 50,
            }}
          >
            <View
              className={cn(
                'overflow-hidden border border-border bg-background shadow-lg',
                CARD_ART_RADIUS_CLASS
              )}
              style={{ width: previewWidth, height: previewHeight }}
            >
              {orientation === 'landscape' ? (
                <BattlefieldCardArt uri={imageUri} variantNumber={variantNumber} />
              ) : (
                <DeckCardArt uri={imageUri} variantNumber={variantNumber} />
              )}
            </View>
          </View>
        </Portal>
      ) : null}
    </View>
  );
}
