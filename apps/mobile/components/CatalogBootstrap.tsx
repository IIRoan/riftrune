import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { hydrateCatalogIndex } from '@/hooks/useCatalogIndex';
import { prefetchCatalogMeta } from '@/services/catalogMetaService';

/** Warm catalog disk cache + meta hashes before tabs mount — no full index download. */
export function CatalogBootstrap() {
  const queryClient = useQueryClient();

  useEffect(() => {
    void hydrateCatalogIndex(queryClient);
    void prefetchCatalogMeta(queryClient);
  }, [queryClient]);

  return null;
}
