export type DeckSectionKey =
  | 'legend'
  | 'champion'
  | 'mainDeck'
  | 'runes'
  | 'battlefields'
  | 'sideboard';

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
}

export interface DeckEntry {
  card: DeckCard;
  count: number;
}

export type DeckSectionMap = Record<Exclude<DeckSectionKey, 'legend' | 'champion'>, Map<string, DeckEntry>>;

export interface DeckState {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  legend: DeckCard | null;
  champion: DeckCard | null;
  mainDeck: Map<string, DeckEntry>;
  runes: Map<string, DeckEntry>;
  battlefields: Map<string, DeckEntry>;
  sideboard: Map<string, DeckEntry>;
  addToSideboard: boolean;
}

export interface SerializedDeckEntry {
  card: DeckCard;
  count: number;
}

export interface SerializedDeck {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  legend: DeckCard | null;
  champion: DeckCard | null;
  mainDeck: SerializedDeckEntry[];
  runes: SerializedDeckEntry[];
  battlefields: SerializedDeckEntry[];
  sideboard: SerializedDeckEntry[];
}

export type ValidationSeverity = 'error' | 'warning' | 'valid';

export interface DeckValidationMessage {
  type: ValidationSeverity;
  message: string;
}

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