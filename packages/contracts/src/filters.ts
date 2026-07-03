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
    variantCount: z.number().int().nonnegative(),
  }),
});

export type FilterSnapshot = z.infer<typeof FilterSnapshot>;
