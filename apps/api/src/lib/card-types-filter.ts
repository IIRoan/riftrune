import { sql } from 'drizzle-orm';
import { parseCardTypeFilters } from '@riftbound/contracts';
import { cards } from '../db/schema.js';

/**
 * Match cards whose type equals any filter, or includes it as a whitespace token.
 * Riftbound dual types like "Unit Gear" must match both `Unit` and `Gear` filters.
 * Semantics must stay aligned with `cardTypeMatchesFilters` in @riftbound/contracts.
 */
export function buildCardTypesCondition(typeFilters: string[]) {
  const normalized = parseCardTypeFilters(typeFilters.join(','));
  if (normalized.length === 0) return undefined;

  const filterArray = sql.join(
    normalized.map((value) => sql`${value}`),
    sql`, `
  );

  // Token overlap — not `type IN (...)` — so "Unit Gear" matches Unit and Gear.
  return sql`string_to_array(lower(trim(${cards.type})), ' ') && ARRAY[${filterArray}]::text[]`;
}
