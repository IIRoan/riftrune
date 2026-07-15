import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { hydrateCatalogIndex } from '@/hooks/useCatalogIndex';
import { prefetchCatalogFilters } from '@/hooks/useFiltersData';
import { prefetchCatalogMeta } from '@/services/catalogMetaService';

/** Warm catalog disk cache + meta hashes before tabs mount. */
export function CatalogBootstrap() {
  const queryClient = useQueryClient();

  useEffect(() => {
    void hydrateCatalogIndex(queryClient);
    void prefetchCatalogMeta(queryClient);
    void prefetchCatalogFilters(queryClient);
  }, [queryClient]);

  return null;
}
