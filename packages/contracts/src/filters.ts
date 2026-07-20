import { z } from 'zod';

const FilterCount = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number().int(),
});

const SetFilter = FilterCount.extend({
  code: z.string().optional(),
  /** Expanded collectible printing count for the set (from upstream probe). */
  printCount: z.number().int().optional(),
  /** Collectible foil printings in the set (foil_only + explicit foil siblings). */
  foilPrintCount: z.number().int().optional(),
});

export const FilterSnapshot = z.object({
  colors: z.array(FilterCount.extend({ imageUrl: z.string().optional() })),
  sets: z.array(SetFilter),
  types: z.array(FilterCount),
  supertypes: z.array(FilterCount),
  rarities: z.array(FilterCount),
  variants: z.array(FilterCount),
});

export const FiltersResponse = z.object({
  data: FilterSnapshot,
  meta: z.object({
    cachedAt: z.string().datetime(),
    catalogHash: z.string(),
    /** Changes when Cardmarket price sync updates local prices — invalidates catalog index cache. */
    pricesCatalogHash: z.string(),
    variantCount: z.number().int().nonnegative(),
  }),
});

export type FilterSnapshot = z.infer<typeof FilterSnapshot>;
