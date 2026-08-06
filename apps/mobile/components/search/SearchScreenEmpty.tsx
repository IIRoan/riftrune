import { ClockIcon, XIcon } from '@/components/icons';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Chip, ChipIcon, ChipText } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { ThemedIcon, type LucideIcon } from '@/components/icons';
import type { SearchHistoryItem } from '@/services/searchHistoryService';
import { View } from 'react-native';

export function SearchEmptyState({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <Empty className="mt-14 border-0">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="mb-1 size-16">
          <ThemedIcon icon={icon} size={32} color="ring" />
        </EmptyMedia>
        <EmptyTitle className="text-lg">{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
    </Empty>
  );
}

export function SearchScreenHistory({
  history,
  onHistoryPress,
  onHistoryDelete,
  onClearAllHistory,
}: {
  history: SearchHistoryItem[];
  onHistoryPress: (item: SearchHistoryItem) => void;
  onHistoryDelete: (item: SearchHistoryItem) => void;
  onClearAllHistory: () => void;
}) {
  return (
    <View className="mt-1">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-sm font-semibold text-muted-foreground">Recent</Text>
        <Button variant="link" onPress={() => void onClearAllHistory()} hitSlop={8}>
          <ButtonText className="text-sm">Clear</ButtonText>
        </Button>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {history.map((item) => (
          <View key={`${item.query}-${String(item.timestamp)}`} className="flex-row items-center">
            <Chip variant="outline" onPress={() => void onHistoryPress(item)}>
              <ChipIcon>
                <ClockIcon className="size-[13px] text-foreground" />
              </ChipIcon>
              <ChipText className="max-w-[180px]">{item.query}</ChipText>
            </Chip>
            <Button
              size="icon-sm"
              variant="ghost"
              className="ml-1 size-[22px] rounded-full bg-transparent"
              onPress={() => void onHistoryDelete(item)}
              hitSlop={6}
              accessibilityLabel="Remove from history"
            >
              <ButtonIcon className="text-muted-foreground">
                <XIcon className="size-[12px] text-foreground" />
              </ButtonIcon>
            </Button>
          </View>
        ))}
      </View>
    </View>
  );
}
