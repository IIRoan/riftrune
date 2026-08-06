import { ActivityIndicator, Pressable, View } from 'react-native';
import { BookmarkIcon, ThemedIcon } from '@/components/icons';
import { VariantPriceSummary } from '@/components/catalog/VariantPriceSummary';
import { CardRulesText } from '@/components/riftbound/CardRulesText';
import { WishlistPriceHistoryPanel } from '@/components/wishlist/WishlistPriceHistoryPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import type { WishlistPriceItem } from '@/hooks/useWishlistPrices';
import type { PriceHistoryPanelItem } from '@/hooks/useVariantPriceHistory';
import { cn } from '@/lib/utils';

interface CatalogDetailScrollBodyProps {
  collectionAndStats: React.ReactNode;
  desktopMetaPills: React.ReactNode | null;
  descriptionBlock: React.ReactNode;
  isWatchingActive: boolean;
  watchBusy: boolean;
  onWatchPress: () => void;
  singleMarketPrice: { label: string; price: string } | null;
  singlePriceTrend: string;
  hidePriceHistory: boolean;
  variantFamilyCount: number;
  wishlistItem: WishlistPriceItem | null;
  activeVariantNumber: string;
  activeCardmarketId: number | null;
  priceHistory: {
    panelItem: PriceHistoryPanelItem | null;
    isLoading: boolean;
  };
  isDrawer: boolean;
}

export function CatalogDetailScrollBody({
  collectionAndStats,
  desktopMetaPills,
  descriptionBlock,
  isWatchingActive,
  watchBusy,
  onWatchPress,
  singleMarketPrice,
  singlePriceTrend,
  hidePriceHistory,
  variantFamilyCount,
  wishlistItem,
  activeVariantNumber,
  activeCardmarketId,
  priceHistory,
  isDrawer,
}: CatalogDetailScrollBodyProps) {
  return (
    <View className="gap-3 p-3">
      {collectionAndStats}
      {desktopMetaPills}
      {descriptionBlock}

      <View className="gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isWatchingActive ? 'Remove from wishlist' : 'Add to wishlist'
          }
          className={cn(
            'h-10 w-full flex-row items-center justify-center gap-1.5 rounded-full web:cursor-pointer',
            isWatchingActive
              ? 'bg-primary/18 active:bg-primary/24'
              : 'bg-primary/12 active:bg-primary/18',
            watchBusy && 'opacity-60'
          )}
          disabled={watchBusy}
          onPress={onWatchPress}
        >
          {watchBusy ? (
            <ActivityIndicator size="small" className="accent-primary" />
          ) : (
            <>
              <ThemedIcon
                icon={BookmarkIcon}
                size={16}
                color="archive-accent-text"
                weight={isWatchingActive ? 'fill' : 'bold'}
              />
              <Text className="text-sm font-semibold text-archive-accent-text">
                {isWatchingActive ? 'Wishlisted · tap to remove' : 'Wishlist card'}
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {singleMarketPrice && hidePriceHistory ? (
        <View className="border-t border-border/40 pt-3">
          <VariantPriceSummary
            label={singleMarketPrice.label}
            price={singleMarketPrice.price}
            trend={singlePriceTrend}
            className="mt-0"
            hideLabel={variantFamilyCount > 1}
          />
        </View>
      ) : null}
      {!hidePriceHistory ? (
        <View className="border-t border-border/40 pt-3" style={{ minHeight: 140 }}>
          {wishlistItem && wishlistItem.variantNumber === activeVariantNumber ? (
            <WishlistPriceHistoryPanel
              item={{
                ...wishlistItem,
                cardmarketId: wishlistItem.cardmarketId ?? activeCardmarketId,
              }}
            />
          ) : priceHistory.panelItem ? (
            <WishlistPriceHistoryPanel
              item={{
                ...priceHistory.panelItem,
                cardmarketId: priceHistory.panelItem.cardmarketId ?? activeCardmarketId,
              }}
            />
          ) : priceHistory.isLoading ? (
            <View className="min-h-[140px] justify-center rounded-xl border border-border bg-card p-3">
              <Text className="text-xs leading-5 text-muted-foreground">
                Loading daily trend history…
              </Text>
            </View>
          ) : (
            <WishlistPriceHistoryPanel
              item={{
                points: [],
                trend: '—',
                baselinePrice: null,
                listingLow: null,
                cardmarketId: activeCardmarketId,
              }}
            />
          )}
        </View>
      ) : null}

      {isDrawer ? <View style={{ height: 72 }} /> : null}
    </View>
  );
}

export function CatalogDetailDescriptionBlock({
  isPlaceholder,
  description,
}: {
  isPlaceholder: boolean;
  description: string | null | undefined;
}) {
  if (isPlaceholder && !description) {
    return (
      <View className="gap-2 rounded-xl bg-card-panel p-3">
        <Skeleton className="h-3 w-full rounded" />
        <Skeleton className="h-3 w-[92%] rounded" />
        <Skeleton className="h-3 w-[80%] rounded" />
      </View>
    );
  }
  if (!description) return null;
  return (
    <View className="rounded-xl bg-card-panel p-3">
      <CardRulesText text={description} />
    </View>
  );
}
