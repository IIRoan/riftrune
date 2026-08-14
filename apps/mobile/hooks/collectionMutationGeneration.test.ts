import { describe, expect, test } from 'bun:test';
import { QueryClient } from '@tanstack/react-query';
import {
  bumpCollectionMutationGeneration,
  getCollectionMutationGeneration,
} from '@/hooks/collectionMutationGeneration';

describe('collectionMutationGeneration', () => {
  test('bumps per QueryClient so stale fetches can detect races', () => {
    const client = new QueryClient();
    expect(getCollectionMutationGeneration(client)).toBe(0);
    expect(bumpCollectionMutationGeneration(client)).toBe(1);
    expect(bumpCollectionMutationGeneration(client)).toBe(2);
    expect(getCollectionMutationGeneration(client)).toBe(2);

    const other = new QueryClient();
    expect(getCollectionMutationGeneration(other)).toBe(0);
  });
});
