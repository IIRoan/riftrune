import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CardListItem } from '@riftbound/contracts';
import {
  addDetailToCollection,
  addToCollection,
  getCollection,
  getCollectionEntry,
  removeFromCollection,
  removeManyFromCollection,
  updateCollectionQuantity,
  type CollectionEntry,
} from '@/services/collectionService';
import { collectionQueryKeys } from '@/src/api/queryKeys';

export function useCollection() {
  return useQuery({
    queryKey: collectionQueryKeys.all,
    queryFn: getCollection,
    staleTime: 30_000,
  });
}

export function useCollectionEntry(variantNumber: string) {
  return useQuery({
    queryKey: collectionQueryKeys.entry(variantNumber),
    queryFn: () => getCollectionEntry(variantNumber),
    staleTime: 10_000,
  });
}

function invalidateCollection(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: collectionQueryKeys.all });
}

export function useCollectionMutations() {
  const queryClient = useQueryClient();

  const addCard = useMutation({
    mutationFn: (input: { card: CardListItem; variantNumber?: string }) =>
      addToCollection(input.card, { variantNumber: input.variantNumber }),
    onSuccess: (_data, vars) => {
      invalidateCollection(queryClient);
      if (vars.variantNumber) {
        void queryClient.invalidateQueries({
          queryKey: collectionQueryKeys.entry(vars.variantNumber),
        });
      }
    },
  });

  const addFromDetail = useMutation({
    mutationFn: (input: {
      card: Parameters<typeof addDetailToCollection>[0];
      variantNumber: string;
    }) => addDetailToCollection(input.card, input.variantNumber),
    onSuccess: (_data, vars) => {
      invalidateCollection(queryClient);
      void queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.entry(vars.variantNumber),
      });
    },
  });

  const setQuantity = useMutation({
    mutationFn: ({
      variantNumber,
      quantity,
    }: {
      variantNumber: string;
      quantity: number;
    }) => updateCollectionQuantity(variantNumber, quantity),
    onSuccess: (_data, vars) => {
      invalidateCollection(queryClient);
      void queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.entry(vars.variantNumber),
      });
    },
  });

  const removeCard = useMutation({
    mutationFn: (variantNumber: string) => removeFromCollection(variantNumber),
    onSuccess: (_data, variantNumber) => {
      invalidateCollection(queryClient);
      void queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.entry(variantNumber),
      });
    },
  });

  const removeMany = useMutation({
    mutationFn: (variantNumbers: string[]) => removeManyFromCollection(variantNumbers),
    onSuccess: (_data, variantNumbers) => {
      invalidateCollection(queryClient);
      for (const variantNumber of variantNumbers) {
        void queryClient.invalidateQueries({
          queryKey: collectionQueryKeys.entry(variantNumber),
        });
      }
    },
  });

  return { addCard, addFromDetail, setQuantity, removeCard, removeMany };
}

export type { CollectionEntry };
