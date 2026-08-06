import type { CollectionEntry } from '@/services/collectionService';
import { mapFilter } from '@/lib/iteration';

export function computeTypeStats(
  collection: CollectionEntry[],
  apiTypes: { name: string; count: number }[]
) {
  const namesByType = new Map<string, Set<string>>();
  for (const entry of collection) {
    if (!entry.type || entry.quantity <= 0) continue;
    const names = namesByType.get(entry.type) ?? new Set<string>();
    names.add(entry.name);
    namesByType.set(entry.type, names);
  }

  return mapFilter(
    apiTypes,
    (t) => t.name !== 'Card',
    (t) => ({
      name: t.name,
      owned: namesByType.get(t.name)?.size ?? 0,
      total: t.count,
    })
  );
}
