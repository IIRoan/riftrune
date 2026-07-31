import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { hydrateCatalogIndex } from '@/hooks/useCatalogIndex';
import { useCollectionLiveSync } from '@/hooks/useCollectionLiveSync';
import { prefetchCatalogFilters } from '@/hooks/useFiltersData';
import { prefetchCatalogMeta } from '@/services/catalogMetaService';

/** Warm catalog disk cache + meta hashes before tabs mount. */
export function CatalogBootstrap() {
  const queryClient = useQueryClient();
  useCollectionLiveSync(true);

  useEffect(() => {
    void hydrateCatalogIndex(queryClient);
    void prefetchCatalogMeta(queryClient);
    void prefetchCatalogFilters(queryClient);
  }, [queryClient]);

  return null;
}
