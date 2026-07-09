import * as WebBrowser from 'expo-web-browser';
import { Pressable, View } from 'react-native';
import { DeckLegalityBadge } from '@/components/deck/DeckLegalityBadge';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import {
  collectIllegalCardNames,
  deckArchiveViewUrl,
  deckBrowseSummaryLine,
  deckHasBannedCards,
} from '@/lib/deck-browse';
import type { DeckState } from '@/lib/deck-types';
import { hapticPress } from '@/utils/haptics';

interface DeckViewInfoPanelProps {
  deck: DeckState;
}

async function openExternalUrl(url: string) {
  hapticPress();
  await WebBrowser.openBrowserAsync(url);
}

export function DeckViewInfoPanel({ deck }: DeckViewInfoPanelProps) {
  const summary = deckBrowseSummaryLine(deck);
  const archiveUrl = deckArchiveViewUrl(deck.id);
  const illegalNames = collectIllegalCardNames(deck);
  const hasBannedCards = deckHasBannedCards(deck);
  const tournamentLegal = !hasBannedCards;

  return (
    <View className="gap-3">
      <View className="gap-2">
        <DeckLegalityBadge isLegal={tournamentLegal} />
        {hasBannedCards ? (
          <Text className="text-[12px] leading-5 text-muted-foreground">
            Illegal cards: {illegalNames.join(', ')}
          </Text>
        ) : null}
      </View>

      {summary ? (
        <Text className="text-[13px] text-muted-foreground">{summary}</Text>
      ) : null}

      {deck.description ? (
        <View className="gap-1 rounded-lg border border-archive-soft-line/80 bg-background/40 px-2.5 py-2">
          <Text className="text-[11px] font-semibold text-muted-foreground">Description</Text>
          <Text className="text-[13px] leading-5 text-foreground">{deck.description}</Text>
        </View>
      ) : null}

      {deck.videoUrl || deck.hasGuide || deck.hasMatchups ? (
        <View className="flex-row flex-wrap gap-2">
          {deck.videoUrl ? (
            <Button
              variant="outline"
              size="sm"
              className="w-auto"
              onPress={() => void openExternalUrl(deck.videoUrl!)}
            >
              <ButtonIcon>
                <ThemedIonicon name="videocam-outline" size={14} color="foreground" />
              </ButtonIcon>
              <ButtonText>Watch video</ButtonText>
            </Button>
          ) : null}
          {deck.hasGuide ? (
            <Button
              variant="outline"
              size="sm"
              className="w-auto"
              onPress={() => void openExternalUrl(archiveUrl)}
            >
              <ButtonIcon>
                <ThemedIonicon name="book-outline" size={14} color="foreground" />
              </ButtonIcon>
              <ButtonText>Read guide</ButtonText>
            </Button>
          ) : null}
          {deck.hasMatchups ? (
            <Button
              variant="outline"
              size="sm"
              className="w-auto"
              onPress={() => void openExternalUrl(archiveUrl)}
            >
              <ButtonIcon>
                <ThemedIonicon name="git-compare-outline" size={14} color="foreground" />
              </ButtonIcon>
              <ButtonText>View matchups</ButtonText>
            </Button>
          ) : null}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="link"
        className="self-start active:opacity-80"
        onPress={() => void openExternalUrl(archiveUrl)}
      >
        <Text className="text-[12px] font-medium text-primary">Open on Piltover Archive</Text>
      </Pressable>
    </View>
  );
}
