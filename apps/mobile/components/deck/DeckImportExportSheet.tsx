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
import { useReduceMotion } from '@/hooks/useReduceMotion';
import {
  exportFlatDeckList,
  exportPiltoverArchive,
  importDeckText,
} from '@/lib/deck-io';
import type { DeckState } from '@/lib/deck-types';
import { resolveDeckCardByName } from '@/hooks/useDeckCardResolver';
import { toast } from '@/components/ui/toast';

type DeckIoMode = 'import' | 'export';

interface DeckImportExportSheetProps {
  open: boolean;
  mode: DeckIoMode;
  deck: DeckState;
  onClose: () => void;
  onImport: (deck: DeckState) => void;
}

export function DeckImportExportSheet({
  open,
  mode,
  deck,
  onClose,
  onImport,
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
      onImport({ ...imported, id: deck.id, name: deck.name, createdAt: deck.createdAt });
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
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <BottomSheetPortal name="deck-import-export">
        <BottomSheetOverlay />
        <BottomSheetContent
          snapPoints={reduceMotion ? ['92%'] : ['75%', '92%']}
          defaultSnapIndex={0}
          enablePanDownToClose
          enableOverDrag={!reduceMotion}
        >
          <BottomSheetHeader>
            <BottomSheetTitle>{mode === 'export' ? 'Export deck' : 'Import deck'}</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetScrollView contentContainerClassName="gap-3 px-4">
            <Text className="text-sm text-muted-foreground">
              {mode === 'export'
                ? 'PiltoverArchive text format with section headers.'
                : 'Paste a PiltoverArchive or flat deck list (count Name (SET-NUM)).'}
            </Text>
            <TextareaInput
              value={text}
              onChangeText={setText}
              disabled={mode === 'export'}
              multiline
              numberOfLines={12}
              className="min-h-48 font-mono text-xs"
              placeholder={mode === 'import' ? 'Legend:\n1 Jinx, Loose Cannon\n\n...' : undefined}
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
            ) : (
              <Button variant="outline" onPress={() => void handlePickFile()}>
                <ButtonText>Choose file</ButtonText>
              </Button>
            )}
          </BottomSheetScrollView>
          <BottomSheetFooter className="flex-row gap-2 px-4">
            <Button variant="outline" className="flex-1" onPress={onClose}>
              <ButtonText>Close</ButtonText>
            </Button>
            {mode === 'export' ? (
              <Button className="flex-1" onPress={() => void handleShare()}>
                <ButtonText>Share</ButtonText>
              </Button>
            ) : (
              <Button className="flex-1" disabled={busy} onPress={() => void handleImport()}>
                <ButtonText>{busy ? 'Importing…' : 'Import'}</ButtonText>
              </Button>
            )}
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheetPortal>
    </BottomSheet>
  );
}
