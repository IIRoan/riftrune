import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { FlatList, View } from 'react-native';
import { AppLoader } from '@/components/ui/app-loader';
import { DeckBrowseCard } from '@/components/deck/DeckBrowseCard';
import { DeckImportExportSheet } from '@/components/deck/DeckImportExportSheet';
import { DeckImportLoadingOverlay } from '@/components/deck/DeckImportLoadingOverlay';
import { DeckListCard } from '@/components/deck/DeckListCard';
import { DECKS_SUB_NAV_CLEARANCE, DecksSubNav } from '@/components/deck/DecksSubNav';
import { ScreenLayout, ScreenLayoutBody } from '@/components/shell/ScreenLayout';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { SearchInput } from '@/components/ui/search-input';
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { CalendarPlusIcon } from '@/components/icons';
import { useDeckMutations } from '@/hooks/useDecks';
import { createEmptyDeck } from '@/lib/deck-card';
import type { DeckState } from '@/lib/deck-types';
import { cn } from '@/lib/utils';
import { hapticPress } from '@/utils/haptics';

type DeckListQuery = {
  data?: DeckState[];
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  refetch: () => void;
};

type DeckInfiniteScroll = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
};

interface DecksListScreenProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  query: string;
  onQueryChange: (value: string) => void;
  decksQuery: DeckListQuery;
  emptyTitle: string;
  emptyDescription: string;
  showCreate?: boolean;
  showImport?: boolean;
  showSubNav?: boolean;
  browseToolbar?: ReactNode;
  infiniteScroll?: DeckInfiniteScroll;
  variant?: 'default' | 'browse';
}

function DeckListSkeleton() {
  return (
    <SkeletonGroup>
      <View className="gap-3">
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            className="overflow-hidden rounded-xl border border-border bg-card p-3.5"
          >
            <View className="gap-3">
              <View className="flex-row gap-3">
                <Skeleton className="h-[100px] w-[72px] rounded-lg" />
                <View className="min-w-0 flex-1 gap-2">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                  <Skeleton className="h-3 w-48 rounded" />
                  <Skeleton className="mt-1 h-3 w-36 rounded" />
                </View>
              </View>
              <View className="flex-row gap-1.5">
                <Skeleton className="h-14 w-10 rounded-md" />
                <Skeleton className="h-14 w-10 rounded-md" />
                <Skeleton className="h-14 w-10 rounded-md" />
                <Skeleton className="h-14 w-10 rounded-md" />
              </View>
            </View>
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}

export function DecksListScreen({
  title,
  subtitle,
  searchPlaceholder,
  query,
  onQueryChange,
  decksQuery,
  emptyTitle,
  emptyDescription,
  showCreate = false,
  showImport = false,
  showSubNav = true,
  browseToolbar,
  infiniteScroll,
  variant = 'default',
}: DecksListScreenProps) {
  const router = useRouter();
  const { removeDeck, importDeck, saveDeckNow } = useDeckMutations();
  const { data: decks = [], isLoading, isFetching = false, isError, refetch } = decksQuery;
  const [importOpen, setImportOpen] = useState(false);
  const [importSaving, setImportSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DeckState | null>(null);
  const importPlaceholderDeck = useMemo(() => createEmptyDeck(), []);

  const archiveImportBusy = importDeck.isPending;
  const showBlockingLoader = isLoading && decks.length === 0;
  const showRefreshing = isFetching && decks.length > 0;
  const deckCountLabel =
    decks.length === 0
      ? subtitle
      : decks.length === 1
        ? '1 deck'
        : `${decks.length} decks`;

  const listFooter =
    infiniteScroll?.isFetchingNextPage || showRefreshing ? (
      <View className="items-center py-4">
        <AppLoader size="sm" />
      </View>
    ) : null;

  const renderDeckCard = (deck: DeckState) =>
    variant === 'browse' ? (
      <DeckBrowseCard
        key={deck.id}
        deck={deck}
        onPress={() => router.push(`/decks/${deck.id}`)}
        onImport={() => {
          void importDeck.mutateAsync(deck.id).then((saved) => {
            router.push(`/decks/${saved.id}`);
          });
        }}
        importBusy={importDeck.isPending && importDeck.variables === deck.id}
      />
    ) : (
      <DeckListCard
        key={deck.id}
        deck={deck}
        onPress={() => router.push(`/decks/${deck.id}`)}
        onDelete={
          deck.readOnly
            ? undefined
            : () => {
                setPendingDelete(deck);
              }
        }
        onImport={
          deck.readOnly
            ? () => {
                void importDeck.mutateAsync(deck.id).then((saved) => {
                  router.push(`/decks/${saved.id}`);
                });
              }
            : undefined
        }
        importBusy={importDeck.isPending && importDeck.variables === deck.id}
      />
    );

  return (
    <View className="relative min-h-0 flex-1">
      <ScreenLayout
        mode={infiniteScroll ? 'flex' : 'scroll'}
        contentClassName={infiniteScroll ? 'min-h-0 flex-1' : undefined}
      >
        <DeckImportLoadingOverlay
          visible={importSaving || archiveImportBusy}
          message={
            archiveImportBusy
              ? 'Importing deck to your collection…'
              : 'Saving imported deck…'
          }
        />
        <ScreenLayoutBody className={infiniteScroll ? 'min-h-0 flex-1 flex-col' : undefined}>
          <View className={cn('mb-4 w-full gap-3', infiniteScroll && 'shrink-0')}>
            <View className="w-full flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1 shrink" style={{ minWidth: 0 }}>
                <Text className="text-2xl font-bold tracking-tight text-foreground">{title}</Text>
                <Text className="mt-1 font-mono text-[13px] text-muted-foreground">
                  {query.trim() ? `${deckCountLabel} matching “${query.trim()}”` : deckCountLabel}
                </Text>
              </View>
              {showCreate || showImport ? (
                <View className="shrink-0 flex-row gap-2 self-start">
                  {showImport ? (
                    <Button
                      variant="outline"
                      className="w-auto"
                      onPress={() => {
                        hapticPress();
                        setImportOpen(true);
                      }}
                    >
                      <ButtonText>Import</ButtonText>
                    </Button>
                  ) : null}
                  {showCreate ? (
                    <Button
                      className="w-auto"
                      onPress={() => {
                        hapticPress();
                        router.push('/decks/create');
                      }}
                    >
                      <ButtonIcon>
                        <CalendarPlusIcon className="size-4 text-primary-foreground" />
                      </ButtonIcon>
                      <ButtonText>New</ButtonText>
                    </Button>
                  ) : null}
                </View>
              ) : null}
            </View>

            <SearchInput
              value={query}
              onChangeText={onQueryChange}
              placeholder={searchPlaceholder}
              accessibilityLabel={searchPlaceholder}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />

            {browseToolbar}
          </View>

          {showBlockingLoader ? (
            <>
              <DeckListSkeleton />
              {showSubNav ? <View style={{ height: DECKS_SUB_NAV_CLEARANCE }} /> : null}
            </>
          ) : isError ? (
            <>
              <Empty className="mt-8 border border-dashed border-border">
                <EmptyHeader>
                  <EmptyTitle>Could not load decks</EmptyTitle>
                  <EmptyDescription>
                    The deck list timed out or the server returned an error. Try again in a
                    moment.
                  </EmptyDescription>
                </EmptyHeader>
                <Button onPress={() => void refetch()}>
                  <ButtonText>Retry</ButtonText>
                </Button>
              </Empty>
              {showSubNav ? <View style={{ height: DECKS_SUB_NAV_CLEARANCE }} /> : null}
            </>
          ) : decks.length === 0 ? (
            <>
              <Empty className="mt-8 border border-dashed border-border">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="mb-1 size-16">
                    <ThemedIonicon name="layers-outline" size={32} color="ring" />
                  </EmptyMedia>
                  <EmptyTitle>{query.trim() ? 'No matching decks' : emptyTitle}</EmptyTitle>
                  <EmptyDescription>{emptyDescription}</EmptyDescription>
                </EmptyHeader>
                {showCreate && !query.trim() ? (
                  <View className="gap-2">
                    <Button
                      onPress={() => {
                        hapticPress();
                        router.push('/decks/create');
                      }}
                    >
                      <ButtonText>Create your first deck</ButtonText>
                    </Button>
                    {showImport ? (
                      <Button
                        variant="outline"
                        onPress={() => {
                          hapticPress();
                          setImportOpen(true);
                        }}
                      >
                        <ButtonText>Import deck list</ButtonText>
                      </Button>
                    ) : null}
                  </View>
                ) : null}
              </Empty>
              {showSubNav ? <View style={{ height: DECKS_SUB_NAV_CLEARANCE }} /> : null}
            </>
          ) : infiniteScroll ? (
            <FlatList
              data={decks}
              keyExtractor={(deck) => deck.id}
              renderItem={({ item }) => renderDeckCard(item)}
              ItemSeparatorComponent={() => <View className="h-3" />}
              ListFooterComponent={listFooter}
              onEndReached={() => {
                if (infiniteScroll.hasNextPage && !infiniteScroll.isFetchingNextPage) {
                  infiniteScroll.fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.25}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              className="min-h-0 flex-1"
              contentContainerStyle={{
                paddingBottom: 8 + (showSubNav ? DECKS_SUB_NAV_CLEARANCE : 0),
              }}
            />
          ) : (
            <View className="gap-3">
              {decks.map((deck) => renderDeckCard(deck))}
              {listFooter}
              {showSubNav ? <View style={{ height: DECKS_SUB_NAV_CLEARANCE }} /> : null}
            </View>
          )}
        </ScreenLayoutBody>

        {showImport ? (
          <DeckImportExportSheet
            open={importOpen}
            mode="import"
            deck={importPlaceholderDeck}
            asNewDeck
            onClose={() => setImportOpen(false)}
            onImport={async (imported) => {
              setImportSaving(true);
              try {
                const saved = await saveDeckNow.mutateAsync(imported);
                setImportOpen(false);
                router.push(`/decks/${saved.id}`);
              } finally {
                setImportSaving(false);
              }
            }}
          />
        ) : null}
      </ScreenLayout>

      {showSubNav ? <DecksSubNav /> : null}

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete deck"
        description={
          pendingDelete
            ? `Delete “${pendingDelete.name}”? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="destructive"
        onConfirm={async () => {
          if (!pendingDelete) return;
          await removeDeck.mutateAsync(pendingDelete.id);
        }}
      />
    </View>
  );
}
