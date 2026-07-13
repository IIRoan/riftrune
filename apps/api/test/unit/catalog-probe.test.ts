import { describe, expect, mock, test } from 'bun:test';
import type { PaLogicalCard } from '@riftbound/contracts';
import {
  accumulatePrintCounts,
  enrichFilterSnapshotWithPrintCounts,
  probeExpandedCatalog,
  snapshotHasPrintCounts,
} from '../../src/services/catalog-probe.js';
import type { RiftruneClient } from '../../src/upstream/riftrune-client.js';

function logicalCard(id: string, variants: PaLogicalCard['variants']): PaLogicalCard {
  return {
    id,
    name: 'Test',
    type: 'Unit',
    super: null,
    description: '',
    energy: 1,
    might: 1,
    power: 1,
    tags: [],
    colors: [],
    variants,
  } as PaLogicalCard;
}

describe('snapshotHasPrintCounts', () => {
  test('returns true when any set has a positive print count', () => {
    expect(
      snapshotHasPrintCounts({
        colors: [],
        sets: [{ id: '1', name: 'Origins', count: 10, printCount: 0 }],
        types: [],
        supertypes: [],
        rarities: [],
        variants: [],
      })
    ).toBe(false);

    expect(
      snapshotHasPrintCounts({
        colors: [],
        sets: [{ id: '1', name: 'Origins', count: 10, printCount: 3 }],
        types: [],
        supertypes: [],
        rarities: [],
        variants: [],
      })
    ).toBe(true);
  });
});

describe('enrichFilterSnapshotWithPrintCounts', () => {
  test('falls back to logical set count when probe total is missing', () => {
    const enriched = enrichFilterSnapshotWithPrintCounts(
      {
        colors: [],
        sets: [{ id: '1', code: 'SFD', name: 'Spiritforged', count: 302 }],
        types: [],
        supertypes: [],
        rarities: [],
        variants: [],
      },
      {}
    );
    expect(enriched.sets[0]?.printCount).toBe(302);
  });
});

describe('probeExpandedCatalog', () => {
  test('deduplicates logical cards and sums collectible printings', async () => {
    const cardA = logicalCard('card-a', [
      {
        isCollectible: true,
        set: { prefix: 'OGN' },
      },
      {
        isCollectible: true,
        set: { prefix: 'OGN' },
      },
    ] as PaLogicalCard['variants']);
    const cardB = logicalCard('card-b', [
      {
        isCollectible: true,
        set: { prefix: 'SFD' },
      },
    ] as PaLogicalCard['variants']);

    const listCards = mock(async ({ page }: { page?: number }) => {
      if (page === 1) {
        return {
          data: [{ variantNumber: 'OGN-001' }, { variantNumber: 'OGN-001a' }],
          pagination: { hasNext: true },
        };
      }
      return {
        data: [{ variantNumber: 'SFD-001' }],
        pagination: { hasNext: false },
      };
    });
    const getCard = mock(async (variantNumber: string) => {
      if (variantNumber.startsWith('OGN')) return cardA;
      return cardB;
    });

    const riftrune = { listCards, getCard } as unknown as RiftruneClient;
    const result = await probeExpandedCatalog(riftrune);

    expect(result.logicalCardCount).toBe(2);
    expect(result.catalogPrintTotal).toBe(3);
    expect(result.setPrintTotals).toEqual({ OGN: 2, SFD: 1 });
    expect(getCard).toHaveBeenCalledTimes(3);
  });

  test('accumulatePrintCounts skips non-collectible variants', () => {
    const totals = new Map<string, number>();
    const added = accumulatePrintCounts(
      logicalCard('card-a', [
        { isCollectible: false, set: { prefix: 'OGN' } },
      ] as PaLogicalCard['variants']),
      totals
    );
    expect(added).toBe(0);
    expect(totals.size).toBe(0);
  });
});
