import { MinusIcon, PlusIcon, ThemedIcon } from '@/components/icons';
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
  type PrintingWithOwned,
} from '@/utils/collectionPrintingPicker';
import { cn } from '@/lib/utils';

interface OwnershipStepperProps {
  owned: number;
  name: string;
  compact?: boolean;
  /** Slightly larger targets for mobile list rows. */
  relaxed?: boolean;
  /** Fill a fixed-width grid tile slot — Add and stepper share the same footprint. */
  gridSlot?: boolean;
  busy?: boolean;
  printings?: PrintingWithOwned[];
  fixedVariantNumber?: string;
  onAdd: (variantNumber?: string) => void;
  onRemove: (variantNumber?: string) => void;
}

export function OwnershipStepper({
  owned,
  name,
  compact = false,
  relaxed = false,
  gridSlot = false,
  busy = false,
  printings,
  fixedVariantNumber,
  onAdd,
  onRemove,
}: OwnershipStepperProps) {
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

  const iconSize = relaxed ? 12 : 11;
  /** Keep Add + owned stepper the same height to avoid tile layout shift. */
  const controlHeight = gridSlot || compact ? 'h-7' : relaxed ? 'h-8' : 'h-7';
  const stepSize = gridSlot || compact ? 'size-7' : relaxed ? 'size-8' : 'size-7';
  /** Shared footprint so Add ↔ owned doesn't jump in detail rows. */
  const controlWidth = compact && !gridSlot ? 'min-w-[5.75rem]' : undefined;

  const wrapWithPicker = (
    title: string,
    options: typeof pickerOptions,
    onSelect: (id: string) => void,
    node: React.ReactElement<{ onPress?: () => void; disabled?: boolean }>
  ) => (
    <PrintingPickerMenu title={title} options={options} onSelect={onSelect}>
      {node}
    </PrintingPickerMenu>
  );

  const renderAddButton = (title: string) => {
    const button = (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${name} to collection`}
        className={cn(
          'flex-row items-center justify-center gap-1 rounded-md bg-primary/12 px-2.5 active:bg-primary/18',
          gridSlot ? 'w-full' : 'w-auto shrink-0',
          controlWidth,
          controlHeight,
          relaxed && 'px-3',
          busy && 'opacity-60'
        )}
        onPress={multiple ? undefined : () => onAdd(fixedVariantNumber)}
        disabled={busy}
      >
        {busy && !multiple ? (
          <ActivityIndicator size="small" className="accent-primary" />
        ) : (
          <>
            <ThemedIcon
              icon={PlusIcon}
              size={iconSize}
              color="archive-accent-text"
              weight="regular"
            />
            <Text className="text-[11px] font-semibold text-archive-accent-text">Add</Text>
          </>
        )}
      </Pressable>
    );

    return multiple ? wrapWithPicker(title, pickerOptions, onAdd, button) : button;
  };

  const renderStepButton = (
    direction: 'add' | 'remove',
    onPress: (() => void) | undefined,
    showPicker: boolean,
    pickerTitle: string,
    pickerOptionsFiltered: typeof pickerOptions,
    onSelect: (id: string) => void
  ) => {
    const icon = direction === 'add' ? PlusIcon : MinusIcon;
    const label = direction === 'add' ? `Add one ${name}` : `Remove one ${name}`;

    const button = (
      <Pressable
        accessibilityLabel={label}
        className={cn(
          'items-center justify-center rounded-full active:bg-primary/14',
          gridSlot ? 'h-full flex-1' : stepSize
        )}
        onPress={showPicker ? undefined : onPress}
        disabled={busy}
      >
        {busy && !showPicker ? (
          <ActivityIndicator size="small" className="accent-primary" />
        ) : (
          <ThemedIcon
            icon={icon}
            size={iconSize}
            color="archive-accent-text"
            weight="regular"
          />
        )}
      </Pressable>
    );

    return showPicker
      ? wrapWithPicker(pickerTitle, pickerOptionsFiltered, onSelect, button)
      : button;
  };

  if (owned > 0) {
    return (
      <View
        className={cn(
          'flex-row items-center',
          gridSlot ? 'w-full justify-between' : cn('justify-between gap-0.5', controlWidth),
          controlHeight,
          busy && 'opacity-60'
        )}
      >
        {renderStepButton(
          'remove',
          () => onRemove(resolveQuickRemoveVariantNumber(printings, fixedVariantNumber)),
          showRemovePicker,
          'Remove printing',
          removeOptions,
          onRemove
        )}
        <Text
          className={cn(
            'shrink-0 text-center font-mono font-semibold tabular-nums text-foreground',
            gridSlot
              ? 'min-w-7 text-xs'
              : compact
                ? 'min-w-5 text-[11px]'
                : relaxed
                  ? 'min-w-6 text-[13px]'
                  : 'min-w-6 text-[12px]'
          )}
        >
          {owned}
        </Text>
        {renderStepButton(
          'add',
          () => onAdd(fixedVariantNumber),
          multiple,
          'Add printing',
          pickerOptions,
          onAdd
        )}
      </View>
    );
  }

  return renderAddButton('Select printing');
}
