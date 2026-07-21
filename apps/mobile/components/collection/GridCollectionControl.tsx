import { ActivityIndicator, Pressable, View } from 'react-native';
import { useMemo } from 'react';
import { PrintingPickerMenu } from '@/components/catalog/PrintingPickerMenu';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import {
  buildPrintingPickerOptions,
  getRemovePrintingPickerOptions,
  shouldShowPrintingPicker,
  shouldShowRemovePrintingPicker,
  type PrintingPickerOption,
  type PrintingWithOwned,
} from '@/utils/collectionPrintingPicker';
import { hapticPress } from '@/utils/haptics';

interface Props {
  owned: number;
  name: string;
  busy?: boolean;
  printings?: PrintingWithOwned[];
  fixedVariantNumber?: string;
  onAdd: (variantNumber?: string) => void;
  onRemove: (variantNumber?: string) => void;
}

function wrapWithPicker(
  title: string,
  options: PrintingPickerOption[],
  onSelect: (id: string) => void,
  node: React.ReactElement<{ onPress?: () => void; disabled?: boolean }>
) {
  return (
    <PrintingPickerMenu title={title} options={options} onSelect={onSelect}>
      {node}
    </PrintingPickerMenu>
  );
}

/** Fixed footer height — both Add and stepper states must match to avoid grid layout shift. */
const CONTROL_HEIGHT = 'h-8';

/** Compact collection control for 3-column mobile grid tiles. */
export function GridCollectionControl({
  owned,
  name,
  busy = false,
  printings,
  fixedVariantNumber,
  onAdd,
  onRemove,
}: Props) {
  const pickerOptions = useMemo(
    () => buildPrintingPickerOptions(printings ?? []),
    [printings]
  );

  const multiple = shouldShowPrintingPicker(printings, fixedVariantNumber);
  const showRemovePicker = shouldShowRemovePrintingPicker(printings, fixedVariantNumber);
  const removeOptions = useMemo(
    () => getRemovePrintingPickerOptions(printings ?? [], pickerOptions),
    [printings, pickerOptions]
  );

  const handleAdd = () => {
    void hapticPress();
    onAdd(fixedVariantNumber);
  };

  const handleRemove = () => {
    void hapticPress();
    onRemove(fixedVariantNumber);
  };

  if (owned === 0) {
    const addBtn = (
      <Pressable
        accessibilityLabel={`Add ${name} to collection`}
        className={`${CONTROL_HEIGHT} w-full flex-row items-center justify-center gap-0.5 rounded-md border border-border bg-card active:bg-card-panel`}
        onPress={multiple ? undefined : handleAdd}
        disabled={busy}
      >
        {busy && !multiple ? (
          <ActivityIndicator size="small" className="accent-muted-foreground" />
        ) : (
          <>
            <ThemedIonicon name="add" size={14} color="muted-foreground" />
            <Text className="text-[10px] font-medium text-muted-foreground">Add</Text>
          </>
        )}
      </Pressable>
    );

    return multiple
      ? wrapWithPicker('Select printing', pickerOptions, onAdd, addBtn)
      : addBtn;
  }

  const stepBtn = 'h-full flex-1 items-center justify-center active:bg-accent/80';

  const decrement = (
    <Pressable
      accessibilityLabel={`Remove one ${name}`}
      className={stepBtn}
      onPress={showRemovePicker ? undefined : handleRemove}
      disabled={busy}
    >
      {busy && !showRemovePicker ? (
        <ActivityIndicator size="small" className="accent-foreground" />
      ) : (
        <ThemedIonicon name="remove" size={16} color="foreground" />
      )}
    </Pressable>
  );

  const increment = (
    <Pressable
      accessibilityLabel={`Add one ${name}`}
      className={stepBtn}
      onPress={multiple ? undefined : handleAdd}
      disabled={busy}
    >
      {busy && !multiple ? (
        <ActivityIndicator size="small" className="accent-foreground" />
      ) : (
        <ThemedIonicon name="add" size={16} color="foreground" />
      )}
    </Pressable>
  );

  return (
    <View
      className={`${CONTROL_HEIGHT} w-full flex-row items-stretch overflow-hidden rounded-lg border border-border bg-card-panel`}
    >
      {showRemovePicker
        ? wrapWithPicker('Remove printing', removeOptions, onRemove, decrement)
        : decrement}
      <View className="w-hairline self-stretch bg-archive-soft-line" />
      <View className="min-w-[1.25rem] items-center justify-center px-0.5">
        <Text className="font-mono text-xs font-bold tabular-nums text-success">{owned}</Text>
      </View>
      <View className="w-hairline self-stretch bg-archive-soft-line" />
      {multiple ? wrapWithPicker('Add printing', pickerOptions, onAdd, increment) : increment}
    </View>
  );
}
