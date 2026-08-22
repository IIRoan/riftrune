export type ChampionTagCard = {
  name: string;
  tags: string[];
};

/** Primary champion name from title ("Darius, Hand of Noxus" → "Darius"). */
export function cardPrimaryNameToken(card: Pick<ChampionTagCard, 'name'>): string {
  const head = (card.name.split(' - ')[0] ?? card.name).trim();
  return (head.split(',')[0] ?? head).trim();
}

/** Legend champion tags: card tags when present, else primary name token. */
export function legendChampionTags(legend: ChampionTagCard): string[] {
  const tags = (legend.tags ?? []).map((tag) => tag.trim()).filter(Boolean);
  if (tags.length > 0) return tags;

  const primary = cardPrimaryNameToken(legend);
  return primary ? [primary] : [];
}

function normalizeTag(value: string): string {
  return value.trim().toLowerCase();
}

function tagsShareValue(left: string[], right: string[]): boolean {
  const rightNormalized = new Set(right.map(normalizeTag));
  return left.some((tag) => rightNormalized.has(normalizeTag(tag)));
}

/** Champion/signature shares legend identity via tags OR primary name token (not full title). */
export function sharesLegendChampionTag(
  legend: ChampionTagCard,
  candidate: ChampionTagCard
): boolean {
  const legendTokens = legendChampionTags(legend);
  if (!legendTokens.length) return true;

  const legendPrimary = cardPrimaryNameToken(legend);
  const candidatePrimary = cardPrimaryNameToken(candidate);
  if (
    legendPrimary &&
    candidatePrimary &&
    normalizeTag(legendPrimary) === normalizeTag(candidatePrimary)
  ) {
    return true;
  }

  const candidateName = candidate.name.toLowerCase();
  if (legendPrimary && candidateName.includes(normalizeTag(legendPrimary))) {
    return true;
  }

  if (tagsShareValue(candidate.tags, legendTokens)) {
    return true;
  }

  return legendTokens.some((tag) => candidateName.includes(normalizeTag(tag)));
}
