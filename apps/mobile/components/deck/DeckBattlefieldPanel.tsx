import { useRouter } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';
import { BattlefieldCardArt } from '@/components/deck/BattlefieldCardArt';
import { CardArtHoverPreview } from '@/components/deck/CardArtHoverPreview';
import { resolveSlotImage } from '@/components/deck/DeckCardSlot';
import { DeckQtyControl } from '@/components/deck/DeckQtyControl';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { CARD_ART_RADIUS_CLASS } from '@/constants/CardArt';
import { buildBattlefieldSlots } from '@/lib/deck-builder';
import { BATTLEFIELD_MAX, battlefieldsAtCapacity } from '@/lib/deck-limits';
import { isCardTournamentIllegal } from '@/lib/card-legality';
import type { DeckEntry, DeckState } from '@/lib/deck-types';
import { openCard } from '@/utils/cardNavigation';
import { hapticPress } from '@/utils/haptics';
import { cn } from '@/lib/utils';

interface DeckBattlefieldPanelProps {
  deck: DeckState;
  readOnly?: boolean;
  imageByVariant: ReadonlyMap<string, string>;
  onAdd: () => void;
  onRemove: (name: string) => void;
}

function BattlefieldSlot({
  index,
  slot,
  deck,
  readOnly,
  canAdd,
  imageByVariant,
  onAdd,
  onRemove,
}: {
  index: number;
  slot: DeckEntry | null;
  deck: DeckState;
  readOnly?: boolean;
  canAdd: boolean;
  imageByVariant: ReadonlyMap<string, string>;
  onAdd: () => void;
  onRemove: (name: string) => void;
}) {
  const router = useRouter();
  const slotNumber = index + 1;

  if (!slot) {
    const interactive = !readOnly && canAdd;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Battlefield slot ${slotNumber}`}
        accessibilityState={{ disabled: !interactive }}
        className={cn('min-w-0 flex-1', interactive && 'active:opacity-90')}
        disabled={!interactive}
        onPress={() => {
          if (!interactive) return;
          hapticPress();
          onAdd();
        }}
      >
        <View
          className={cn(
            'aspect-[7/5] w-full items-center justify-center border border-dashed bg-card-panel',
            CARD_ART_RADIUS_CLASS,
            interactive ? 'border-border' : 'border-border/60 opacity-60'
          )}
        >
          {interactive ? (
            <ThemedIonicon name="add" size={20} color="primary" />
          ) : (
            <ThemedIonicon name="lock-closed-outline" size={18} color="muted-foreground" />
          )}
        </View>
      </Pressable>
    );
  }

  const { card } = slot;
  const imageUri = resolveSlotImage(card, imageByVariant);
  const illegal = isCardTournamentIllegal(card, deck);
  const showHoverInfo = Platform.OS === 'web' && Boolean(imageUri);

  return (
    <View className="min-w-0 flex-1 gap-1.5">
      <View
        className={cn(
          'relative aspect-[7/5] w-full overflow-hidden border bg-background',
          CARD_ART_RADIUS_CLASS,
          illegal ? 'border-destructive' : 'border-white/10'
        )}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${card.name}`}
          className="absolute inset-0 active:opacity-90"
          onPress={() => {
            hapticPress();
            openCard(router, card.variantNumber, 'modal');
          }}
        >
          <BattlefieldCardArt uri={imageUri} variantNumber={card.variantNumber} />
        </Pressable>

        {showHoverInfo ? (
          <View className="absolute right-1 top-1 z-10">
            <CardArtHoverPreview
              imageUri={imageUri}
              variantNumber={card.variantNumber}
              orientation="landscape"
            >
              <View
                accessibilityLabel={`Preview ${card.name}`}
                className="size-7 items-center justify-center rounded-md border border-white/10 bg-background/92"
              >
                <ThemedIonicon name="information-circle-outline" size={16} color="foreground" />
              </View>
            </CardArtHoverPreview>
          </View>
        ) : null}
      </View>

      <Text className="px-0.5 text-[11px] font-semibold text-foreground" numberOfLines={1}>
        {card.name}
      </Text>

      {readOnly ? null : (
        <DeckQtyControl
          count={1}
          name={card.name}
          single
          onRemove={() => onRemove(card.name)}
        />
      )}
    </View>
  );
}

export function DeckBattlefieldPanel({
  deck,
  readOnly = false,
  imageByVariant,
  onAdd,
  onRemove,
}: DeckBattlefieldPanelProps) {
  const slots = buildBattlefieldSlots(deck.battlefields);
  const count = slots.filter(Boolean).length;
  const atCapacity = battlefieldsAtCapacity(deck);
  const canAdd = !atCapacity;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-baseline gap-2">
          <Text className="text-sm font-semibold text-foreground">Battlefields</Text>
          <Text
            className={cn(
              'font-mono text-[11px] font-bold tabular-nums',
              count === BATTLEFIELD_MAX ? 'text-success' : 'text-muted-foreground'
            )}
          >
            {count}/{BATTLEFIELD_MAX}
          </Text>
        </View>
        {!readOnly && canAdd ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add battlefield"
            className="h-8 shrink-0 flex-row items-center gap-1 rounded-lg border border-border bg-card-panel px-2.5 active:opacity-90"
            onPress={() => {
              hapticPress();
              onAdd();
            }}
          >
            <ThemedIonicon name="add" size={14} color="primary" />
            <Text className="text-[12px] font-semibold text-primary">Add</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        {slots.map((slot, index) => (
          <BattlefieldSlot
            key={slot?.card.name ?? `bf-empty-${index}`}
            index={index}
            slot={slot}
            deck={deck}
            readOnly={readOnly}
            canAdd={canAdd}
            imageByVariant={imageByVariant}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        ))}
      </View>
    </View>
  );
}
