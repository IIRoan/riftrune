export const cardQueryKeys = {
  all: ['cards'] as const,
  search: (q: string, limit = 40) =>
    ['cards', 'search', q.toLowerCase(), limit] as const,
  detail: (variantNumber: string) => ['cards', 'detail', variantNumber] as const,
  health: ['health'] as const,
};

export const collectionQueryKeys = {
  all: ['collection'] as const,
  entry: (variantNumber: string) => ['collection', variantNumber] as const,
};
