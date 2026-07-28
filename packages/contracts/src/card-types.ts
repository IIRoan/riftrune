/**
 * Riftbound card `type` may be a single value (`Unit`) or whitespace-joined
 * dual type (`Unit Gear`). Filters and deck section checks must match tokens,
 * not only the full string — otherwise dual-type cards vanish from deck add.
 */

/** Whitespace-delimited lowercase type tokens. */
export function cardTypeTokens(type: string): string[] {
  return type
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

/** True when the card type shares any token with `wanted` (case-insensitive). */
export function cardHasAnyType(type: string, wanted: readonly string[]): boolean {
  if (wanted.length === 0) return false;
  const tokens = new Set(cardTypeTokens(type));
  return wanted.some((value) => tokens.has(value.trim().toLowerCase()));
}

/** Normalize a comma-separated types query into lowercase filter tokens. */
export function parseCardTypeFilters(typesQuery: string): string[] {
  return typesQuery
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Whether a card type matches a types= query (exact token overlap).
 * Mirrors Postgres: `string_to_array(lower(trim(type)), ' ') && ARRAY[filters]`.
 */
export function cardTypeMatchesFilters(type: string, filters: readonly string[]): boolean {
  if (filters.length === 0) return true;
  const normalized = filters.map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (normalized.length === 0) return true;
  return cardHasAnyType(type, normalized);
}
