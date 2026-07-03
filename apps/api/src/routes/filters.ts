import { Elysia } from 'elysia';
import type { CatalogMetadataService } from '../services/catalog-metadata.js';

export function createFiltersRoutes(catalogMetadata: CatalogMetadataService) {
  return new Elysia({ prefix: '/api/v1/filters' }).get(
    '/',
    async () => {
      const meta = await catalogMetadata.getFiltersMeta();
      return {
        data: meta.snapshot,
        meta: {
          cachedAt: meta.cachedAt,
          catalogHash: meta.catalogHash,
          variantCount: meta.variantCount,
        },
      };
    },
    { detail: { tags: ['filters'] } }
  );
}
