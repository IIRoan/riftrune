import type { CardListItem } from '@riftbound/contracts';
import { getCardPrintings, isFoilVariant } from '@/utils/variants';
import {
  fetchRemoteCollection,
  remoteAddToCollection,
  remoteDeleteFromCollection,
  remoteSetCollectionQuantity,
} from '@/services/remoteCollectionService';

export interface CollectionEntry {
  variantNumber: string;
  name: string;
  imageUrl: string;
  setCode: string;
  rarity: string;
  type?: string;
  variantLabel: string;
  isFoil: boolean;
  quantity: number;
  condition?: string;
  language?: string;
  addedAt: number;
  updatedAt: number;
}

function toEntry(item: Awaited<ReturnType<typeof fetchRemoteCollection>>[number]): CollectionEntry {
  return {
    variantNumber: item.variantNumber,
    name: item.name,
    imageUrl: item.imageUrl,
    setCode: item.setCode,
    rarity: item.rarity,
    type: item.type ?? undefined,
    variantLabel: item.variantLabel,
    isFoil: item.isFoil,
    quantity: item.quantity,
    condition: item.condition,
    language: item.language,
    addedAt: new Date(item.addedAt).getTime(),
    updatedAt: new Date(item.updatedAt).getTime(),
  };
}

export async function getCollection(): Promise<CollectionEntry[]> {
  const remote = await fetchRemoteCollection();
  return remote.map(toEntry).sort((a, b) => b.updatedAt - a.updatedAt);
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

  for (let i = 0; i < quantity; i += 1) {
    await remoteAddToCollection(printing.variantNumber, 1);
  }
}

export async function addDetailToCollection(
  card: {
    name: string;
    type: string;
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
      type: card.type,
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
  if (quantity <= 0) {
    await remoteDeleteFromCollection(variantNumber);
    return;
  }
  await remoteSetCollectionQuantity(variantNumber, quantity);
}

export async function removeFromCollection(variantNumber: string): Promise<void> {
  await remoteDeleteFromCollection(variantNumber);
}

export async function removeManyFromCollection(variantNumbers: string[]): Promise<void> {
  if (variantNumbers.length === 0) return;
  for (const variantNumber of variantNumbers) {
    await remoteDeleteFromCollection(variantNumber);
  }
}

export async function migrateLocalCollectionToRemote(): Promise<void> {
  // No-op: collection is now cloud-only.
  // Kept for backward compatibility with AuthPanel's sign-in flow.
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
