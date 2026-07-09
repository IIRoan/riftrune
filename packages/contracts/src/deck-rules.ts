import { z } from 'zod';
import { sharesLegendChampionTag } from './champion-tags.js';

/** Canonical Riftbound constructed deck rules — single source of truth for API + clients. */
export const RIFTBOUND_DECK_RULES = {
  version: '2026.1',
  game: 'Riftbound',
  format: 'Constructed',
  sections: {
    legend: {
      key: 'legend',
      title: 'Champion Legend',
      target: 1,
      single: true,
      required: true,
      description: 'One Champion Legend defines your deck Domain Identity.',
    },
    champion: {
      key: 'champion',
      title: 'Chosen Champion',
      target: 1,
      single: true,
      required: true,
      description:
        'One Champion Unit that shares a champion tag with your Legend and matches Domain Identity.',
    },
    mainDeck: {
      key: 'mainDeck',
      title: 'Main Deck',
      target: 39,
      minimum: 39,
      required: true,
      description:
        'At least 39 Main Deck cards. With your Chosen Champion, your playable deck is 40 cards.',
    },
    runes: {
      key: 'runes',
      title: 'Rune Deck',
      target: 12,
      exact: true,
      required: true,
      description:
        'Exactly 12 Rune cards matching your Legend Domain Identity. Split freely across your Legend two domains.',
    },
    battlefields: {
      key: 'battlefields',
      title: 'Battlefields',
      target: 3,
      exact: true,
      required: true,
      uniqueNames: true,
      description: 'Exactly 3 Battlefield cards with unique names.',
    },
    sideboard: {
      key: 'sideboard',
      title: 'Sideboard',
      target: 8,
      maximum: 8,
      required: false,
      description: 'Up to 8 Main Deck cards. Signature cards cannot be sideboarded.',
    },
  },
  copyLimits: {
    default: 3,
    rune: 12,
    battlefieldPerName: 1,
    signatureTotal: 3,
  },
  constraints: [
    {
      code: 'domain_identity',
      message:
        'All cards in Main Deck, Rune Deck, Battlefields, Sideboard, and Chosen Champion must match your Legend Domain Identity.',
    },
    {
      code: 'champion_tag',
      message: 'Chosen Champion must share at least one champion tag with your Legend.',
    },
    {
      code: 'champion_supertype',
      message: 'Chosen Champion must be a Champion Unit (supertype: Champion).',
    },
    {
      code: 'signature_cap',
      message: 'At most 3 Signature cards total in the Main Deck, matching Legend champion tags.',
    },
    {
      code: 'signature_sideboard',
      message: 'Signature cards cannot be added to the sideboard.',
    },
    {
      code: 'battlefield_unique',
      message: 'Each Battlefield name may appear at most once.',
    },
  ],
} as const;

export type RiftboundDeckSectionKey = keyof typeof RIFTBOUND_DECK_RULES.sections;

export const DeckCardInput = z.object({
  cardId: z.string(),
  variantNumber: z.string(),
  name: z.string(),
  type: z.string(),
  super: z.string().nullable(),
  tags: z.array(z.string()),
  colors: z.array(z.string()),
  energy: z.number(),
  setCode: z.string(),
  rarity: z.string(),
  variantType: z.string(),
  isSignature: z.boolean(),
  imageUrl: z.string().url().nullable().optional(),
  banEffectiveDate: z.string().nullable().optional(),
});

export const DeckEntryInput = z.object({
  card: DeckCardInput,
  count: z.number().int().positive(),
});

export const DeckValidateInput = z.object({
  legend: DeckCardInput.nullable(),
  champion: DeckCardInput.nullable(),
  mainDeck: z.array(DeckEntryInput),
  runes: z.array(DeckEntryInput),
  battlefields: z.array(DeckEntryInput),
  sideboard: z.array(DeckEntryInput),
});

export const DeckValidationMessage = z.object({
  type: z.enum(['error', 'warning', 'valid']),
  code: z.string(),
  message: z.string(),
});

export const DeckRulesResponse = z.object({
  data: z.object({
    version: z.string(),
    rules: z.object({
      version: z.string(),
      game: z.string(),
      format: z.string(),
      sections: z.record(
        z.object({
          key: z.string(),
          title: z.string(),
          target: z.number().int(),
          single: z.boolean().optional(),
          minimum: z.number().int().optional(),
          exact: z.boolean().optional(),
          maximum: z.number().int().optional(),
          required: z.boolean(),
          uniqueNames: z.boolean().optional(),
          description: z.string(),
        })
      ),
      copyLimits: z.object({
        default: z.number().int(),
        rune: z.number().int(),
        battlefieldPerName: z.number().int(),
        signatureTotal: z.number().int(),
      }),
      constraints: z.array(
        z.object({
          code: z.string(),
          message: z.string(),
        })
      ),
    }),
  }),
});

export const DeckValidateResponse = z.object({
  data: z.object({
    messages: z.array(DeckValidationMessage),
    valid: z.boolean(),
    hasErrors: z.boolean(),
  }),
});

export type DeckCardInput = z.infer<typeof DeckCardInput>;
export type DeckEntryInput = z.infer<typeof DeckEntryInput>;
export type DeckValidateInput = z.infer<typeof DeckValidateInput>;
export type DeckValidationMessage = z.infer<typeof DeckValidationMessage>;

function domainIdentityMatch(cardDomains: string[], legendDomains: Set<string>): boolean {
  if (!cardDomains.length) return true;
  return cardDomains.every((domain) => legendDomains.has(domain));
}

function increment(map: Map<string, number>, key: string, amount: number): void {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function sectionCount(entries: DeckEntryInput[]): number {
  return entries.reduce((sum, entry) => sum + entry.count, 0);
}

export function validateRiftboundDeck(input: DeckValidateInput): DeckValidationMessage[] {
  const messages: DeckValidationMessage[] = [];
  const { legend, champion } = input;
  const mainDeckTotal = sectionCount(input.mainDeck);
  const runeTotal = sectionCount(input.runes);
  const battlefieldTotal = sectionCount(input.battlefields);
  const sideboardTotal = sectionCount(input.sideboard);

  if (!legend) {
    messages.push({
      type: 'error',
      code: 'missing_legend',
      message: 'No Champion Legend selected (need 1).',
    });
  }

  if (!champion) {
    messages.push({
      type: 'error',
      code: 'missing_champion',
      message: 'No Chosen Champion selected (need 1).',
    });
  } else if (legend) {
    const hasMatchingTag = sharesLegendChampionTag(legend, champion);
    if (!hasMatchingTag) {
      messages.push({
        type: 'error',
        code: 'champion_tag_mismatch',
        message: `Chosen Champion "${champion.name}" must share a champion tag with your Legend "${legend.name}".`,
      });
    }

    if ((champion.super ?? '').toLowerCase() !== 'champion') {
      messages.push({
        type: 'error',
        code: 'champion_supertype',
        message: `Chosen Champion "${champion.name}" must be a Champion Unit (supertype: Champion).`,
      });
    }
  }

  if (legend) {
    const legendDomains = new Set(legend.colors);

    for (const { card: entryCard, count: _count } of input.mainDeck) {
      if (!domainIdentityMatch(entryCard.colors, legendDomains)) {
        messages.push({
          type: 'error',
          code: 'domain_identity',
          message: `"${entryCard.name}" does not match your Legend's Domain Identity.`,
        });
      }
    }

    for (const { card: entryCard } of input.runes) {
      if (!domainIdentityMatch(entryCard.colors, legendDomains)) {
        messages.push({
          type: 'error',
          code: 'domain_identity',
          message: `Rune "${entryCard.name}" does not match your Legend's Domain Identity.`,
        });
      }
    }

    if (champion && !domainIdentityMatch(champion.colors, legendDomains)) {
      messages.push({
        type: 'error',
        code: 'domain_identity',
        message: `Chosen Champion "${champion.name}" does not match your Legend's Domain Identity.`,
      });
    }
  }

  const allNameCounts = new Map<string, number>();
  if (champion) increment(allNameCounts, champion.name, 1);
  for (const { card, count } of input.mainDeck) increment(allNameCounts, card.name, count);
  for (const { card, count } of input.runes) increment(allNameCounts, card.name, count);
  for (const { card, count } of input.battlefields) increment(allNameCounts, card.name, count);
  for (const { card, count } of input.sideboard) increment(allNameCounts, card.name, count);

  for (const [name, count] of allNameCounts) {
    const isRune = input.runes.some((entry) => entry.card.name === name);
    const maxCopies = isRune
      ? RIFTBOUND_DECK_RULES.copyLimits.rune
      : RIFTBOUND_DECK_RULES.copyLimits.default;
    if (count > maxCopies) {
      messages.push({
        type: 'error',
        code: 'copy_limit',
        message: `"${name}" has ${count} copies (max ${maxCopies}).`,
      });
    }
  }

  let signatureCount = 0;
  for (const { card, count } of input.mainDeck) {
    if (card.isSignature) signatureCount += count;
  }
  if (signatureCount > RIFTBOUND_DECK_RULES.copyLimits.signatureTotal) {
    messages.push({
      type: 'error',
      code: 'signature_cap',
      message: `${signatureCount} Signature cards in deck (max ${RIFTBOUND_DECK_RULES.copyLimits.signatureTotal} total).`,
    });
  }

  if (legend) {
    for (const { card } of input.mainDeck) {
      if (!card.isSignature) continue;
      const hasMatch = sharesLegendChampionTag(legend, card);
      if (!hasMatch) {
        messages.push({
          type: 'error',
          code: 'signature_tag',
          message: `Signature card "${card.name}" must share a Champion tag with your Legend.`,
        });
      }
    }
  }

  if (mainDeckTotal < RIFTBOUND_DECK_RULES.sections.mainDeck.target) {
    messages.push({
      type: 'warning',
      code: 'main_deck_count',
      message: `Main Deck has ${mainDeckTotal} cards (need at least ${RIFTBOUND_DECK_RULES.sections.mainDeck.target}, plus Chosen Champion = 40).`,
    });
  }

  if (runeTotal !== RIFTBOUND_DECK_RULES.sections.runes.target) {
    messages.push({
      type: runeTotal < RIFTBOUND_DECK_RULES.sections.runes.target ? 'warning' : 'error',
      code: 'rune_count',
      message: `Rune Deck has ${runeTotal} cards (need exactly ${RIFTBOUND_DECK_RULES.sections.runes.target}).`,
    });
  }

  if (battlefieldTotal !== RIFTBOUND_DECK_RULES.sections.battlefields.target) {
    messages.push({
      type:
        battlefieldTotal < RIFTBOUND_DECK_RULES.sections.battlefields.target ? 'warning' : 'error',
      code: 'battlefield_count',
      message: `Battlefields: ${battlefieldTotal} (need exactly ${RIFTBOUND_DECK_RULES.sections.battlefields.target}).`,
    });
  }

  for (const { card, count } of input.battlefields) {
    if (count > RIFTBOUND_DECK_RULES.copyLimits.battlefieldPerName) {
      messages.push({
        type: 'error',
        code: 'battlefield_unique',
        message: `Battlefield "${card.name}" appears ${count} times (max 1 of each name).`,
      });
    }
  }

  if (sideboardTotal > RIFTBOUND_DECK_RULES.sections.sideboard.target) {
    messages.push({
      type: 'error',
      code: 'sideboard_count',
      message: `Sideboard has ${sideboardTotal} cards (max ${RIFTBOUND_DECK_RULES.sections.sideboard.target}).`,
    });
  }

  for (const { card } of input.sideboard) {
    if (card.isSignature) {
      messages.push({
        type: 'error',
        code: 'signature_sideboard',
        message: `Signature card "${card.name}" cannot be in the sideboard.`,
      });
    }
  }

  if (messages.length === 0) {
    messages.push({ type: 'valid', code: 'deck_valid', message: 'Deck is valid!' });
  }

  return messages;
}

export function deckValidationHasErrors(messages: DeckValidationMessage[]): boolean {
  return messages.some((message) => message.type === 'error');
}

export function deckValidationIsValid(messages: DeckValidationMessage[]): boolean {
  return messages.some((message) => message.type === 'valid');
}

/** Rune card name for a domain color (e.g. Fury → "Fury Rune"). */
export function runeNameForDomain(domain: string): string {
  return `${domain} Rune`;
}

/** Legend domains used for the 12-rune split (first two identity colors). */
export function legendRuneDomains(legend: Pick<DeckCardInput, 'colors'>): [string, string] {
  const [first, second] = legend.colors;
  return [first ?? 'Unknown', second ?? first ?? 'Unknown'];
}
