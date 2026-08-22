/** foilMode is finish availability, not "this row is foil"; explicit foil siblings via number/label/type. */

export type FoilMode = 'both' | 'foil_only' | 'nonfoil_only' | 'unknown';

export function normalizeFoilMode(foilMode: string | null | undefined): FoilMode {
  const mode = (foilMode ?? '').trim().toLowerCase();
  if (mode === 'both') return 'both';
  if (mode === 'foil_only') return 'foil_only';
  if (mode === 'nonfoil_only' || mode === 'none') return 'nonfoil_only';
  return 'unknown';
}

export function isExplicitFoilVariant(
  variantNumber: string,
  variantLabel?: string,
  variantType?: string
): boolean {
  if (/foil/i.test(variantNumber)) return true;
  if (variantLabel && /foil/i.test(variantLabel)) return true;
  if (variantType && /foil/i.test(variantType)) return true;
  return false;
}

/** Printing is foil if foil_only, or an explicit foil sibling under both (both alone is not foil). */
export function isVariantFoil(
  foilMode: string | null | undefined,
  variantNumber: string,
  variantLabel?: string,
  variantType?: string
): boolean {
  if (isExplicitFoilVariant(variantNumber, variantLabel, variantType)) return true;
  return normalizeFoilMode(foilMode) === 'foil_only';
}

export function variantOffersDualFinishes(
  foilMode: string | null | undefined,
  variantNumber: string,
  variantLabel?: string,
  variantType?: string
): boolean {
  if (normalizeFoilMode(foilMode) !== 'both') return false;
  return !isExplicitFoilVariant(variantNumber, variantLabel, variantType);
}

/** Ownership key distinguishing finish on the same variant number. */
export function collectionFinishKey(variantNumber: string, isFoil: boolean): string {
  return `${variantNumber}::${isFoil ? 'foil' : 'std'}`;
}

export function parseCollectionFinishKey(
  key: string
): { variantNumber: string; isFoil: boolean } | null {
  const sep = key.lastIndexOf('::');
  if (sep <= 0) return null;
  const suffix = key.slice(sep + 2);
  if (suffix !== 'foil' && suffix !== 'std') return null;
  return {
    variantNumber: key.slice(0, sep),
    isFoil: suffix === 'foil',
  };
}
