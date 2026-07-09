import { describe, expect, test } from 'bun:test';
import { CollectionService } from '../../src/services/collection-service.js';
import type { Database } from '../../src/db/client.js';

function createCollectionHarness(rows: Array<{ variantNumber: string; quantity: number }>) {
  const db = {
    select: () => ({
      from: () => ({
        where: async () => rows,
      }),
    }),
  } as unknown as Database;

  const service = new CollectionService(
    db,
    {} as never,
    {} as never,
    {} as never
  );

  return service;
}

describe('CollectionService.quantitiesForVariants', () => {
  test('returns zero for missing variants and deduplicates input', async () => {
    const service = createCollectionHarness([{ variantNumber: 'OGN-001', quantity: 3 }]);

    const result = await service.quantitiesForVariants('user-1', [
      'OGN-001',
      'OGN-001',
      'OGN-999',
    ]);

    expect(result).toEqual([
      { variantNumber: 'OGN-001', quantity: 3 },
      { variantNumber: 'OGN-999', quantity: 0 },
    ]);
  });

  test('returns an empty array for no variant numbers', async () => {
    const service = createCollectionHarness([]);

    expect(await service.quantitiesForVariants('user-1', [])).toEqual([]);
  });
});
