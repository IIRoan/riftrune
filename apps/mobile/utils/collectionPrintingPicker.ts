import type { CardListItem, CardListPrinting } from '@riftbound/contracts';
import {
  formatPrintingLabel,
  formatPrintingPrice,
  getCardPrintings,
  getPrintingsInSearchGroup,
  getVariantFamiliesFromPrintings,
} from '@/utils/variants';

export type PrintingPickerOption = {
  id: string;
  label: string;
  subtitle?: string;
  price?: string;
};

export type PrintingWithOwned = CardListPrinting & { owned?: number };

/** Show foil/std picker when multiple finish printings exist and none is pinned. */
export function shouldShowPrintingPicker(
  printings: readonly CardListPrinting[] | undefined,
  fixedVariantNumber?: string
): boolean {
  return fixedVariantNumber == null && (printings?.length ?? 0) > 1;
}

export function buildPrintingPickerOptions(
  printings: readonly CardListPrinting[]
): PrintingPickerOption[] {
  return printings.map((printing) => ({
    id: printing.variantNumber,
    label: formatPrintingLabel(
      printing.variantLabel,
      printing.isFoil,
      printing.variantNumber
    ),
    subtitle: printing.variantNumber,
    price: formatPrintingPrice(printing.priceEur) ?? undefined,
  }));
}

/** Printings the user currently owns with quantity > 0. */
export function getOwnedPrintingsForPicker(
  printings: readonly PrintingWithOwned[] | undefined
): PrintingWithOwned[] {
  return (printings ?? []).filter((printing) => (printing.owned ?? 0) > 0);
}

export function shouldShowRemovePrintingPicker(
  printings: readonly PrintingWithOwned[] | undefined,
  fixedVariantNumber?: string
): boolean {
  if (!shouldShowPrintingPicker(printings, fixedVariantNumber)) return false;
  return getOwnedPrintingsForPicker(printings).length > 1;
}

export function getRemovePrintingPickerOptions(
  printings: readonly PrintingWithOwned[],
  allOptions: PrintingPickerOption[]
): PrintingPickerOption[] {
  const ownedIds = new Set(
    getOwnedPrintingsForPicker(printings).map((printing) => printing.variantNumber)
  );
  return allOptions.filter((option) => ownedIds.has(option.id));
}

export function attachOwnedToPrintings(
  printings: readonly CardListPrinting[],
  collectionByVariant?: ReadonlyMap<string, { quantity: number }>
): PrintingWithOwned[] {
  return printings.map((printing) => ({
    ...printing,
    owned: collectionByVariant?.get(printing.variantNumber)?.quantity ?? 0,
  }));
}

/**
 * Printings exposed on catalog quick-add controls.
 * Scoped to the active variant family (std + foil finishes, not alt art).
 */
export function resolveQuickAddPrintings(
  card: CardListItem,
  familyContextVariantNumber?: string | null
): CardListPrinting[] {
  const allPrintings = getCardPrintings(card);
  if (familyContextVariantNumber) {
    return getPrintingsInSearchGroup(allPrintings, familyContextVariantNumber);
  }
  const families = getVariantFamiliesFromPrintings(allPrintings);
  const standardFamily = families.find((family) => family.label === 'Standard') ?? families[0];
  return standardFamily?.variants ?? allPrintings;
}

export function resolvePrintingPickerState(input: {
  printings: readonly PrintingWithOwned[];
  fixedVariantNumber?: string;
}): {
  showAddPicker: boolean;
  showRemovePicker: boolean;
  addOptions: PrintingPickerOption[];
  removeOptions: PrintingPickerOption[];
} {
  const addOptions = buildPrintingPickerOptions(input.printings);
  const showAddPicker = shouldShowPrintingPicker(input.printings, input.fixedVariantNumber);
  const showRemovePicker = shouldShowRemovePrintingPicker(
    input.printings,
    input.fixedVariantNumber
  );
  const removeOptions = showRemovePicker
    ? getRemovePrintingPickerOptions(input.printings, addOptions)
    : [];

  return {
    showAddPicker,
    showRemovePicker,
    addOptions,
    removeOptions,
  };
}
