import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, View } from 'react-native';
import type { CardListPrinting } from '@riftbound/contracts';
import { PrintingPickerMenu } from '@/components/catalog/PrintingPickerMenu';
import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { formatPrintingLabel, formatPrintingPrice } from '@/utils/variants';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface OwnershipStepperProps {
  owned: number;
  name: string;
  compact?: boolean;
  busy?: boolean;
  printings?: CardListPrinting[];
  onAdd: (variantNumber?: string) => void;
  onRemove: (variantNumber?: string) => void;
}

export function OwnershipStepper({
  owned,
  name,
  compact = false,
  busy = false,
  printings,
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

  const multiple = (printings?.length ?? 0) > 1;

  const btnSize = compact ? 'size-6' : 'size-8';
  const iconSize = compact ? 12 : 14;

  const addButtonClass = cn(
    'w-auto shrink-0 border-border active:border-ring',
    compact ? 'h-6 px-1.5' : 'h-8 px-2.5'
  );

  const renderAddButton = (title: string) => {
    const button = (
      <Button
        variant="outline"
        size="sm"
        className={addButtonClass}
        onPress={multiple ? undefined : () => onAdd()}
        disabled={busy}
        busy={busy && !multiple}
        accessibilityLabel={`Add ${name} to collection`}
      >
        <ButtonIcon className={compact ? 'size-3' : 'size-3.5'}>
          <Ionicons name="add" size={iconSize} />
        </ButtonIcon>
        <ButtonText className={compact ? 'text-[11px]' : 'text-[13px]'}>Add</ButtonText>
      </Button>
    );

    if (!multiple) return button;

    return (
      <PrintingPickerMenu title={title} options={pickerOptions} onSelect={onAdd}>
        {button}
      </PrintingPickerMenu>
    );
  };

  const renderPlusButton = () => {
    const button = (
      <Pressable
        accessibilityLabel={`Add one ${name}`}
        className={cn(
          'items-center justify-center active:bg-accent',
          btnSize,
          compact ? 'rounded-r-md' : 'rounded-r-lg'
        )}
        onPress={multiple ? undefined : () => onAdd()}
        disabled={busy}
      >
        {busy && !multiple ? (
          <ActivityIndicator size="small" className="accent-primary" />
        ) : (
          <Ionicons name="add" size={iconSize} className="text-muted-foreground" />
        )}
      </Pressable>
    );

    if (!multiple) return button;

    return (
      <PrintingPickerMenu title="Add printing" options={pickerOptions} onSelect={onAdd}>
        {button}
      </PrintingPickerMenu>
    );
  };

  const renderMinusButton = () => {
    const showPicker = multiple && ownedPrintings.length > 1;
    const removeOptions = pickerOptions.filter((o) =>
      ownedPrintings.some((p) => p.variantNumber === o.id)
    );

    const button = (
      <Pressable
        accessibilityLabel={`Remove one ${name}`}
        className={cn(
          'items-center justify-center active:bg-accent',
          btnSize,
          compact ? 'rounded-l-md' : 'rounded-l-lg'
        )}
        onPress={showPicker ? undefined : () => onRemove()}
        disabled={busy}
      >
        {busy && !showPicker ? (
          <ActivityIndicator size="small" className="accent-primary" />
        ) : (
          <Ionicons name="remove" size={iconSize} className="text-muted-foreground" />
        )}
      </Pressable>
    );

    if (!showPicker) return button;

    return (
      <PrintingPickerMenu
        title="Remove printing"
        options={removeOptions}
        onSelect={onRemove}
      >
        {button}
      </PrintingPickerMenu>
    );
  };

  if (owned > 0) {
    return (
      <View
        className={cn(
          'flex-row items-center border border-border bg-card',
          compact ? 'rounded-md' : 'rounded-lg'
        )}
      >
        {renderMinusButton()}
        <Text
          className={cn(
            'text-center font-mono font-semibold tabular-nums text-success',
            compact ? 'min-w-5 text-[11px]' : 'min-w-7 text-[13px]'
          )}
        >
          {owned}
        </Text>
        {renderPlusButton()}
      </View>
    );
  }

  return renderAddButton('Select printing');
}
