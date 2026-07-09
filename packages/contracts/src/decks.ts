import { z } from 'zod';
import { DeckCardInput, DeckEntryInput } from './deck-rules.js';

export const StoredDeckPayload = z.object({
  id: z.string().min(1),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
  legend: DeckCardInput.nullable(),
  champion: DeckCardInput.nullable(),
  mainDeck: z.array(DeckEntryInput),
  runes: z.array(DeckEntryInput),
  battlefields: z.array(DeckEntryInput),
  sideboard: z.array(DeckEntryInput),
  /** Piltover Archive deck id after a successful upstream sync. */
  upstreamId: z.string().optional(),
  /** Warnings from upstream import when cards could not be fully resolved. */
  syncWarnings: z.array(z.string()).optional(),
});

export const DeckSource = z.enum(['owned', 'imported']);

export const DeckListSource = z.enum(['owned', 'imported', 'all']);

export const DeckListItem = StoredDeckPayload.extend({
  source: DeckSource,
  readOnly: z.boolean(),
});

export const DeckUpsertRequest = StoredDeckPayload;

export const DeckSummary = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const DeckListResponse = z.object({
  data: z.array(DeckListItem),
  meta: z.object({
    total: z.number().int(),
    owned: z.number().int(),
    imported: z.number().int(),
  }),
});

export const DeckDetailResponse = z.object({
  data: DeckListItem,
});

export type StoredDeckPayload = z.infer<typeof StoredDeckPayload>;
export type DeckListItem = z.infer<typeof DeckListItem>;
export type DeckSource = z.infer<typeof DeckSource>;
export type DeckListSource = z.infer<typeof DeckListSource>;
export type DeckUpsertRequest = z.infer<typeof DeckUpsertRequest>;
export type DeckSummary = z.infer<typeof DeckSummary>;
