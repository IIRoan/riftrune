import { and, ilike, or, sql, type SQL } from 'drizzle-orm';
import { cards, sets, variants } from '../db/schema.js';

/** Split query into tokens for multi-word matching (all tokens must match somewhere). */
export function tokenizeSearchQuery(raw: string): string[] {
  return raw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Match card name, variant number, type, or tags for every token.
 */
export function buildCardSearchCondition(q: string): SQL | undefined {
  const tokens = tokenizeSearchQuery(q);
  if (tokens.length === 0) return undefined;

  const perToken = tokens.map((token) => {
    const pattern = `%${token}%`;
    return or(
      ilike(cards.name, pattern),
      ilike(variants.variantNumber, pattern),
      ilike(cards.type, pattern),
      ilike(cards.description, pattern),
      ilike(cards.effect, pattern),
      ilike(cards.attachText, pattern),
      ilike(variants.artist, pattern),
      ilike(variants.flavorText, pattern),
      ilike(sets.name, pattern),
      ilike(sets.code, pattern),
      sql`${cards.tags}::text ILIKE ${pattern}`
    );
  });

  return perToken.length === 1 ? perToken[0] : and(...perToken);
}

/** Prefer prefix matches, then substring, then alphabetical. */
export function buildSearchRelevanceOrder(q: string) {
  const trimmed = q.trim();
  const prefix = `${trimmed}%`;
  const contains = `%${trimmed}%`;
  return sql`
    CASE
      WHEN ${cards.name} ILIKE ${prefix} THEN 0
      WHEN ${variants.variantNumber} ILIKE ${prefix} THEN 1
      WHEN ${cards.name} ILIKE ${contains} THEN 2
      WHEN ${variants.variantNumber} ILIKE ${contains} THEN 3
      ELSE 4
    END
  `;
}
