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

/** Escape a literal for PostgreSQL POSIX regex. */
export function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Name with spaces stripped — matches the query regardless of word spacing. */
function squashedName() {
  return sql`replace(lower(${cards.name}), ' ', '')`;
}

/**
 * Case-insensitive whole-word match on a text column.
 * "signed" matches "Overnumbered Signed" but not "assigned".
 */
export function wholeWordPattern(token: string): string {
  return `(^|[^[:alnum:]_])${escapeRegexLiteral(token)}([^[:alnum:]_]|$)`;
}

/**
 * Match card name, variant number/label/type, type, tags, or rules text for every token.
 * Rules/flavor text use whole-word matching so "signed" does not hit "assigned".
 * A space-insensitive whole-query clause also matches the name, so
 * "soulspinner" finds "Soul Spinner" and "soul spinner" finds "Soulspinner".
 */
export function buildCardSearchCondition(q: string): SQL | undefined {
  const tokens = tokenizeSearchQuery(q);
  if (tokens.length === 0) return undefined;

  const perToken = tokens.map((token) => {
    const pattern = `%${token}%`;
    const wordPattern = wholeWordPattern(token);
    return or(
      // Identity / catalog fields — substring OK for partial discovery ("aka", "VEN-18")
      ilike(cards.name, pattern),
      ilike(variants.variantNumber, pattern),
      ilike(cards.type, pattern),
      ilike(variants.variantLabel, pattern),
      ilike(variants.variantType, pattern),
      sql`${variants.variantTypes}::text ILIKE ${pattern}`,
      ilike(variants.artist, pattern),
      ilike(sets.name, pattern),
      ilike(sets.code, pattern),
      sql`${cards.tags}::text ILIKE ${pattern}`,
      // Rules / flavor — whole words only ("signed" ≠ "assigned")
      sql`${cards.description} ~* ${wordPattern}`,
      sql`${cards.effect} ~* ${wordPattern}`,
      sql`${cards.attachText} ~* ${wordPattern}`,
      sql`${variants.flavorText} ~* ${wordPattern}`
    );
  });

  const tokenCondition = and(...perToken);
  if (!tokenCondition) return undefined;

  return or(tokenCondition, sql`${squashedName()} LIKE ${`%${tokens.join('')}%`}`);
}

/** Prefer prefix matches, then substring, then alphabetical. */
export function buildSearchRelevanceOrder(q: string) {
  const trimmed = q.trim();
  const squashed = trimmed.toLowerCase().replace(/\s+/g, '');
  const prefix = `${trimmed}%`;
  const contains = `%${trimmed}%`;
  return sql`
    CASE
      WHEN ${cards.name} ILIKE ${prefix} THEN 0
      WHEN ${variants.variantNumber} ILIKE ${prefix} THEN 1
      WHEN ${variants.variantLabel} ILIKE ${contains} THEN 2
      WHEN ${variants.variantType} ILIKE ${contains} THEN 3
      WHEN ${squashedName()} LIKE ${`${squashed}%`} THEN 4
      WHEN ${cards.name} ILIKE ${contains} THEN 5
      WHEN ${variants.variantNumber} ILIKE ${contains} THEN 6
      WHEN ${squashedName()} LIKE ${`%${squashed}%`} THEN 7
      ELSE 8
    END
  `;
}
