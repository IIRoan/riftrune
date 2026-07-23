import { ThemedIcon, MinusIcon, PlusIcon } from '@/components/icons';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useMemo } from 'react';
import { PrintingPickerMenu } from '@/components/catalog/PrintingPickerMenu';
import { Text } from '@/components/ui/text';
import {
  buildPrintingPickerOptions,
  getRemovePrintingPickerOptions,
  resolveQuickRemoveVariantNumber,
  shouldShowPrintingPicker,
  shouldShowRemovePrintingPicker,
  type PrintingPickerOption,
  type PrintingWithOwned,
} from '@/utils/collectionPrintingPicker';
import { cn } from '@/lib/utils';
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
const CONTROL_HEIGHT = 'h-6';
const ICON_SIZE = 9;

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
    onRemove(resolveQuickRemoveVariantNumber(printings, fixedVariantNumber));
  };

  if (owned === 0) {
    const addBtn = (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${name} to collection`}
        className={cn(
          CONTROL_HEIGHT,
          'w-full flex-row items-center justify-center gap-1 rounded-md bg-primary/12 px-1.5 active:bg-primary/18',
          busy && 'opacity-60'
        )}
        onPress={multiple ? undefined : handleAdd}
        disabled={busy}
      >
        {busy && !multiple ? (
          <ActivityIndicator size="small" className="accent-primary" />
        ) : (
          <>
            <ThemedIcon
              icon={PlusIcon}
              size={ICON_SIZE}
              color="archive-accent-text"
              weight="regular"
            />
            <Text className="text-[11px] font-semibold text-archive-accent-text">Add</Text>
          </>
        )}
      </Pressable>
    );

    return multiple
      ? wrapWithPicker('Select printing', pickerOptions, onAdd, addBtn)
      : addBtn;
  }

  const stepBtn =
    'h-full flex-1 items-center justify-center rounded-full active:bg-primary/14';

  const decrement = (
    <Pressable
      accessibilityLabel={`Remove one ${name}`}
      className={stepBtn}
      onPress={showRemovePicker ? undefined : handleRemove}
      disabled={busy}
    >
      {busy && !showRemovePicker ? (
        <ActivityIndicator size="small" className="accent-primary" />
      ) : (
        <ThemedIcon
          icon={MinusIcon}
          size={ICON_SIZE}
          color="archive-accent-text"
          weight="regular"
        />
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
        <ActivityIndicator size="small" className="accent-primary" />
      ) : (
        <ThemedIcon
          icon={PlusIcon}
          size={ICON_SIZE}
          color="archive-accent-text"
          weight="regular"
        />
      )}
    </Pressable>
  );

  return (
    <View
      className={cn(
        CONTROL_HEIGHT,
        'w-full flex-row items-center justify-between',
        busy && 'opacity-60'
      )}
    >
      {showRemovePicker
        ? wrapWithPicker('Remove printing', removeOptions, onRemove, decrement)
        : decrement}
      <Text className="min-w-7 text-center font-mono text-xs font-semibold tabular-nums text-foreground">
        {owned}
      </Text>
      {multiple ? wrapWithPicker('Add printing', pickerOptions, onAdd, increment) : increment}
    </View>
  );
}
