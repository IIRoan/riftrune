export type DeckSectionKey =
  'legend' | 'champion' | 'mainDeck' | 'runes' | 'battlefields' | 'sideboard';

export interface DeckCard {
  cardId: string;
  variantNumber: string;
  name: string;
  type: string;
  super: string | null;
  tags: string[];
  colors: string[];
  energy: number;
  setCode: string;
  rarity: string;
  variantType: string;
  isSignature: boolean;
  imageUrl?: string | null;
  banEffectiveDate?: string | null;
}

export interface DeckEntry {
  card: DeckCard;
  count: number;
}

export type DeckSectionMap = Record<
  Exclude<DeckSectionKey, 'legend' | 'champion'>,
  Map<string, DeckEntry>
>;

export interface DeckState {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  legend: DeckCard | null;
  champion: DeckCard | null;
  mainDeck: Map<string, DeckEntry>;
  runes: Map<string, DeckEntry>;
  battlefields: Map<string, DeckEntry>;
  sideboard: Map<string, DeckEntry>;
  addToSideboard: boolean;
  /** Present when loaded from the API. */
  source?: 'owned' | 'imported';
  readOnly?: boolean;
  upstreamId?: string;
  /** Warnings from upstream deck sync (missing catalog cards, etc.). */
  syncWarnings?: string[];
  /** Piltover Archive browse metadata (imported public decks). */
  authorName?: string;
  views?: number;
  likes?: number;
  isLegal?: boolean;
  setPrefixes?: string[];
  hasGuide?: boolean;
  hasVideo?: boolean;
  hasMatchups?: boolean;
  videoUrl?: string;
  bannedCardNames?: string[];
}

export interface SerializedDeckEntry {
  card: DeckCard;
  count: number;
}

export interface SerializedDeck {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  legend: DeckCard | null;
  champion: DeckCard | null;
  mainDeck: SerializedDeckEntry[];
  runes: SerializedDeckEntry[];
  battlefields: SerializedDeckEntry[];
  sideboard: SerializedDeckEntry[];
  upstreamId?: string;
  source?: 'owned' | 'imported';
  readOnly?: boolean;
  syncWarnings?: string[];
  authorName?: string;
  views?: number;
  likes?: number;
  isLegal?: boolean;
  setPrefixes?: string[];
  hasGuide?: boolean;
  hasVideo?: boolean;
  hasMatchups?: boolean;
  videoUrl?: string;
  bannedCardNames?: string[];
}

export type { DeckValidationMessage } from '@riftbound/contracts';

export const DECK_SECTIONS: Array<{
  key: DeckSectionKey;
  title: string;
  target: number;
  single?: boolean;
  isMin?: boolean;
  optional?: boolean;
}> = [
  { key: 'legend', title: 'Legend', target: 1, single: true },
  { key: 'champion', title: 'Champion', target: 1, single: true },
  { key: 'mainDeck', title: 'Main', target: 39, isMin: true },
  { key: 'runes', title: 'Runes', target: 12 },
  { key: 'battlefields', title: 'Fields', target: 3 },
  { key: 'sideboard', title: 'Side', target: 8, optional: true },
];
