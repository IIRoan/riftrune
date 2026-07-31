/**
 * Upstream `foilMode` is a product finish-availability flag, not "this row is foil".
 * Explicit foil siblings (e.g. OGN-001-Foil) are detected via number/label/type.
 */

export type FoilMode = 'both' | 'foil_only' | 'nonfoil_only' | 'unknown';

export function normalizeFoilMode(foilMode: string | null | undefined): FoilMode {
  const mode = (foilMode ?? '').trim().toLowerCase();
  if (mode === 'both') return 'both';
  if (mode === 'foil_only') return 'foil_only';
  if (mode === 'nonfoil_only' || mode === 'none') return 'nonfoil_only';
  return 'unknown';
}

/** True when number/label/type explicitly mark a foil sibling SKU. */
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

/**
 * Whether a catalog printing itself is a foil finish.
 * `foil_only` means every copy of that printing is foil.
 * `both` alone does not — only an explicit foil sibling is foil under `both`.
 */
export function isVariantFoil(
  foilMode: string | null | undefined,
  variantNumber: string,
  variantLabel?: string,
  variantType?: string
): boolean {
  if (isExplicitFoilVariant(variantNumber, variantLabel, variantType)) return true;
  return normalizeFoilMode(foilMode) === 'foil_only';
}

/** True when a single SKU offers both standard and foil without a distinct foil sibling. */
export function variantOffersDualFinishes(
  foilMode: string | null | undefined,
  variantNumber: string,
  variantLabel?: string,
  variantType?: string
): boolean {
  if (normalizeFoilMode(foilMode) !== 'both') return false;
  return !isExplicitFoilVariant(variantNumber, variantLabel, variantType);
}

/** Ownership / quantity map key that distinguishes finish on the same variant number. */
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
