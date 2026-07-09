import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DeckImportExportSheet } from '@/components/deck/DeckImportExportSheet';
import { DeckImportLoadingOverlay } from '@/components/deck/DeckImportLoadingOverlay';
import { DeckListCard } from '@/components/deck/DeckListCard';
import { DecksSubNav } from '@/components/deck/DecksSubNav';
import { ScreenLayout, ScreenLayoutBody } from '@/components/shell/ScreenLayout';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { SearchInput } from '@/components/ui/search-input';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { CalendarPlusIcon } from '@/components/icons';
import { useDeckMutations } from '@/hooks/useDecks';
import { createEmptyDeck } from '@/lib/deck-card';
import type { DeckState } from '@/lib/deck-types';
import { hapticPress } from '@/utils/haptics';

type DeckListQuery = {
  data?: DeckState[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
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
}: DecksListScreenProps) {
  const router = useRouter();
  const { removeDeck, importDeck, saveDeckNow } = useDeckMutations();
  const { data: decks = [], isLoading, isError, refetch } = decksQuery;
  const [importOpen, setImportOpen] = useState(false);
  const [importSaving, setImportSaving] = useState(false);
  const importPlaceholderDeck = useMemo(() => createEmptyDeck(), []);

  const archiveImportBusy = importDeck.isPending;

  return (
    <ScreenLayout>
      <DeckImportLoadingOverlay
        visible={importSaving || archiveImportBusy}
        message={
          archiveImportBusy
            ? 'Importing deck to your collection…'
            : 'Saving imported deck…'
        }
      />
      <ScreenLayoutBody>
        <View className="mb-4 w-full gap-3">
          <View className="w-full flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1 shrink" style={{ minWidth: 0 }}>
              <Text className="text-2xl font-bold tracking-tight text-foreground">{title}</Text>
              <Text className="mt-1 font-mono text-[13px] text-muted-foreground">{subtitle}</Text>
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
                      router.push('/deck/create');
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

          {showSubNav ? <DecksSubNav /> : null}

          <SearchInput
            value={query}
            onChangeText={onQueryChange}
            placeholder={searchPlaceholder}
            accessibilityLabel={searchPlaceholder}
            className="min-h-12 rounded-xl border-border bg-card"
          />
        </View>

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator />
          </View>
        ) : isError ? (
          <Empty className="mt-8 border border-dashed border-border">
            <EmptyHeader>
              <EmptyTitle>Could not load decks</EmptyTitle>
              <EmptyDescription>
                The deck list timed out or the server returned an error. Try again in a moment.
              </EmptyDescription>
            </EmptyHeader>
            <Button onPress={() => void refetch()}>
              <ButtonText>Retry</ButtonText>
            </Button>
          </Empty>
        ) : decks.length === 0 ? (
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
                    router.push('/deck/create');
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
        ) : (
          <View className="gap-3">
            {decks.map((deck) => (
              <DeckListCard
                key={deck.id}
                deck={deck}
                onPress={() => router.push(`/deck/${deck.id}`)}
                onDelete={
                  deck.readOnly
                    ? undefined
                    : () => {
                        void removeDeck.mutateAsync(deck.id);
                      }
                }
                onImport={
                  deck.readOnly
                    ? () => {
                        void importDeck.mutateAsync(deck.id).then((saved) => {
                          router.push(`/deck/${saved.id}`);
                        });
                      }
                    : undefined
                }
                importBusy={importDeck.isPending && importDeck.variables === deck.id}
              />
            ))}
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
              router.push(`/deck/${saved.id}`);
            } finally {
              setImportSaving(false);
            }
          }}
        />
      ) : null}
    </ScreenLayout>
  );
}
