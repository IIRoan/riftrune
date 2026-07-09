import type { DeckCard, DeckSectionKey, DeckState } from '@/lib/deck-types';
import {
  cardPrimaryNameToken,
  legendChampionTags,
  sharesLegendChampionTag,
} from '@riftbound/contracts';
import { getSectionCount, sectionForCardType } from '@/lib/deck-card';
import { battlefieldsAtCapacity } from '@/lib/deck-limits';

export type CardEligibilityResult = {
  eligible: boolean;
  reason?: string;
};

export type DeckIdentity = {
  /** Allowed domain identities derived from the current deck (legend preferred). */
  allowedDomains: Set<string> | null;
  /** Legend champion tags (used for champion/signature matching). */
  legendChampionTags: string[] | null;
  /** A stricter, single champion tag when we can infer it from the legend. */
  strictLegendChampionTag: string | null;
};

function normalizeDomainNames(domains: string[]): string[] {
  // Domains in deck cards are already strings; normalize casing for robust comparisons.
  return domains.map((d) => d.trim()).filter(Boolean);
}

/** @deprecated Use cardPrimaryNameToken from @riftbound/contracts */
export const legendPrimaryNameToken = cardPrimaryNameToken;

export { legendChampionTags };

function domainIdentityMatch(cardDomains: string[], allowed: Set<string>): boolean {
  if (!cardDomains.length) return true;
  const normalized = normalizeDomainNames(cardDomains);
  return normalized.every((domain) => allowed.has(domain));
}

function strictLegendChampionTagFromLegend(legend: DeckCard): string | null {
  const tags = legendChampionTags(legend);
  if (tags.length === 1) return tags[0] ?? null;
  if (tags.length === 0) return null;

  const nameToken = cardPrimaryNameToken(legend);
  if (!nameToken) return null;

  const nameTokenLower = nameToken.trim().toLowerCase();
  const direct = tags.filter((t) => t.trim().toLowerCase() === nameTokenLower);
  if (direct.length === 1) return direct[0] ?? null;

  const inName = tags.filter((t) =>
    legend.name.toLowerCase().includes(t.trim().toLowerCase())
  );
  if (inName.length === 1) return inName[0] ?? null;

  return null;
}

export function getDeckIdentity(deck: DeckState): DeckIdentity {
  if (deck.legend) {
    const allowedDomains = new Set(normalizeDomainNames(deck.legend.colors));
    const resolvedTags = legendChampionTags(deck.legend);
    const legendChampionTagsList = resolvedTags.length ? resolvedTags : null;
    return {
      allowedDomains: allowedDomains.size ? allowedDomains : null,
      legendChampionTags: legendChampionTagsList,
      strictLegendChampionTag: strictLegendChampionTagFromLegend(deck.legend),
    };
  }

  if (deck.champion) {
    const allowedDomains = new Set(normalizeDomainNames(deck.champion.colors));
    return {
      allowedDomains: allowedDomains.size ? allowedDomains : null,
      legendChampionTags: null,
      strictLegendChampionTag: null,
    };
  }

  return {
    allowedDomains: null,
    legendChampionTags: null,
    strictLegendChampionTag: null,
  };
}

function matchesLegendChampionTag(
  candidate: DeckCard,
  legend: Pick<DeckCard, 'name' | 'tags'>
): boolean {
  return sharesLegendChampionTag(legend, candidate);
}

export function championMatchesLegend(deck: DeckState, candidate: DeckCard): boolean {
  if (!deck.legend) return false;
  if ((candidate.super ?? '').toLowerCase() !== 'champion') return false;
  return sharesLegendChampionTag(deck.legend, candidate);
}

function totalCopiesForCardName(deck: DeckState, name: string): number {
  let total = 0;
  if (deck.champion?.name === name) total += 1;

  for (const [, entry] of deck.mainDeck) {
    if (entry.card.name === name) total += entry.count;
  }
  for (const [, entry] of deck.runes) {
    if (entry.card.name === name) total += entry.count;
  }
  for (const [, entry] of deck.battlefields) {
    if (entry.card.name === name) total += entry.count;
  }
  for (const [, entry] of deck.sideboard) {
    if (entry.card.name === name) total += entry.count;
  }
  return total;
}

function battlefieldCopiesForCardName(deck: DeckState, name: string): number {
  return deck.battlefields.get(name)?.count ?? 0;
}

function maxCopiesForCandidate(candidate: DeckCard): number {
  return candidate.type.toLowerCase() === 'rune' ? 12 : 3;
}

function signatureCountMatchingLegend(deck: DeckState): number {
  if (!deck.legend) return 0;

  let count = 0;
  for (const [, entry] of deck.mainDeck) {
    if (!entry.card.isSignature) continue;
    if (!sharesLegendChampionTag(deck.legend, entry.card)) continue;
    count += entry.count;
  }
  return count;
}

function signatureCountAll(deck: DeckState): number {
  let count = 0;
  for (const [, entry] of deck.mainDeck) {
    if (entry.card.isSignature) count += entry.count;
  }
  return count;
}

export function isCardEligibleForSection(args: {
  deck: DeckState;
  section: DeckSectionKey;
  candidateCard: DeckCard;
  /** Assume adding 1 copy, or (for legend/champion) setting that identity card. */
  delta?: number;
}): CardEligibilityResult {
  const { deck, section, candidateCard } = args;
  const candidateType = sectionForCardType(candidateCard);

  // 1) Section-type eligibility first (prevents expensive identity checks).
  if (section === 'legend' && deck.legend?.name === candidateCard.name) {
    return { eligible: true };
  }
  if (section === 'champion' && deck.champion?.name === candidateCard.name) {
    return { eligible: true };
  }

  if (section === 'legend') {
    if (candidateType !== 'legend') {
      return { eligible: false, reason: 'Not a Legend card.' };
    }
  } else if (section === 'champion') {
    if (candidateType !== 'champion') {
      return { eligible: false, reason: 'Not a Champion Unit.' };
    }
  } else if (section === 'runes') {
    if (candidateType !== 'runes') {
      return { eligible: false, reason: 'Not a Rune card.' };
    }
  } else if (section === 'battlefields') {
    if (candidateType !== 'battlefields') {
      return { eligible: false, reason: 'Not a Battlefield card.' };
    }
  } else if (section === 'mainDeck') {
    if (candidateType !== 'mainDeck') {
      return { eligible: false, reason: 'Not a Main Deck card.' };
    }
  } else if (section === 'sideboard') {
    if (candidateType !== 'mainDeck') {
      return { eligible: false, reason: 'Not a Main Deck card for sideboard.' };
    }
    if (candidateCard.isSignature) {
      return { eligible: false, reason: 'Signature cards cannot be added to sideboard.' };
    }
  }

  const identity = getDeckIdentity(deck);

  // 2) Identity-domain filtering (main deck, runes, sideboard only).
  const sectionsWithDomainFilter: DeckSectionKey[] = ['mainDeck', 'runes', 'sideboard'];
  if (sectionsWithDomainFilter.includes(section) && identity.allowedDomains) {
    if (!domainIdentityMatch(candidateCard.colors, identity.allowedDomains)) {
      return { eligible: false, reason: 'Card does not match deck domain identity.' };
    }
  }

  // 3) Special constraints that depend on legend/champion tags.
  if (section === 'champion' && deck.legend) {
    if (!championMatchesLegend(deck, candidateCard)) {
      return {
        eligible: false,
        reason: 'Chosen Champion must share a champion tag with your Legend.',
      };
    }
  }

  if (section === 'legend') {
    // If we already have other cards in the deck, only allow Legends that keep them domain/tag compatible.
    // This avoids a UX where changing the legend would instantly make your existing deck invalid.
    const hasExisting = Boolean(
      deck.champion ||
        deck.mainDeck.size > 0 ||
        deck.runes.size > 0 ||
        deck.battlefields.size > 0 ||
        deck.sideboard.size > 0
    );
    if (hasExisting) {
      const nextIdentity: DeckIdentity = {
        allowedDomains: new Set(normalizeDomainNames(candidateCard.colors)),
        legendChampionTags: candidateCard.tags,
        strictLegendChampionTag: strictLegendChampionTagFromLegend(candidateCard),
      };

      const champion = deck.champion;
      if (champion && nextIdentity.allowedDomains) {
        if (!domainIdentityMatch(champion.colors, nextIdentity.allowedDomains)) {
          return { eligible: false, reason: 'Legend domain identity would conflict with existing Champion.' };
        }
        if (!matchesLegendChampionTag(champion, candidateCard)) {
          return { eligible: false, reason: 'Legend champion tags would conflict with existing Champion.' };
        }
      }

      const validateEntryDomain = (card: DeckCard, context: string) => {
        if (!nextIdentity.allowedDomains) return true;
        return domainIdentityMatch(card.colors, nextIdentity.allowedDomains);
      };

      for (const [, entry] of deck.mainDeck) {
        if (!validateEntryDomain(entry.card, 'main')) {
          return { eligible: false, reason: 'Legend domain identity would conflict with existing Main Deck.' };
        }
      }
      for (const [, entry] of deck.runes) {
        if (!validateEntryDomain(entry.card, 'runes')) {
          return { eligible: false, reason: 'Legend domain identity would conflict with existing Runes.' };
        }
      }
      for (const [, entry] of deck.battlefields) {
        if (!validateEntryDomain(entry.card, 'battlefields')) {
          return { eligible: false, reason: 'Legend domain identity would conflict with existing Battlefields.' };
        }
      }
      for (const [, entry] of deck.sideboard) {
        if (!validateEntryDomain(entry.card, 'sideboard')) {
          return { eligible: false, reason: 'Legend domain identity would conflict with existing Sideboard.' };
        }
      }

      // Signature cards must match legend champion tag.
      for (const [name, entry] of deck.mainDeck) {
        if (!entry.card.isSignature) continue;
        if (!matchesLegendChampionTag(entry.card, candidateCard)) {
          return { eligible: false, reason: `Signature card "${name}" must match the Legend champion tag.` };
        }
      }
    }
  }

  // 4) Copy limits + uniqueness constraints.
  if (section === 'battlefields') {
    if (battlefieldCopiesForCardName(deck, candidateCard.name) >= 1) {
      return { eligible: false, reason: 'Battlefield names are unique in a deck.' };
    }
    if (battlefieldsAtCapacity(deck)) {
      return {
        eligible: false,
        reason: 'Your deck already has 3 battlefields. Remove one to add another.',
      };
    }
  }

  if (section === 'champion') {
    const existingChampionName = deck.champion?.name;
    const base = totalCopiesForCardName(deck, candidateCard.name);
    const future = base - (existingChampionName === candidateCard.name ? 1 : 0) + 1;
    if (future > maxCopiesForCandidate(candidateCard)) {
      return { eligible: false, reason: 'Adding this Champion would exceed copy limits.' };
    }
  } else if (section !== 'legend' && section !== 'battlefields') {
    // Battlefields use slot + uniqueness rules above, not the 3-copy default.
    const future = totalCopiesForCardName(deck, candidateCard.name) + 1;
    if (future > maxCopiesForCandidate(candidateCard)) {
      return { eligible: false, reason: 'Adding this card would exceed copy limits.' };
    }
  }

  // 5) Signature cap (main deck only).
  if (section === 'mainDeck' && candidateCard.isSignature) {
    if (deck.legend) {
      const matchesTag = deck.legend
        ? matchesLegendChampionTag(candidateCard, deck.legend)
        : true;
      if (!matchesTag) {
        return { eligible: false, reason: 'Signature cards must match the Legend champion tag.' };
      }
      const existingMatching = signatureCountMatchingLegend(deck);
      if (existingMatching + 1 > 3) {
        return { eligible: false, reason: 'Signature card cap reached for this Legend.' };
      }
    } else {
      const existing = signatureCountAll(deck);
      if (existing + 1 > 3) {
        return { eligible: false, reason: 'Signature card cap reached.' };
      }
    }
  }

  return { eligible: true };
}

