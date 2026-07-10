export const cardQueryKeys = {
  all: ['cards'] as const,
  search: (q: string, limit = 40, sortBy = 'name', dir = 'asc') =>
    ['cards', 'search', q.toLowerCase(), limit, sortBy, dir] as const,
  featured: (limit: number) => ['cards', 'featured', limit] as const,
  browse: () => ['cards', 'browse'] as const,
  searchInfinite: (q: string, sortBy: string, dir: string) =>
    ['cards', 'search', 'infinite', q.toLowerCase(), sortBy, dir] as const,
  detail: (variantNumber: string) => ['cards', 'detail', variantNumber] as const,
  health: ['health'] as const,
};

export const collectionQueryKeys = {
  all: ['collection'] as const,
  entry: (variantNumber: string) => ['collection', variantNumber] as const,
  ownership: (variantNumbers: string[]) =>
    ['collection', 'ownership', [...variantNumbers].sort().join(',')] as const,
  ownershipRoot: ['collection', 'ownership'] as const,
};

export const wishlistQueryKeys = {
  all: ['wishlist'] as const,
};
