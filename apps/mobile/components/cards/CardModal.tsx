import { BookmarkIcon, CircleAlertIcon, XIcon } from '@/components/icons';
import {
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CardDetail, VariantDetail } from '@riftbound/contracts';
import { isCardBannedAt } from '@riftbound/contracts';
import { VariantPriceSummary } from '@/components/catalog/VariantPriceSummary';
import { PrintingPreviewStrip } from '@/components/cards/PrintingPreviewStrip';
import { CollectionAddButton, CollectionQtyControls } from '@/components/collection/CollectionQtyControls';
import { AppLoader } from '@/components/ui/app-loader';
import { CardRulesText } from '@/components/riftbound/CardRulesText';
import { StatusKeywordBadge } from '@/components/riftbound/RiftboundBadges';
import {
  DomainIcon,
  EnergyPip,
  MightIcon,
  RarityIcon,
  TypeIcon,
} from '@/components/riftbound/CardIcons';
import { CardPreview } from '@/components/riftbound/CardPreview';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Heading } from '@/components/ui/heading';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Stack } from '@/components/ui/stack';
import { Text } from '@/components/ui/text';
import { formatStat } from '@/utils/cardFormat';
import {
  formatMarketTrend,
  getVariantMarketPriceDisplays,
  isFoilVariant,
  pickVariantDisplayPrice,
  toPriceEurSummary,
} from '@/utils/variants';
import type { WishlistPriceItem } from '@/hooks/useWishlistPrices';
import { useVariantPriceHistory } from '@/hooks/useVariantPriceHistory';
import { WishlistPriceHistoryPanel } from '@/components/wishlist/WishlistPriceHistoryPanel';
import { cn } from '@/lib/utils';
import type { CardOpenSource } from '@/utils/cardNavigation';

const SHELL_MAX_WIDTH = 860;
const CARD_WIDTH_DESKTOP = 300;
const CARD_IMAGE_PAD = 20;
const CARD_ASPECT = 3.5 / 2.5;
const MODAL_BREAKPOINT = 640;
const OVERLAY_PAD_X_WIDE = 80;
const OVERLAY_PAD_Y_WIDE = 64;
const OVERLAY_PAD_X_NARROW = 32;
const OVERLAY_PAD_Y_NARROW = 48;

interface Props {
  card: CardDetail;
  activeVariant: VariantDetail;
  shellWidth: number;
  source?: CardOpenSource;
  wishlistItem?: WishlistPriceItem;
  collectionEntry: { quantity: number; isFoil: boolean } | null | undefined;
  printingPreviews: {
    id: string;
    variantNumber: string;
    variantLabel: string;
    variantType?: string;
    imageUrl: string;
    price?: string | null;
  }[];
  onClose: () => void;
  onAddToCollection: () => void;
  onQuantityChange: (delta: number) => void;
  onRemoveFromCollection: () => void;
  onSelectPrinting: (variantNumber: string) => void;
}

function ModalIconButton({
  onPress,
  accessibilityLabel,
  className,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      className={cn('size-8 shrink-0 rounded-full p-0 active:bg-secondary', className)}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      <ButtonIcon className="size-4 text-muted-foreground">{children}</ButtonIcon>
    </Button>
  );
}

function ModalInlineStat({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Stack direction="row" className="items-center gap-1.5">
      <Text className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

function ModalHeader({
  setCode,
  variantNumber,
  cardName,
  isBanned,
  isWide,
  source,
  wishlistItem,
  collectionEntry,
  onAddToCollection,
  onQuantityChange,
  onRemoveFromCollection,
  onClose,
}: {
  setCode: string;
  variantNumber: string;
  cardName: string;
  isBanned: boolean;
  isWide: boolean;
  source?: CardOpenSource;
  wishlistItem?: WishlistPriceItem;
  collectionEntry: Props['collectionEntry'];
  onAddToCollection: () => void;
  onQuantityChange: (delta: number) => void;
  onRemoveFromCollection: () => void;
  onClose: () => void;
}) {
  const wishlistContext = source === 'wishlist';
  const deckViewContext = source === 'deck-view';
  const showCollectionActions = !wishlistContext && !deckViewContext;

  return (
    <View className="flex-row items-start justify-between gap-4">
      <Stack gap="xs" className="min-w-0 flex-1">
        <Text className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground">
          <Text className="uppercase">{setCode}</Text>
          <Text> · {variantNumber}</Text>
        </Text>
        <Heading
          level={isWide ? '3' : '4'}
          className="font-black leading-[1.1] tracking-tight"
          numberOfLines={2}
        >
          {cardName}
        </Heading>
        {isBanned ? (
          <View className="self-start">
            <StatusKeywordBadge status="illegal" />
          </View>
        ) : null}
      </Stack>

      <View
        className={cn(
          'shrink-0 flex-row items-center justify-end gap-1.5 pt-0.5',
          showCollectionActions || wishlistContext ? 'min-w-[140px]' : undefined
        )}
      >
        {wishlistContext ? (
          <View className="flex-row items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1.5">
            <BookmarkIcon className="size-[14px] text-primary" />
            <Text className="text-xs font-semibold text-primary">
              {wishlistItem ? 'Wishlisted' : 'Wishlist'}
            </Text>
          </View>
        ) : showCollectionActions ? (
          collectionEntry ? (
            <CollectionQtyControls
              compact
              quantity={collectionEntry.quantity}
              isFoil={collectionEntry.isFoil}
              onIncrement={() => {
                onQuantityChange(1);
              }}
              onDecrement={() => {
                onQuantityChange(-1);
              }}
              onRemove={onRemoveFromCollection}
            />
          ) : (
            <CollectionAddButton onPress={onAddToCollection} />
          )
        ) : null}
        <ModalIconButton onPress={onClose} accessibilityLabel="Close">
          <XIcon className="size-[16px] text-foreground" />
        </ModalIconButton>
      </View>
    </View>
  );
}

function ModalInfoPanel({
  card,
  activeVariant,
  printingPreviews,
  source,
  wishlistItem,
  collectionEntry,
  isWide,
  onAddToCollection,
  onQuantityChange,
  onRemoveFromCollection,
  onClose,
  onSelectPrinting,
}: Props & { isWide: boolean }) {
  const setCode = activeVariant.variantNumber.split('-')[0] ?? '';
  const activePrice = pickVariantDisplayPrice(activeVariant.prices, activeVariant);
  const wishlistContext = source === 'wishlist';
  const marketPrices = getVariantMarketPriceDisplays(activeVariant);
  const singleMarketPrice =
    !wishlistContext && printingPreviews.length <= 1 && marketPrices.length === 1
      ? marketPrices[0]
      : null;
  const singlePriceTrend = formatMarketTrend(toPriceEurSummary(activePrice));

  const panelPadding = isWide ? 'px-8 py-7' : 'px-5 py-5';
  const isBanned = isCardBannedAt(card.banEffectiveDate);

  const showPriceHistory = source !== 'deck-view';
  const priceHistory = useVariantPriceHistory(activeVariant.variantNumber, {
    isFoil: isFoilVariant(
      activeVariant.variantNumber,
      activeVariant.variantLabel,
      activeVariant.variantType
    ),
    enabled: showPriceHistory,
  });
  const historyItem =
    (wishlistItem && wishlistItem.variantNumber === activeVariant.variantNumber
      ? wishlistItem
      : null) ?? priceHistory.panelItem;

  const headerBlock = (
    <>
      <ModalHeader
        setCode={setCode}
        variantNumber={activeVariant.variantNumber}
        cardName={card.name}
        isBanned={isBanned}
        isWide={isWide}
        source={source}
        wishlistItem={wishlistItem}
        collectionEntry={collectionEntry}
        onAddToCollection={onAddToCollection}
        onQuantityChange={onQuantityChange}
        onRemoveFromCollection={onRemoveFromCollection}
        onClose={onClose}
      />

      {isBanned ? (
        <Text className="text-sm text-destructive">
          This card is banned in tournament play.
        </Text>
      ) : null}

      {singleMarketPrice ? (
        <VariantPriceSummary
          label={singleMarketPrice.label}
          price={singleMarketPrice.price}
          trend={singlePriceTrend}
          className="mt-0"
        />
      ) : null}

      <Stack gap="md">
        <Stack direction="row" className="flex-wrap items-center gap-x-4 gap-y-2">
          <ModalInlineStat label="Cost">
            <EnergyPip value={card.energy} size={isWide ? 22 : 20} />
          </ModalInlineStat>
          <ModalInlineStat label="Might">
            <Stack direction="row" className="items-center gap-1">
              <MightIcon size={isWide ? 14 : 13} />
              <Text className="text-sm font-bold text-foreground">{formatStat(card.might)}</Text>
            </Stack>
          </ModalInlineStat>
          <ModalInlineStat label="Power">
            <Text className="text-sm font-bold text-foreground">{formatStat(card.power)}</Text>
          </ModalInlineStat>
        </Stack>

        <Stack direction="row" className="flex-wrap items-center gap-x-1.5 gap-y-1">
          <TypeIcon type={card.type} size={14} />
          <Text className="text-[12px] font-medium text-muted-foreground">{card.type}</Text>
          {card.colors[0] ? (
            <>
              <Text className="text-[12px] text-muted-foreground">·</Text>
              <DomainIcon
                name={card.colors[0].name}
                imageUrl={card.colors[0].imageUrl}
                size={14}
              />
              <Text className="text-[12px] font-medium text-muted-foreground">
                {card.colors[0].name}
              </Text>
            </>
          ) : null}
          <Text className="text-[12px] text-muted-foreground">·</Text>
          <RarityIcon rarity={activeVariant.rarity} size={14} />
          <Text className="text-[12px] font-medium text-muted-foreground">
            {activeVariant.rarity}
          </Text>
        </Stack>
      </Stack>
    </>
  );

  const abilityBlock = card.description ? (
    <View
      className={cn(
        'min-w-0 rounded-xl border border-border bg-secondary',
        isWide ? 'px-4 py-3.5' : 'px-3.5 py-3'
      )}
    >
      <SectionLabel className="mb-2">Ability</SectionLabel>
      <CardRulesText text={card.description} compact={!isWide} />
    </View>
  ) : null;

  const priceHistoryBlock = showPriceHistory ? (
    <Stack gap="sm">
      <SectionLabel>{wishlistContext ? 'Wishlist tracking' : 'Daily trend'}</SectionLabel>
      {historyItem ? (
        <WishlistPriceHistoryPanel item={historyItem} />
      ) : priceHistory.isLoading ? (
        <View className="rounded-xl border border-border bg-card p-3">
          <Text className="text-xs leading-5 text-muted-foreground">
            Loading daily trend history…
          </Text>
        </View>
      ) : (
        <View className="rounded-xl border border-border bg-card p-3">
          <Text className="text-xs leading-5 text-muted-foreground">
            No daily trend snapshots yet. Prices sync once per day from Cardmarket.
          </Text>
        </View>
      )}
    </Stack>
  ) : null;

  return (
    <View
      className={cn(
        'min-h-0 min-w-0 flex-1 flex-col bg-background',
        isWide && 'border-l border-border/40'
      )}
    >
      <ScrollView
        className="min-h-0 flex-1"
        contentContainerClassName={cn('gap-4', panelPadding)}
        showsVerticalScrollIndicator
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        {headerBlock}
        {priceHistoryBlock}
        {abilityBlock}
        <PrintingPreviewStrip
          items={printingPreviews}
          selectedId={activeVariant.variantNumber}
          compact
          dense
          onSelect={onSelectPrinting}
        />
      </ScrollView>
    </View>
  );
}

function getShellHeight(windowWidth: number, windowHeight: number, isWide: boolean): number {
  const maxHeight = windowHeight - (isWide ? OVERLAY_PAD_Y_WIDE : OVERLAY_PAD_Y_NARROW);
  if (isWide) {
    const cardHeight = Math.round(CARD_WIDTH_DESKTOP * CARD_ASPECT) + CARD_IMAGE_PAD * 2;
    return Math.min(Math.max(cardHeight, 480), maxHeight);
  }
  const shellWidth = getModalShellWidth(windowWidth);
  const cardHeight = Math.round(shellWidth * CARD_ASPECT) + CARD_IMAGE_PAD * 2;
  const infoEstimate = 360;
  return Math.min(cardHeight + infoEstimate, maxHeight);
}

const NARROW_MIN_INFO_HEIGHT = 260;

function getNarrowCardMetrics(shellWidth: number, shellHeight: number) {
  const maxCardBlockHeight = shellHeight - NARROW_MIN_INFO_HEIGHT;
  let cardInnerWidth = shellWidth - CARD_IMAGE_PAD * 2;
  let cardInnerHeight = Math.round(cardInnerWidth * CARD_ASPECT);
  let cardBlockHeight = cardInnerHeight + CARD_IMAGE_PAD * 2;

  if (cardBlockHeight > maxCardBlockHeight) {
    cardBlockHeight = Math.max(maxCardBlockHeight, CARD_IMAGE_PAD * 2 + 80);
    cardInnerHeight = cardBlockHeight - CARD_IMAGE_PAD * 2;
    cardInnerWidth = Math.round(cardInnerHeight / CARD_ASPECT);
  }

  return { cardInnerWidth, cardInnerHeight, cardBlockHeight };
}

function getCardColumnWidth(isWide: boolean, shellWidth: number): number {
  if (isWide) return CARD_WIDTH_DESKTOP + CARD_IMAGE_PAD * 2;
  return shellWidth;
}

export function CardModal(props: Props) {
  const { activeVariant, shellWidth } = props;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWide = windowWidth >= MODAL_BREAKPOINT;
  const shellHeight = getShellHeight(windowWidth, windowHeight, isWide);
  const cardColumnWidth = getCardColumnWidth(isWide, shellWidth);
  const narrowCard = getNarrowCardMetrics(shellWidth, shellHeight);
  const cardInnerWidth = isWide ? CARD_WIDTH_DESKTOP : narrowCard.cardInnerWidth;
  const cardInnerHeight = isWide
    ? shellHeight - CARD_IMAGE_PAD * 2
    : narrowCard.cardInnerHeight;
  const narrowCardBlockHeight = narrowCard.cardBlockHeight;

  return (
    <View
      className={cn(
        'min-h-0 w-full overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl',
        isWide ? 'flex-row' : 'flex-col'
      )}
      style={{
        width: shellWidth,
        maxWidth: '100%',
        height: shellHeight,
        maxHeight: shellHeight,
      }}
    >
      <View
        className="shrink-0 bg-card-panel p-5"
        style={
          isWide
            ? { width: cardColumnWidth, height: shellHeight }
            : { width: cardColumnWidth, height: narrowCardBlockHeight }
        }
      >
        <View className="flex-1 overflow-hidden rounded-lg">
          <CardPreview
            key={activeVariant.variantNumber}
            imageUrl={activeVariant.imageUrl}
            width={cardInnerWidth}
            minHeight={isWide ? cardInnerHeight : cardInnerHeight}
          />
        </View>
      </View>

      <ModalInfoPanel {...props} isWide={isWide} />
    </View>
  );
}

export function CardModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = windowWidth >= MODAL_BREAKPOINT;
  const shellWidth = getModalShellWidth(windowWidth);
  const padX = isWide ? OVERLAY_PAD_X_WIDE / 2 : OVERLAY_PAD_X_NARROW / 2;
  const padY = isWide ? OVERLAY_PAD_Y_WIDE / 2 : OVERLAY_PAD_Y_NARROW / 2;
  const contentMaxHeight = windowHeight - insets.top - insets.bottom - padY * 2;

  return (
    <View
      className={cn(
        'z-[100] items-center justify-center',
        Platform.OS === 'web' ? 'fixed inset-0' : 'absolute inset-0'
      )}
      style={{
        ...(Platform.OS === 'web' ? {} : { width: windowWidth, height: windowHeight }),
        paddingTop: insets.top + padY,
        paddingBottom: insets.bottom + padY,
        paddingHorizontal: padX,
      }}
    >
      <Pressable
        className="absolute inset-0 bg-black/85"
        onPress={onClose}
        accessibilityLabel="Close dialog"
      />
      <View
        className="z-10 w-full"
        style={{ maxWidth: shellWidth, maxHeight: contentMaxHeight }}
        pointerEvents="box-none"
      >
        <View className="w-full" pointerEvents="auto">
          {children}
        </View>
      </View>
    </View>
  );
}

export function CardModalLoading({ onClose }: { onClose: () => void }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isWide = windowWidth >= MODAL_BREAKPOINT;
  const shellWidth = getModalShellWidth(windowWidth);
  const shellHeight = getShellHeight(windowWidth, windowHeight, isWide);

  return (
    <CardModalOverlay onClose={onClose}>
      <View
        className="w-full items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-background"
        style={{ width: shellWidth, maxWidth: '100%', height: shellHeight }}
      >
        <AppLoader size="lg" />
      </View>
    </CardModalOverlay>
  );
}

export function CardModalError({ onClose }: { onClose: () => void }) {
  const { width: windowWidth } = useWindowDimensions();
  const shellWidth = getModalShellWidth(windowWidth);

  return (
    <CardModalOverlay onClose={onClose}>
      <View
        className="w-full items-center justify-center rounded-2xl border border-border/50 bg-background p-6"
        style={{ width: shellWidth, maxWidth: '100%', height: 200 }}
      >
        <Empty className="border-0 p-0">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleAlertIcon className="size-[40px] text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Card not found</EmptyTitle>
            <EmptyDescription>This card could not be loaded.</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <Button className="mt-4" onPress={onClose}>
          <ButtonText>Go back</ButtonText>
        </Button>
      </View>
    </CardModalOverlay>
  );
}

export function getModalShellWidth(windowWidth: number): number {
  if (windowWidth < MODAL_BREAKPOINT) {
    return Math.min(windowWidth - OVERLAY_PAD_X_NARROW, 420);
  }
  return Math.min(SHELL_MAX_WIDTH, windowWidth - OVERLAY_PAD_X_WIDE);
}
