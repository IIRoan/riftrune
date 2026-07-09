import { sql } from 'drizzle-orm';
import { cards } from '../db/schema.js';

/** Card colors must all be within the allowed domain set (deck identity). */
export function buildCardColorsSubsetCondition(allowedColorNames: string[]) {
  const normalized = allowedColorNames.map((name) => name.trim()).filter(Boolean);
  if (normalized.length === 0) return undefined;

  return sql`NOT EXISTS (
    SELECT 1
    FROM card_colors cc
    INNER JOIN colors c ON c.id = cc.color_id
    WHERE cc.card_id = ${cards.id}
      AND c.name NOT IN (${sql.join(
        normalized.map((name) => sql`${name}`),
        sql`, `
      )})
  )`;
}
