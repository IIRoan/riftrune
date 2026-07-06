import { ActivityIndicator, Pressable, View } from 'react-native';
import type { CardListPrinting } from '@riftbound/contracts';
import { useMemo } from 'react';
import { PrintingPickerMenu } from '@/components/catalog/PrintingPickerMenu';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ThemedIonicon } from '@/components/ui/themed-ionicon';
import { formatPrintingLabel, formatPrintingPrice } from '@/utils/variants';
import { cn } from '@/lib/utils';

interface OwnershipStepperProps {
  owned: number;
  name: string;
  compact?: boolean;
  /** Slightly larger targets for mobile list rows. */
  relaxed?: boolean;
  busy?: boolean;
  printings?: CardListPrinting[];
  fixedVariantNumber?: string;
  onAdd: (variantNumber?: string) => void;
  onRemove: (variantNumber?: string) => void;
}

export function OwnershipStepper({
  owned,
  name,
  compact = false,
  relaxed = false,
  busy = false,
  printings,
  fixedVariantNumber,
  onAdd,
  onRemove,
}: OwnershipStepperProps) {
  const pickerOptions = useMemo(
    () =>
      (printings ?? []).map((p) => ({
        id: p.variantNumber,
        label: formatPrintingLabel(p.variantLabel, p.isFoil, p.variantNumber),
        subtitle: p.variantNumber,
        price: formatPrintingPrice(p.priceEur) ?? undefined,
      })),
    [printings]
  );

  const ownedPrintings = useMemo(
    () => printings?.filter((p) => (p as CardListPrinting & { owned?: number }).owned !== 0) ?? [],
    [printings]
  );

  const multiple = fixedVariantNumber == null && (printings?.length ?? 0) > 1;

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
          'w-auto shrink-0 border-border active:border-ring',
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
          stepSize,
          direction === 'add'
            ? compact
              ? 'rounded-r-md'
              : 'rounded-r-lg'
            : compact
              ? 'rounded-l-md'
              : 'rounded-l-lg'
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
    const showRemovePicker = multiple && ownedPrintings.length > 1;
    const removeOptions = pickerOptions.filter((o) =>
      ownedPrintings.some((p) => p.variantNumber === o.id)
    );

    return (
      <View
        className={cn(
          'flex-row items-center overflow-hidden border border-border bg-card',
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
        <Text
          className={cn(
            'text-center font-mono font-semibold tabular-nums text-success',
            compact ? 'min-w-5 text-[11px]' : relaxed ? 'min-w-6 text-[13px]' : 'min-w-7 text-[13px]'
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
