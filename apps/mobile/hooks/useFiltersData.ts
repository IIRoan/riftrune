import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/api/client';

export function useFiltersData() {
  return useQuery({
    queryKey: ['filters'],
    queryFn: async () => {
      const res = await api.getFilters();
      return {
        ...res.data,
        variantCount: res.meta.variantCount,
      };
    },
    staleTime: 60_000,
  });
}
