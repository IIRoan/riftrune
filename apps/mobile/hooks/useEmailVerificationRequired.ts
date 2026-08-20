import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/api/client';

/** Whether the API requires email verification (Stalwart mail configured). */
export function useEmailVerificationRequired() {
  return useQuery({
    queryKey: ['health', 'emailVerificationRequired'],
    queryFn: async () => {
      const response = await api.health();
      return response.data.emailVerificationRequired;
    },
    staleTime: 60_000,
  });
}
