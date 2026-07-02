import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CardListItem } from '@riftbound/contracts';
import { getCardPrintings, isFoilVariant } from '@/utils/variants';

const COLLECTION_KEY = 'riftbound_collection';

export interface CollectionEntry {
  variantNumber: string;
  name: string;
  imageUrl: string;
  setCode: string;
  rarity: string;
  variantLabel: string;
  isFoil: boolean;
  quantity: number;
  addedAt: number;
  updatedAt: number;
}

export async function getCollection(): Promise<CollectionEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(COLLECTION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<
      Partial<CollectionEntry> & { variantNumber: string }
    >;
    return parsed.map((entry) => {
      const isFoil =
        entry.isFoil ?? isFoilVariant(entry.variantNumber, entry.variantLabel);
      return {
        variantNumber: entry.variantNumber,
        name: entry.name ?? '',
        imageUrl: entry.imageUrl ?? '',
        setCode: entry.setCode ?? '',
        rarity: entry.rarity ?? '',
        variantLabel: entry.variantLabel ?? (isFoil ? 'Foil' : 'Standard'),
        isFoil,
        quantity: entry.quantity ?? 1,
        addedAt: entry.addedAt ?? Date.now(),
        updatedAt: entry.updatedAt ?? Date.now(),
      };
    });
  } catch {
    return [];
  }
}

async function saveCollection(entries: CollectionEntry[]): Promise<void> {
  await AsyncStorage.setItem(COLLECTION_KEY, JSON.stringify(entries));
}

export async function isInCollection(variantNumber: string): Promise<boolean> {
  const entries = await getCollection();
  return entries.some((e) => e.variantNumber === variantNumber);
}

export async function getCollectionEntry(
  variantNumber: string
): Promise<CollectionEntry | null> {
  const entries = await getCollection();
  return entries.find((e) => e.variantNumber === variantNumber) ?? null;
}

export async function addToCollection(
  card: CardListItem,
  options?: { variantNumber?: string; quantity?: number }
): Promise<void> {
  const quantity = options?.quantity ?? 1;
  const variantNumber = options?.variantNumber ?? card.variantNumber;
  const printing =
    getCardPrintings(card).find((p) => p.variantNumber === variantNumber) ??
    getCardPrintings(card)[0];
  if (!printing) return;

  const entries = await getCollection();
  const now = Date.now();
  const existing = entries.find((e) => e.variantNumber === printing.variantNumber);

  if (existing) {
    existing.quantity += quantity;
    existing.updatedAt = now;
    existing.name = card.name;
    existing.imageUrl = card.imageUrl;
    existing.setCode = card.setCode;
    existing.rarity = card.rarity;
    existing.variantLabel = printing.variantLabel;
    existing.isFoil = printing.isFoil;
  } else {
    entries.unshift({
      variantNumber: printing.variantNumber,
      name: card.name,
      imageUrl: card.imageUrl,
      setCode: card.setCode,
      rarity: card.rarity,
      variantLabel: printing.variantLabel,
      isFoil: printing.isFoil,
      quantity,
      addedAt: now,
      updatedAt: now,
    });
  }

  await saveCollection(entries);
}

export async function addDetailToCollection(
  card: {
    name: string;
    variants: Array<{
      variantNumber: string;
      imageUrl: string;
      rarity: string;
      variantLabel: string;
      variantType: string;
      prices: Array<{ market: number | null; low: number | null; isFoil: boolean }>;
    }>;
  },
  variantNumber: string,
  quantity = 1
): Promise<void> {
  const variant = card.variants.find((v) => v.variantNumber === variantNumber);
  if (!variant) return;

  const setCode = variant.variantNumber.split('-')[0] ?? '';
  const isFoil = isFoilVariant(
    variant.variantNumber,
    variant.variantLabel,
    variant.variantType
  );
  const displayPrice =
    variant.prices.find((p) => p.isFoil === isFoil) ?? variant.prices[0];

  await addToCollection(
    {
      cardId: '00000000-0000-0000-0000-000000000000',
      variantNumber: variant.variantNumber,
      name: card.name,
      imageUrl: variant.imageUrl,
      setCode,
      rarity: variant.rarity,
      type: '',
      energy: 0,
      might: 0,
      power: 0,
      colors: [],
      cardmarketId: null,
      priceEur: displayPrice
        ? {
            currency: 'EUR',
            low: displayPrice.low,
            market: displayPrice.market,
            avg7d: null,
            isFoil: displayPrice.isFoil,
          }
        : null,
      printings: [
        {
          variantNumber: variant.variantNumber,
          variantLabel: variant.variantLabel,
          isFoil,
          priceEur: displayPrice
            ? {
                currency: 'EUR',
                low: displayPrice.low,
                market: displayPrice.market,
                avg7d: null,
                isFoil: displayPrice.isFoil,
              }
            : null,
        },
      ],
    },
    { variantNumber: variant.variantNumber, quantity }
  );
}

export async function updateCollectionQuantity(
  variantNumber: string,
  quantity: number
): Promise<void> {
  const entries = await getCollection();
  const entry = entries.find((e) => e.variantNumber === variantNumber);
  if (!entry) return;

  if (quantity <= 0) {
    await removeFromCollection(variantNumber);
    return;
  }

  entry.quantity = quantity;
  entry.updatedAt = Date.now();
  await saveCollection(entries);
}

export async function removeFromCollection(variantNumber: string): Promise<void> {
  const entries = await getCollection();
  await saveCollection(entries.filter((e) => e.variantNumber !== variantNumber));
}

export async function removeManyFromCollection(variantNumbers: string[]): Promise<void> {
  if (variantNumbers.length === 0) return;
  const drop = new Set(variantNumbers);
  const entries = await getCollection();
  await saveCollection(entries.filter((e) => !drop.has(e.variantNumber)));
}

export function filterCollection(
  entries: CollectionEntry[],
  query: string
): CollectionEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.variantNumber.toLowerCase().includes(q) ||
      e.setCode.toLowerCase().includes(q)
  );
}

export function sortCollection(
  entries: CollectionEntry[],
  sortBy: 'recent' | 'name' | 'set'
): CollectionEntry[] {
  const next = [...entries];
  switch (sortBy) {
    case 'name':
      return next.sort((a, b) => a.name.localeCompare(b.name));
    case 'set':
      return next.sort(
        (a, b) => a.setCode.localeCompare(b.setCode) || a.name.localeCompare(b.name)
      );
    default:
      return next.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
