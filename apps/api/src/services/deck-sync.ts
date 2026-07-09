import { inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { DeckListItem, StoredDeckPayload } from '@riftbound/contracts';
import {
  DeckCardInput as DeckCardInputSchema,
  DeckEntryInput as DeckEntryInputSchema,
  StoredDeckPayload as StoredDeckPayloadSchema,
  unresolvedDeckVariantNumber,
  type DeckCardInput,
} from '@riftbound/contracts';
import type { RiftruneClient } from '../upstream/riftrune-client.js';
import type { CardCacheService } from './card-cache.js';
import { variants } from '../db/schema.js';
import type { Database } from '../db/client.js';
import { cdnImageUrl, isSafeImageKey } from '../lib/s3.js';

const API_IMAGES_PREFIX = '/api/v1/images/';
const PILTOVER_CDN_HOST = 'cdn.piltoverarchive.com';

const DeckUpstreamDeckId = z.string().min(1);

// These are intentionally minimal: we only validate the fields we need for transformation.
const UpstreamDeckLegend = z.object({
  id: z.string(),
  name: z.string(),
  variantNumber: z.string(),
  tags: z.array(z.string()).optional().default([]),
  colors: z.any().optional(),
  imageUrl: z.any().optional(),
});

const UpstreamDeckCardEntryWithVariantId = z.object({
  cardId: z.string(),
  variantId: z.string(),
  quantity: z.number().int(),
});

const UpstreamDeckCardEntryNoQuantity = z.object({
  cardId: z.string(),
  variantId: z.string(),
});

const UpstreamDeckDetail = z.object({
  id: DeckUpstreamDeckId,
  name: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string(),
  editedAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  legend: UpstreamDeckLegend.optional().nullable(),
  champions: z.array(UpstreamDeckCardEntryWithVariantId).optional().nullable(),
  maindeck: z.array(UpstreamDeckCardEntryWithVariantId).optional().nullable(),
  runes: z.array(UpstreamDeckCardEntryWithVariantId).optional().nullable(),
  battlefields: z.array(UpstreamDeckCardEntryNoQuantity).optional().nullable(),
  sideboard: z.array(UpstreamDeckCardEntryWithVariantId).optional().nullable(),
});

const UpstreamDeckListResponse = z.object({
  data: z.array(
    z.object({
      id: DeckUpstreamDeckId,
      name: z.string(),
      description: z.string().nullable().optional(),
      createdAt: z.string(),
      editedAt: z.string().optional().nullable(),
      updatedAt: z.string().optional().nullable(),
      legend: UpstreamDeckLegend.optional().nullable(),
    })
  ),
});

function parseMs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

function isSignatureVariant(rarity: string, variantType: string): boolean {
  const combined = `${rarity} ${variantType}`.toLowerCase();
  return combined.includes('signature');
}

function stringImageUrl(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function deckDisplayImageUrl(value: unknown): string | null {
  const imageUrl = stringImageUrl(value);
  if (!imageUrl) return null;

  try {
    const parsed = new URL(imageUrl);
    if (parsed.hostname === PILTOVER_CDN_HOST) return imageUrl;

    if (parsed.pathname.startsWith(API_IMAGES_PREFIX)) {
      const key = parsed.pathname.slice(API_IMAGES_PREFIX.length);
      if (isSafeImageKey(key)) return cdnImageUrl(key);
    }
  } catch {
    // Relative API image paths still get normalized below.
  }

  if (imageUrl.startsWith(API_IMAGES_PREFIX)) {
    const key = imageUrl.slice(API_IMAGES_PREFIX.length);
    if (isSafeImageKey(key)) return cdnImageUrl(key);
  }

  return imageUrl;
}

function legendCardFromUpstreamListEntry(
  legend: z.infer<typeof UpstreamDeckLegend>
): DeckCardInput {
  const setCode = legend.variantNumber.split('-')[0] ?? '';
  return DeckCardInputSchema.parse({
    cardId: legend.id,
    variantNumber: legend.variantNumber,
    name: legend.name,
    type: 'Unit',
    super: 'Champion',
    tags: legend.tags ?? [],
    colors: [],
    energy: 0,
    setCode,
    rarity: 'Rare',
    variantType: 'Standard',
    isSignature: false,
    imageUrl: deckDisplayImageUrl(legend.imageUrl),
  });
}

function placeholderDeckCard(variantId: string, cardId: string): DeckCardInput {
  return DeckCardInputSchema.parse({
    cardId,
    variantNumber: unresolvedDeckVariantNumber(variantId),
    name: 'Card not in catalog',
    type: 'Unit',
    super: null,
    tags: [],
    colors: [],
    energy: 0,
    setCode: '???',
    rarity: 'Unknown',
    variantType: 'Unknown',
    isSignature: false,
    imageUrl: null,
  });
}

async function deckCardFromVariantNumber(cardCache: CardCacheService, variantNumber: string) {
  const { detail } = await cardCache.getByVariantNumber(variantNumber);

  const variant = detail.variants.find((v) => v.variantNumber === variantNumber);
  if (!variant) {
    throw new Error(`Variant ${variantNumber} not found in CardDetail variants`);
  }

  const card = {
    cardId: detail.id,
    variantNumber,
    name: detail.name,
    type: detail.type,
    super: detail.super,
    tags: detail.tags,
    colors: detail.colors.map((c) => c.name),
    energy: detail.energy,
    setCode: variant.variantNumber.split('-')[0] ?? '',
    rarity: variant.rarity,
    variantType: variant.variantType,
    isSignature: isSignatureVariant(variant.rarity, variant.variantType),
    imageUrl: deckDisplayImageUrl(variant.imageUrl),
  } satisfies DeckCardInput;

  return DeckCardInputSchema.parse(card);
}

function toStoredDeckPayload(
  upstream: z.infer<typeof UpstreamDeckDetail>,
  legendCard: DeckCardInput | null,
  championCard: DeckCardInput | null,
  mainDeck: Array<z.infer<typeof DeckEntryInputSchema>>,
  runes: Array<z.infer<typeof DeckEntryInputSchema>>,
  battlefields: Array<z.infer<typeof DeckEntryInputSchema>>,
  sideboard: Array<z.infer<typeof DeckEntryInputSchema>>,
  syncWarnings: string[]
): StoredDeckPayload {
  const createdAt = parseMs(upstream.createdAt);
  const updatedAtFromEdited = parseMs(upstream.editedAt ?? undefined);
  const updatedAtFromUpdated = parseMs(upstream.updatedAt ?? undefined);
  const updatedAt = Math.max(updatedAtFromEdited, updatedAtFromUpdated) || createdAt;

  const payload = {
    id: upstream.id,
    name: upstream.name,
    description: upstream.description ?? undefined,
    createdAt,
    updatedAt,
    legend: legendCard,
    champion: championCard,
    mainDeck,
    runes,
    battlefields,
    sideboard,
    ...(syncWarnings.length > 0 ? { syncWarnings } : {}),
  };

  return StoredDeckPayloadSchema.parse(payload);
}

type UpstreamCardRef = {
  cardId: string;
  variantId: string;
};

async function resolveDeckCardForUpstreamEntry(
  entry: UpstreamCardRef,
  resolved: Map<string, string>,
  getCard: (variantNumber: string) => Promise<DeckCardInput>,
  cardCache: CardCacheService,
  unresolvedVariantIds: Set<string>
): Promise<DeckCardInput> {
  let variantNumber = resolved.get(entry.variantId);
  if (!variantNumber) {
    variantNumber =
      (await cardCache.resolveVariantNumberByUpstreamId(entry.variantId, entry.cardId)) ?? undefined;
    if (variantNumber) resolved.set(entry.variantId, variantNumber);
  }

  if (variantNumber) {
    try {
      return await getCard(variantNumber);
    } catch {
      // Fall through to placeholder when catalog lookup fails.
    }
  }

  unresolvedVariantIds.add(entry.variantId);
  return placeholderDeckCard(entry.variantId, entry.cardId);
}

export class DeckSyncService {
  constructor(
    private readonly db: Database,
    private readonly riftrune: RiftruneClient,
    private readonly cardCache: CardCacheService,
    private readonly deckWriteAuthorizationHeader?: { name: string; value: string }
  ) {}

  async listUpstreamDeckIds(limit = 20): Promise<string[]> {
    const res = await this.riftrune.listDecks({ limit });
    const parsed = UpstreamDeckListResponse.parse(res);
    return parsed.data.map((d) => d.id);
  }

  /** Lightweight imported decks for list views — one upstream list call, no per-deck detail fetches. */
  async listImportedDeckSummaries(options: {
    skipIds: Set<string>;
    q?: string;
    limit?: number;
  }): Promise<DeckListItem[]> {
    const res = await this.riftrune.listDecks({ limit: options.limit ?? 25 });
    const parsed = UpstreamDeckListResponse.parse(res);
    const needle = options.q?.trim().toLowerCase() ?? '';
    const legendByVariantNumber = new Map<string, DeckCardInput>();
    const items: DeckListItem[] = [];

    for (const entry of parsed.data) {
      if (options.skipIds.has(entry.id)) continue;

      const haystack = [
        entry.name,
        entry.description ?? '',
        entry.legend?.name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (needle && !haystack.includes(needle)) continue;

      let legendCard: DeckCardInput | null = null;
      const legendVariantNumber = entry.legend?.variantNumber;
      if (entry.legend && legendVariantNumber) {
        const cached = legendByVariantNumber.get(legendVariantNumber);
        if (cached) {
          legendCard = cached;
        } else {
          try {
            legendCard = await deckCardFromVariantNumber(this.cardCache, legendVariantNumber);
          } catch {
            legendCard = legendCardFromUpstreamListEntry(entry.legend);
          }
          legendByVariantNumber.set(legendVariantNumber, legendCard);
        }
      }

      const createdAt = parseMs(entry.createdAt);
      const updatedAt =
        Math.max(parseMs(entry.editedAt ?? undefined), parseMs(entry.updatedAt ?? undefined)) ||
        createdAt;

      const payload = StoredDeckPayloadSchema.parse({
        id: entry.id,
        name: entry.name,
        description: entry.description ?? undefined,
        createdAt,
        updatedAt,
        legend: legendCard,
        champion: null,
        mainDeck: [],
        runes: [],
        battlefields: [],
        sideboard: [],
      });

      items.push({ ...payload, source: 'imported', readOnly: true });
    }

    return items;
  }

  async getUpstreamDeckDetail(deckId: string): Promise<z.infer<typeof UpstreamDeckDetail>> {
    const res = await this.riftrune.getDeck(deckId);
    return UpstreamDeckDetail.parse(res);
  }

  async transformUpstreamDeckDetailToStoredDeckPayload(
    upstream: z.infer<typeof UpstreamDeckDetail>
  ): Promise<StoredDeckPayload> {
    const variantIds: string[] = [];
    for (const e of upstream.champions ?? []) variantIds.push(e.variantId);
    for (const e of upstream.maindeck ?? []) variantIds.push(e.variantId);
    for (const e of upstream.runes ?? []) variantIds.push(e.variantId);
    for (const e of upstream.battlefields ?? []) variantIds.push(e.variantId);
    for (const e of upstream.sideboard ?? []) variantIds.push(e.variantId);

    const uniqVariantIds = [...new Set(variantIds)];
    const rows = uniqVariantIds.length
      ? await this.db
          .select({ id: variants.id, variantNumber: variants.variantNumber })
          .from(variants)
          .where(inArray(variants.id, uniqVariantIds))
      : [];

    const resolved = new Map<string, string>();
    for (const row of rows) resolved.set(row.id, row.variantNumber);

    const upstreamRefs: UpstreamCardRef[] = [
      ...(upstream.champions ?? []),
      ...(upstream.maindeck ?? []),
      ...(upstream.runes ?? []),
      ...(upstream.battlefields ?? []),
      ...(upstream.sideboard ?? []),
    ];
    await this.cardCache.resolveVariantNumbersFromUpstream(upstreamRefs, resolved);

    const syncWarnings: string[] = [];
    const unresolvedVariantIds = new Set<string>();

    let legendCard: DeckCardInput | null = null;
    if (upstream.legend?.variantNumber) {
      try {
        legendCard = await deckCardFromVariantNumber(this.cardCache, upstream.legend.variantNumber);
      } catch {
        syncWarnings.push('Legend card could not be loaded from the local catalog.');
        legendCard = legendCardFromUpstreamListEntry(upstream.legend);
      }
    }

    const cardByVariantNumber = new Map<string, DeckCardInput>();
    const getCard = async (variantNumber: string): Promise<DeckCardInput> => {
      const existing = cardByVariantNumber.get(variantNumber);
      if (existing) return existing;
      const card = await deckCardFromVariantNumber(this.cardCache, variantNumber);
      cardByVariantNumber.set(variantNumber, card);
      return card;
    };

    const championEntry = upstream.champions?.[0] ?? null;
    const championCard = championEntry
      ? await resolveDeckCardForUpstreamEntry(
          championEntry,
          resolved,
          getCard,
          this.cardCache,
          unresolvedVariantIds
        )
      : null;

    const mapEntryWithQuantity = async (
      entry: z.infer<typeof UpstreamDeckCardEntryWithVariantId>
    ): Promise<z.infer<typeof DeckEntryInputSchema>> => {
      const card = await resolveDeckCardForUpstreamEntry(
        entry,
        resolved,
        getCard,
        this.cardCache,
        unresolvedVariantIds
      );
      return DeckEntryInputSchema.parse({ card, count: entry.quantity });
    };

    const mainDeck = await Promise.all((upstream.maindeck ?? []).map(mapEntryWithQuantity));
    const runes = await Promise.all((upstream.runes ?? []).map(mapEntryWithQuantity));

    const battlefields = await Promise.all(
      (upstream.battlefields ?? []).map(async (entry: z.infer<typeof UpstreamDeckCardEntryNoQuantity>) => {
        const card = await resolveDeckCardForUpstreamEntry(
          entry,
          resolved,
          getCard,
          this.cardCache,
          unresolvedVariantIds
        );
        return DeckEntryInputSchema.parse({ card, count: 1 });
      })
    );

    const sideboard = await Promise.all((upstream.sideboard ?? []).map(mapEntryWithQuantity));

    if (unresolvedVariantIds.size > 0) {
      syncWarnings.push(
        `${unresolvedVariantIds.size} card variant${unresolvedVariantIds.size === 1 ? '' : 's'} not in the local catalog yet. Counts match Piltover Archive; sync the card catalog for names and images.`
      );
    }

    const uniqueWarnings = [...new Set(syncWarnings)];

    return toStoredDeckPayload(
      upstream,
      legendCard,
      championCard,
      mainDeck,
      runes,
      battlefields,
      sideboard,
      uniqueWarnings
    );
  }

  async listStoredDeckPayloads(limit = 20): Promise<StoredDeckPayload[]> {
    const ids = await this.listUpstreamDeckIds(limit);

    // Keep concurrency low to avoid hammering upstream + card cache.
    const results: StoredDeckPayload[] = [];
    for (const id of ids) {
      const detail = await this.getUpstreamDeckDetail(id);
      results.push(await this.transformUpstreamDeckDetailToStoredDeckPayload(detail));
    }
    return results;
  }

  async getStoredDeckPayload(deckId: string): Promise<StoredDeckPayload | null> {
    try {
      const detail = await this.getUpstreamDeckDetail(deckId);
      return await this.transformUpstreamDeckDetailToStoredDeckPayload(detail);
    } catch (err) {
      // Treat upstream not found or missing variant mappings as "not available".
      return null;
    }
  }

  async upsertUpstreamDeck(deck: StoredDeckPayload): Promise<StoredDeckPayload> {
    // Map our StoredDeckPayload (variantNumber) → upstream expected payload (variantId).
    const variantNumbers: string[] = [];
    if (deck.legend?.variantNumber) variantNumbers.push(deck.legend.variantNumber);
    if (deck.champion?.variantNumber) variantNumbers.push(deck.champion.variantNumber);
    for (const entry of deck.mainDeck) variantNumbers.push(entry.card.variantNumber);
    for (const entry of deck.runes) variantNumbers.push(entry.card.variantNumber);
    for (const entry of deck.battlefields) variantNumbers.push(entry.card.variantNumber);
    for (const entry of deck.sideboard) variantNumbers.push(entry.card.variantNumber);

    const uniqVariantNumbers = [...new Set(variantNumbers)];
    const rows = uniqVariantNumbers.length
      ? await this.db
          .select({ variantNumber: variants.variantNumber, id: variants.id })
          .from(variants)
          .where(inArray(variants.variantNumber, uniqVariantNumbers))
      : [];

    const variantIdByVariantNumber = new Map<string, string>();
    for (const row of rows) variantIdByVariantNumber.set(row.variantNumber, row.id);

    for (const vn of uniqVariantNumbers) {
      if (!variantIdByVariantNumber.has(vn)) {
        throw new Error(`Missing variantId mapping for variantNumber=${vn}`);
      }
    }

    const upstreamTargetId =
      deck.upstreamId ?? (deck.id.startsWith('deck_') ? undefined : deck.id);

    const payload = {
      ...(upstreamTargetId ? { id: upstreamTargetId } : {}),
      name: deck.name,
      description: deck.description ?? '',
      legend: deck.legend
        ? { cardId: deck.legend.cardId, variantId: variantIdByVariantNumber.get(deck.legend.variantNumber)! }
        : null,
      champions: deck.champion
        ? [
            {
              cardId: deck.champion.cardId,
              variantId: variantIdByVariantNumber.get(deck.champion.variantNumber)!,
              quantity: 1,
            },
          ]
        : [],
      maindeck: deck.mainDeck.map((e) => ({
        cardId: e.card.cardId,
        variantId: variantIdByVariantNumber.get(e.card.variantNumber)!,
        quantity: e.count,
      })),
      runes: deck.runes.map((e) => ({
        cardId: e.card.cardId,
        variantId: variantIdByVariantNumber.get(e.card.variantNumber)!,
        quantity: e.count,
      })),
      battlefields: deck.battlefields.map((e) => ({
        cardId: e.card.cardId,
        variantId: variantIdByVariantNumber.get(e.card.variantNumber)!,
      })),
      sideboard: deck.sideboard.map((e) => ({
        cardId: e.card.cardId,
        variantId: variantIdByVariantNumber.get(e.card.variantNumber)!,
        quantity: e.count,
      })),
    };

    const extraHeaders = this.deckWriteAuthorizationHeader
      ? { [this.deckWriteAuthorizationHeader.name]: this.deckWriteAuthorizationHeader.value }
      : undefined;

    const res = await this.riftrune.createOrUpsertDeck(payload, extraHeaders);

    // If the upstream returns the full deck detail, we can transform it. Otherwise,
    // fall back to returning our own deck payload.
    try {
      const parsed = UpstreamDeckDetail.parse(res);
      return await this.transformUpstreamDeckDetailToStoredDeckPayload(parsed);
    } catch {
      return deck;
    }
  }

  async deleteUpstreamDeck(deckId: string): Promise<void> {
    const extraHeaders = this.deckWriteAuthorizationHeader
      ? { [this.deckWriteAuthorizationHeader.name]: this.deckWriteAuthorizationHeader.value }
      : undefined;
    await this.riftrune.deleteDeck(deckId, extraHeaders);
  }
}
