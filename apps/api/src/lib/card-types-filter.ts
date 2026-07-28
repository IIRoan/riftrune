import { sql } from 'drizzle-orm';
import { cards } from '../db/schema.js';

/**
 * Match cards whose type equals any filter, or includes it as a whitespace token.
 * Riftbound dual types like "Unit Gear" must match both `Unit` and `Gear` filters.
 */
export function buildCardTypesCondition(typeFilters: string[]) {
  const normalized = typeFilters
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (normalized.length === 0) return undefined;

  const filterArray = sql.join(
    normalized.map((value) => sql`${value}`),
    sql`, `
  );

  return sql`string_to_array(lower(trim(${cards.type})), ' ') && ARRAY[${filterArray}]::text[]`;
}
