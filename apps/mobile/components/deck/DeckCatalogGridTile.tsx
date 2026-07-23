import { ThemedIcon, ImageIcon } from '@/components/icons';
import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { BattlefieldCardArt } from '@/components/deck/BattlefieldCardArt';
import { DeckCardArt } from '@/components/deck/DeckCardArt';
import { GridDeckControl } from '@/components/deck/GridDeckControl';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import { Text } from '@/components/ui/text';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { gridCardTitleStyle } from '@/lib/cardTileGridTitle';
import type { DeckCard } from '@/lib/deck-types';
import { deckOwnershipBorderClass } from '@/lib/deck-validation';
import { hapticPress } from '@/utils/haptics';
import { resolveImageUrl } from '@/utils/resolveImageUrl';
import { cn } from '@/lib/utils';

export interface DeckCatalogGridTileProps {
  tileWidth: number;
  candidate: DeckCard;
  count: number;
  owned?: number | null;
  blocked?: boolean;
  blockedLabel?: string;
  illegal?: boolean;
  readOnly?: boolean;
  selected?: boolean;
  horizontal?: boolean;
  canAdd?: boolean;
  canRemove?: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onOpenCard: () => void;
}

export const DeckCatalogGridTile = memo(function DeckCatalogGridTile({
  tileWidth,
  candidate,
  count,
  owned = null,
  blocked = false,
  blockedLabel = 'Unavailable',
  illegal = false,
  readOnly = false,
  selected = false,
  horizontal = false,
  canAdd: canAddProp,
  canRemove: canRemoveProp,
  onAdd,
  onRemove,
  onOpenCard,
}: DeckCatalogGridTileProps) {
  const canAdd = canAddProp ?? (!readOnly && !blocked);
  const canRemove = canRemoveProp ?? (!readOnly && count > 0);
  const ownershipBorder = deckOwnershipBorderClass(owned, count);
  const imageUri = candidate.imageUrl ? resolveImageUrl(candidate.imageUrl) : '';
  const inDeck = selected || count > 0;
  const shortfall = owned != null && count > 0 && owned < count;

  const handleOpenCard = () => {
    void hapticPress();
    onOpenCard();
  };

  return (
    <View
      className={cn(
        'overflow-hidden rounded-lg border bg-card',
        illegal
          ? 'border-destructive/70'
          : inDeck
            ? 'border-primary/60'
            : blocked
              ? 'border-border/70'
              : 'border-border'
      )}
      style={{ width: tileWidth }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${candidate.name}`}
        className="active:opacity-90"
        onPress={handleOpenCard}
      >
        <View
          className={cn(
            'relative w-full overflow-hidden',
            horizontal ? 'aspect-[7/5]' : 'aspect-[5/7]',
            CARD_ART_RADIUS_CLASS,
            ownershipBorder ? `border-2 ${ownershipBorder}` : ''
          )}
        >
          {imageUri ? (
            horizontal ? (
              <BattlefieldCardArt uri={imageUri} variantNumber={candidate.variantNumber} />
            ) : (
              <DeckCardArt uri={imageUri} variantNumber={candidate.variantNumber} />
            )
          ) : (
            <View className="flex-1 items-center justify-center bg-card-panel">
              <ThemedIcon icon={ImageIcon} size={20} color="muted-foreground" />
            </View>
          )}

          {illegal ? (
            <View className="absolute left-1 top-1" pointerEvents="none">
              <StatusKeywordBadge status="illegal" compact />
            </View>
          ) : null}
        </View>

        <Text
          className={cn(
            'mt-1 px-1 font-semibold',
            illegal ? 'text-destructive' : 'text-foreground'
          )}
          ellipsizeMode="tail"
          numberOfLines={2}
          style={gridCardTitleStyle()}
        >
          {candidate.name}
        </Text>

        <View className="min-w-0 flex-row items-center justify-between gap-1 px-1 pb-0.5">
          <Text
            className="min-w-0 shrink font-mono text-[10px] text-muted-foreground"
            numberOfLines={1}
          >
            {candidate.variantNumber}
          </Text>
          {owned != null && count > 0 ? (
            <Text
              className={cn(
                'shrink-0 font-mono text-[10px] tabular-nums',
                shortfall ? 'text-warning' : 'text-success'
              )}
              numberOfLines={1}
            >
              Own {Math.min(owned, count)}/{count}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <View className="px-1 pb-1 pt-0">
        <GridDeckControl
          count={count}
          name={candidate.name}
          canAdd={canAdd}
          canRemove={canRemove}
          blocked={blocked}
          blockedLabel={blockedLabel}
          readOnly={readOnly}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      </View>
    </View>
  );
});
