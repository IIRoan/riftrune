import { and, sql, type SQL } from 'drizzle-orm';
import { cards } from '../db/schema.js';

/** Catalog browse: card must include every selected color (may have others). */
export function buildCardColorsContainsAllCondition(requiredColorNames: string[]) {
  const normalized = requiredColorNames.map((name) => name.trim()).filter(Boolean);
  if (normalized.length === 0) return undefined;

  const parts: SQL[] = normalized.map(
    (name) => sql`EXISTS (
      SELECT 1
      FROM card_colors cc
      INNER JOIN colors c ON c.id = cc.color_id
      WHERE cc.card_id = ${cards.id}
        AND lower(c.name) = lower(${name})
    )`
  );

  return parts.length === 1 ? parts[0] : and(...parts);
}
