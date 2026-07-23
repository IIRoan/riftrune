import { Stack, useLocalSearchParams } from 'expo-router';
import { Platform, useWindowDimensions, View } from 'react-native';
import {
  CardModal,
  CardModalError,
  CardModalLoading,
  CardModalOverlay,
  getModalShellWidth,
} from '@/components/cards/CardModal';
import { CardDetailPage } from '@/components/cards/CardDetailPage';
import { CardDetailDrawer } from '@/components/catalog/CardDetailDrawer';
import { CatalogDetailPanel } from '@/components/catalog/CatalogDetailPanel';
import { RemoveCollectionSheet } from '@/components/collection/RemoveCollectionSheet';
import { AppLoader, AppLoadingScreen } from '@/components/ui/app-loader';
import { VariantPickerSheet } from '@/components/ui/VariantPickerSheet';
import { useCardDetail } from '@/hooks/useCardDetail';
import { useCardPresentation } from '@/hooks/useCardPresentation';
import { useMobileLayout } from '@/hooks/useBreakpoint';
import { useWishlistPrices } from '@/hooks/useWishlistPrices';
import { parseCardOpenSource } from '@/utils/cardNavigation';

function PageLoading() {
  return <AppLoadingScreen size="lg" />;
}

function DrawerLoading() {
  return (
    <View className="items-center justify-center py-16">
      <AppLoader size="lg" />
    </View>
  );
}

export default function CardDetailScreen() {
  const params = useLocalSearchParams<{
    variantNumber: string | string[];
    source?: string | string[];
  }>();
  const present = useCardPresentation();
  const isMobile = useMobileLayout();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const raw = params.variantNumber;
  const variantNumber = Array.isArray(raw) ? raw[0] : (raw || '');
  const source = parseCardOpenSource(params.source);
  const isModal = present === 'modal';
  const useDrawer = isModal && isMobile;
  const hideCollectionActions = source === 'deck-view';
  const hidePriceHistory = source === 'deck-view';

  const detail = useCardDetail(variantNumber);
  const wishlistPrices = useWishlistPrices(source === 'wishlist');
  const wishlistItem = wishlistPrices.data?.find(
    (item) => item.variantNumber === detail.activeVariant?.variantNumber
  );

  const modalShell = (
    <>
      {detail.isLoading ? <CardModalLoading onClose={detail.handleClose} /> : null}

      {!detail.isLoading && (detail.isError || !detail.card || !detail.activeVariant) ? (
        <CardModalError onClose={detail.handleClose} />
      ) : null}

      {!detail.isLoading && detail.card && detail.activeVariant ? (
        <CardModalOverlay onClose={detail.handleClose}>
          <CardModal
            card={detail.card}
            activeVariant={detail.activeVariant}
            shellWidth={getModalShellWidth(windowWidth)}
            source={source}
            wishlistItem={wishlistItem}
            collectionEntry={detail.collectionEntry}
            printingPreviews={detail.printingPreviews}
            onClose={detail.handleClose}
            onAddToCollection={() => {
              void detail.onAddPress();
            }}
            onQuantityChange={(d) => {
              void detail.onQuantityChange(d);
            }}
            onRemoveFromCollection={detail.onRemovePress}
            onSelectPrinting={detail.onSelectPrinting}
          />
        </CardModalOverlay>
      ) : null}
    </>
  );

  const drawerContent = (() => {
    if (detail.isLoading) return <DrawerLoading />;
    if (detail.isError || !detail.activeVariant) {
      return (
        <View className="items-center gap-3 py-12">
          <AppLoader size="sm" />
        </View>
      );
    }

    return (
      <CatalogDetailPanel
        variantNumber={detail.activeVariant.variantNumber}
        embedded="drawer"
        hideCollectionActions={hideCollectionActions}
        hidePriceHistory={hidePriceHistory}
        wishlistItem={wishlistItem ?? null}
      />
    );
  })();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: isModal ? 'transparentModal' : 'card',
          animation: isModal ? (useDrawer ? 'none' : 'fade') : 'default',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />

      {useDrawer ? (
        <View
          className={Platform.OS === 'web' ? 'fixed inset-0' : 'flex-1'}
          style={
            Platform.OS === 'web'
              ? undefined
              : { width: windowWidth, height: windowHeight }
          }
          pointerEvents="box-none"
        >
          <CardDetailDrawer open onClose={detail.handleClose}>
            {drawerContent}
          </CardDetailDrawer>
        </View>
      ) : isModal ? (
        <View
          className={Platform.OS === 'web' ? 'fixed inset-0' : 'flex-1'}
          style={
            Platform.OS === 'web'
              ? undefined
              : { width: windowWidth, height: windowHeight }
          }
          pointerEvents="box-none"
        >
          {modalShell}
        </View>
      ) : detail.isLoading ? (
        <PageLoading />
      ) : !detail.isLoading && detail.card && detail.activeVariant ? (
        <CardDetailPage
          card={detail.card}
          activeVariant={detail.activeVariant}
          collectionEntry={detail.collectionEntry}
          printingPreviews={detail.printingPreviews}
          onClose={detail.handleClose}
          onAddToCollection={() => {
            void detail.onAddPress();
          }}
          onQuantityChange={(d) => {
            void detail.onQuantityChange(d);
          }}
          onRemoveFromCollection={detail.onRemovePress}
          onSelectPrinting={detail.onSelectPrinting}
        />
      ) : null}

      <VariantPickerSheet
        visible={detail.pickerVisible}
        title="Which printing?"
        options={detail.pickerOptions}
        onClose={() => {
          detail.setPickerVisible(false);
        }}
        onSelect={(id) => {
          void detail.onAddToCollection(id);
        }}
      />

      <RemoveCollectionSheet
        visible={detail.removeSheet != null}
        cardName={detail.removeSheet?.cardName ?? detail.card?.name ?? ''}
        items={detail.removeSheet?.items ?? []}
        onClose={detail.closeRemoveSheet}
        onRemovePrinting={detail.onRemoveSheetPrinting}
        onRemoveAll={detail.onRemoveSheetAll}
      />
    </>
  );
}
