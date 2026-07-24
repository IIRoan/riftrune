import { ThemedIcon, DownloadIcon } from '@/components/icons';
import { useState } from 'react';
import { View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import {
  AppSheet,
  AppSheetBody,
  AppSheetContent,
  AppSheetFooter,
  AppSheetHeader,
  AppSheetOverlay,
  AppSheetPortal,
  AppSheetTitle,
} from '@/components/ui/app-sheet';
import { Button, ButtonText } from '@/components/ui/button';
import { TextareaInput } from '@/components/ui/textarea-input';
import { Text } from '@/components/ui/text';
import { importDeckText } from '@/lib/deck-io';
import { createDeckId } from '@/lib/deck-card';
import type { DeckState } from '@/lib/deck-types';
import {
  resolveDeckCardByName,
  resolveDeckCardByVariant,
} from '@/hooks/useDeckCardResolver';
import { toast } from '@/components/ui/toast';
import { DeckImportLoadingOverlay } from '@/components/deck/DeckImportLoadingOverlay';

interface DeckImportExportSheetProps {
  open: boolean;
  /** Kept for call-site compatibility; only import is supported. */
  mode?: 'import';
  deck: DeckState;
  onClose: () => void;
  onImport: (deck: DeckState) => void | Promise<void>;
  /** When true, import creates a new deck identity instead of merging into `deck`. */
  asNewDeck?: boolean;
}

export function DeckImportExportSheet({
  open,
  deck,
  onClose,
  onImport,
  asNewDeck = false,
}: DeckImportExportSheetProps) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const handleImport = async () => {
    if (!text.trim()) {
      toast.error('Paste a deck list or deck code to import.');
      return;
    }

    setBusy(true);
    try {
      const { deck: imported, unresolved } = await importDeckText(
        text,
        resolveDeckCardByName,
        resolveDeckCardByVariant
      );
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
      toast.error('Could not import deck list or code.');
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
      <DeckImportLoadingOverlay visible={busy} message="Importing deck…" />
      <AppSheet
        open={open}
        onOpenChange={(next) => {
          if (!next && !busy) onClose();
        }}
        dismissible={!busy}
      >
        <AppSheetPortal name="deck-import">
          <AppSheetOverlay />
          <AppSheetContent enableDynamicSizing enablePanDownToClose={!busy}>
            <AppSheetHeader>
              <AppSheetTitle>Import deck</AppSheetTitle>
            </AppSheetHeader>
            <AppSheetBody className="gap-4 pb-2">
              <View className="gap-3 rounded-xl border border-archive-soft-line bg-card-panel p-4">
                <View className="flex-row items-start gap-3">
                  <View className="mt-0.5 size-10 items-center justify-center rounded-full bg-primary/15">
                    <ThemedIcon icon={DownloadIcon} size={20} color="primary" />
                  </View>
                  <View className="min-w-0 flex-1 gap-1">
                    <Text className="text-sm font-semibold text-foreground">
                      Paste a list or deck code
                    </Text>
                    <Text className="text-[13px] leading-snug text-muted-foreground">
                      Supports Piltover Archive deck codes, section headers, or flat lists like{' '}
                      <Text className="font-mono text-xs">3 Card Name (SET-123)</Text>.
                    </Text>
                  </View>
                </View>
                <Button variant="outline" onPress={() => void handlePickFile()} disabled={busy}>
                  <ButtonText>Choose text file</ButtonText>
                </Button>
              </View>

              <TextareaInput
                value={text}
                onChangeText={setText}
                disabled={busy}
                multiline
                numberOfLines={10}
                className="min-h-44 font-mono text-xs"
                placeholder={
                  'Deck code, or:\nLegend:\nIrelia, Blade Dancer\n\nMain Deck:\n3 En Garde (SFD-001)\n...'
                }
              />
            </AppSheetBody>
            <AppSheetFooter>
              <View className="w-full flex-row items-center gap-2">
                <Button
                  variant="outline"
                  className="w-auto flex-1"
                  onPress={onClose}
                  disabled={busy}
                >
                  <ButtonText>Close</ButtonText>
                </Button>
                <Button
                  className="w-auto flex-[1.4]"
                  busy={busy}
                  disabled={busy}
                  onPress={() => void handleImport()}
                >
                  <ButtonText>{busy ? 'Importing…' : 'Import deck'}</ButtonText>
                </Button>
              </View>
            </AppSheetFooter>
          </AppSheetContent>
        </AppSheetPortal>
      </AppSheet>
    </>
  );
}
