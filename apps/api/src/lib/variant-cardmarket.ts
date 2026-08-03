/**
 * Distinct foil SKUs (`OGN-001-Foil`) often omit Cardmarket ids upstream while the
 * base printing (`OGN-001`) carries the shared `idProduct`. Resolve that sibling.
 */
export function baseVariantNumberForCardmarket(variantNumber: string): string | null {
  const trimmed = variantNumber.trim();
  if (!/-Foil$/i.test(trimmed)) return null;
  const base = trimmed.replace(/-Foil$/i, '');
  if (base.length === 0) return null;
  if (base.toLowerCase() === trimmed.toLowerCase()) return null;
  return base;
}

/** Prefer the variant's own id, then a `-Foil` base sibling from the same lookup map. */
export function resolveCardmarketIdFromMap(
  variantNumber: string,
  byNumber: ReadonlyMap<string, number | null | undefined>
): number | null {
  const key = variantNumber.toLowerCase();
  const direct = byNumber.get(key);
  if (direct != null) return direct;

  const base = baseVariantNumberForCardmarket(variantNumber);
  if (base == null) return direct ?? null;
  return byNumber.get(base.toLowerCase()) ?? null;
}
