import { useState } from 'react';
import { Share, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetScrollView,
  BottomSheetTitle,
} from '@/components/ui/bottom-sheet';
import { Button, ButtonText } from '@/components/ui/button';
import { TextareaInput } from '@/components/ui/textarea-input';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import {
  exportFlatDeckList,
  exportPiltoverArchive,
  importDeckText,
} from '@/lib/deck-io';
import { createDeckId } from '@/lib/deck-card';
import type { DeckState } from '@/lib/deck-types';
import { resolveDeckCardByName } from '@/hooks/useDeckCardResolver';
import { toast } from '@/components/ui/toast';
import { DeckImportLoadingOverlay } from '@/components/deck/DeckImportLoadingOverlay';

type DeckIoMode = 'import' | 'export';

interface DeckImportExportSheetProps {
  open: boolean;
  mode: DeckIoMode;
  deck: DeckState;
  onClose: () => void;
  onImport: (deck: DeckState) => void | Promise<void>;
  /** When true, import creates a new deck identity instead of merging into `deck`. */
  asNewDeck?: boolean;
}

export function DeckImportExportSheet({
  open,
  mode,
  deck,
  onClose,
  onImport,
  asNewDeck = false,
}: DeckImportExportSheetProps) {
  const reduceMotion = useReduceMotion();
  const [text, setText] = useState(() =>
    mode === 'export' ? exportPiltoverArchive(deck) : ''
  );
  const [busy, setBusy] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: text || exportPiltoverArchive(deck),
        title: `${deck.name} deck list`,
      });
    } catch {
      toast.error('Could not share deck list.');
    }
  };

  const handleImport = async () => {
    if (!text.trim()) {
      toast.error('Paste a deck list to import.');
      return;
    }

    setBusy(true);
    try {
      const { deck: imported, unresolved } = await importDeckText(text, resolveDeckCardByName);
      const now = Date.now();
      const payload: DeckState = asNewDeck
        ? {
            ...imported,
            id: createDeckId(),
            name:
              imported.legend?.name != null && imported.legend.name.length > 0
                ? `${imported.legend.name} deck`
                : 'Imported deck',
            createdAt: now,
            updatedAt: now,
          }
        : { ...imported, id: deck.id, name: deck.name, createdAt: deck.createdAt };

      await Promise.resolve(onImport(payload));

      if (unresolved.length > 0) {
        toast.warning(`Imported with ${unresolved.length} unresolved card(s).`);
      } else {
        toast.success('Deck imported.');
      }
      onClose();
    } catch {
      toast.error('Could not import deck list.');
    } finally {
      setBusy(false);
    }
  };

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/plain', 'text/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const fileUri = result.assets[0].uri;
    const contents = await FileSystem.readAsStringAsync(fileUri);
    setText(contents);
  };

  return (
    <>
      <DeckImportLoadingOverlay visible={busy && mode === 'import'} message="Importing deck…" />
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next && !busy) onClose();
        }}
      >
        <BottomSheetPortal name="deck-import-export">
          <BottomSheetOverlay />
          <BottomSheetContent
            snapPoints={reduceMotion ? ['92%'] : ['75%', '92%']}
            defaultSnapIndex={0}
            enablePanDownToClose={!busy}
            enableOverDrag={!reduceMotion && !busy}
          >
            <BottomSheetHeader>
              <BottomSheetTitle>
                {mode === 'export' ? 'Export deck' : 'Import deck list'}
              </BottomSheetTitle>
            </BottomSheetHeader>
            <BottomSheetScrollView contentContainerClassName="gap-4 px-4">
              {mode === 'import' ? (
                <View className="gap-3 rounded-xl border border-archive-soft-line bg-card-panel p-4">
                  <View className="flex-row items-start gap-3">
                    <View className="mt-0.5 size-10 items-center justify-center rounded-full bg-primary/15">
                      <ThemedIonicon name="download-outline" size={20} color="primary" />
                    </View>
                    <View className="min-w-0 flex-1 gap-1">
                      <Text className="text-sm font-semibold text-foreground">
                        Paste or upload a deck list
                      </Text>
                      <Text className="text-[13px] leading-snug text-muted-foreground">
                        Supports Piltover Archive section headers or flat lists like{' '}
                        <Text className="font-mono text-xs">3 Card Name (SET-123)</Text>.
                      </Text>
                    </View>
                  </View>
                  <Button variant="outline" onPress={() => void handlePickFile()} disabled={busy}>
                    <ButtonText>Choose text file</ButtonText>
                  </Button>
                </View>
              ) : (
                <Text className="text-sm text-muted-foreground">
                  PiltoverArchive text format with section headers.
                </Text>
              )}

              <TextareaInput
                value={text}
                onChangeText={setText}
                disabled={mode === 'export' || busy}
                multiline
                numberOfLines={12}
                className="min-h-52 font-mono text-xs"
                placeholder={
                  mode === 'import'
                    ? 'Legend:\nIrelia, Blade Dancer\n\nMain Deck:\n3 En Garde (SFD-001)\n...'
                    : undefined
                }
              />

              {mode === 'export' ? (
                <View className="flex-row flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => setText(exportPiltoverArchive(deck))}
                  >
                    <ButtonText>PiltoverArchive</ButtonText>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => setText(exportFlatDeckList(deck))}
                  >
                    <ButtonText>Flat list</ButtonText>
                  </Button>
                </View>
              ) : null}
            </BottomSheetScrollView>
            <BottomSheetFooter className="flex-row gap-2 px-4">
              <Button variant="outline" className="flex-1" onPress={onClose} disabled={busy}>
                <ButtonText>Close</ButtonText>
              </Button>
              {mode === 'export' ? (
                <Button className="flex-1" onPress={() => void handleShare()}>
                  <ButtonText>Share</ButtonText>
                </Button>
              ) : (
                <Button className="flex-1" busy={busy} disabled={busy} onPress={() => void handleImport()}>
                  <ButtonText>{busy ? 'Importing…' : 'Import deck'}</ButtonText>
                </Button>
              )}
            </BottomSheetFooter>
          </BottomSheetContent>
        </BottomSheetPortal>
      </BottomSheet>
    </>
  );
}
