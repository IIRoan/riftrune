import { ActivityIndicator, Pressable, View } from 'react-native';
import { useMemo } from 'react';
import { PrintingPickerMenu } from '@/components/catalog/PrintingPickerMenu';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import {
  buildPrintingPickerOptions,
  getRemovePrintingPickerOptions,
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

  const iconSize = relaxed ? 14 : compact ? 12 : 14;
  const controlHeight = relaxed ? 'h-9' : compact ? 'h-6' : 'h-8';
  const stepSize = relaxed ? 'size-9' : compact ? 'size-6' : 'size-8';
  const shellRadius = compact ? 'rounded-md' : 'rounded-lg';

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
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'border-border active:border-ring',
          gridSlot ? 'w-full' : 'w-auto shrink-0',
          controlHeight,
          relaxed ? 'px-3' : compact ? 'px-1.5' : 'px-2.5'
        )}
        onPress={multiple ? undefined : () => onAdd(fixedVariantNumber)}
        disabled={busy}
        busy={busy && !multiple}
        accessibilityLabel={`Add ${name} to collection`}
      >
        <ButtonIcon>
          <ThemedIonicon name="add" size={iconSize} color="foreground" />
        </ButtonIcon>
        <ButtonText className={relaxed ? 'text-[13px]' : compact ? 'text-[11px]' : 'text-[13px]'}>
          Add
        </ButtonText>
      </Button>
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
    const icon = direction === 'add' ? 'add' : 'remove';
    const label = direction === 'add' ? `Add one ${name}` : `Remove one ${name}`;

    const button = (
      <Pressable
        accessibilityLabel={label}
        className={cn(
          'items-center justify-center active:bg-accent',
          gridSlot
            ? 'h-full flex-1'
            : cn(
                stepSize,
                direction === 'add'
                  ? compact
                    ? 'rounded-r-md'
                    : 'rounded-r-lg'
                  : compact
                    ? 'rounded-l-md'
                    : 'rounded-l-lg'
              )
        )}
        onPress={showPicker ? undefined : onPress}
        disabled={busy}
      >
        {busy && !showPicker ? (
          <ActivityIndicator size="small" className="accent-primary" />
        ) : (
          <ThemedIonicon name={icon} size={iconSize} color="foreground" />
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
          'flex-row items-stretch overflow-hidden border border-border bg-card',
          gridSlot ? 'w-full' : undefined,
          shellRadius,
          controlHeight
        )}
      >
        {renderStepButton(
          'remove',
          () => onRemove(fixedVariantNumber),
          showRemovePicker,
          'Remove printing',
          removeOptions,
          onRemove
        )}
        <View className="w-hairline self-stretch bg-archive-soft-line" />
        <Text
          className={cn(
            'shrink-0 self-center text-center font-mono font-semibold tabular-nums text-success',
            gridSlot
              ? 'min-w-[1.25rem] px-0.5 text-xs'
              : compact
                ? 'min-w-5 text-[11px]'
                : relaxed
                  ? 'min-w-6 text-[13px]'
                  : 'min-w-7 text-[13px]'
          )}
        >
          {owned}
        </Text>
        <View className="w-hairline self-stretch bg-archive-soft-line" />
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
