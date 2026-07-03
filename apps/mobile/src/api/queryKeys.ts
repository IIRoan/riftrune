export const cardQueryKeys = {
  all: ['cards'] as const,
  search: (q: string, limit = 40, sortBy = 'name', dir = 'asc') =>
    ['cards', 'search', q.toLowerCase(), limit, sortBy, dir] as const,
  featured: (limit: number) => ['cards', 'featured', limit] as const,
  detail: (variantNumber: string) => ['cards', 'detail', variantNumber] as const,
  health: ['health'] as const,
};

export const collectionQueryKeys = {
  all: ['collection'] as const,
  entry: (variantNumber: string) => ['collection', variantNumber] as const,
};

export const wishlistQueryKeys = {
  all: ['wishlist'] as const,
};
