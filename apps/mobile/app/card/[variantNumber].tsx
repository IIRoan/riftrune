import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Platform, useWindowDimensions, View } from 'react-native';
import {
  CardModal,
  CardModalError,
  CardModalLoading,
  CardModalOverlay,
  getModalShellWidth,
} from '@/components/cards/CardModal';
import { CardDetailPage } from '@/components/cards/CardDetailPage';
import { RemoveCollectionSheet } from '@/components/collection/RemoveCollectionSheet';
import { VariantPickerSheet } from '@/components/ui/VariantPickerSheet';
import { useCardDetail } from '@/hooks/useCardDetail';
import { useCardPresentation } from '@/hooks/useCardPresentation';

function PageLoading() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" className="accent-primary" />
    </View>
  );
}

export default function CardDetailScreen() {
  const params = useLocalSearchParams<{ variantNumber: string | string[] }>();
  const present = useCardPresentation();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const raw = params.variantNumber;
  const variantNumber = Array.isArray(raw) ? raw[0] : (raw || '');
  const isModal = present === 'modal';

  const detail = useCardDetail(variantNumber);

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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: isModal ? 'transparentModal' : 'card',
          animation: isModal ? 'fade' : 'default',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />

      {isModal ? (
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
