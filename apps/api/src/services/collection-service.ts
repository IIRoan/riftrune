import { and, eq, inArray, sql } from 'drizzle-orm';
import type { CollectionItem as CollectionItemDto, CardCondition } from '@riftbound/contracts';
import type { Database } from '../db/client.js';
import { cards, collectionItems, sets, variants } from '../db/schema.js';

function isFoilFromVariant(foilMode: string, variantLabel: string): boolean {
  const label = variantLabel.toLowerCase();
  return foilMode !== 'none' || label.includes('foil') || label.includes('showcase');
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export class CollectionService {
  constructor(private readonly db: Database) {}

  async listForUser(userId: string): Promise<{
    items: CollectionItemDto[];
    total: number;
    totalQuantity: number;
  }> {
    const rows = await this.db
      .select({
        id: collectionItems.id,
        variantNumber: collectionItems.variantNumber,
        quantity: collectionItems.quantity,
        condition: collectionItems.condition,
        language: collectionItems.language,
        isFoil: collectionItems.isFoil,
        notes: collectionItems.notes,
        isGraded: collectionItems.isGraded,
        gradeCompany: collectionItems.gradeCompany,
        gradeScore: collectionItems.gradeScore,
        acquiredAt: collectionItems.acquiredAt,
        acquiredPriceCents: collectionItems.acquiredPriceCents,
        addedAt: collectionItems.addedAt,
        updatedAt: collectionItems.updatedAt,
        name: cards.name,
        imageUrl: variants.imageUrl,
        rarity: variants.rarity,
        variantLabel: variants.variantLabel,
        type: cards.type,
        setCode: sets.code,
      })
      .from(collectionItems)
      .innerJoin(variants, eq(collectionItems.variantNumber, variants.variantNumber))
      .innerJoin(cards, eq(variants.cardId, cards.id))
      .innerJoin(sets, eq(variants.setId, sets.id))
      .where(eq(collectionItems.userId, userId))
      .orderBy(sql`${collectionItems.updatedAt} desc`);

    const items: CollectionItemDto[] = rows.map((row) => ({
      id: row.id,
      variantNumber: row.variantNumber,
      quantity: row.quantity,
      condition: row.condition as CardCondition,
      language: row.language,
      isFoil: row.isFoil,
      notes: row.notes,
      isGraded: row.isGraded,
      gradeCompany: row.gradeCompany,
      gradeScore: row.gradeScore,
      acquiredAt: toIso(row.acquiredAt),
      acquiredPriceCents: row.acquiredPriceCents,
      addedAt: row.addedAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      name: row.name,
      imageUrl: row.imageUrl,
      setCode: row.setCode,
      rarity: row.rarity,
      type: row.type,
      variantLabel: row.variantLabel,
    }));

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    return { items, total: items.length, totalQuantity };
  }

  async upsert(
    userId: string,
    input: {
      variantNumber: string;
      quantity: number;
      condition: CardCondition;
      language: string;
      notes?: string | null;
      isGraded?: boolean;
      gradeCompany?: string | null;
      gradeScore?: string | null;
      acquiredAt?: string | null;
      acquiredPriceCents?: number | null;
    }
  ): Promise<CollectionItemDto | null> {
    if (input.quantity <= 0) {
      await this.remove(userId, input.variantNumber, input.condition, input.language);
      return null;
    }

    const [variant] = await this.db
      .select({
        variantNumber: variants.variantNumber,
        foilMode: variants.foilMode,
        variantLabel: variants.variantLabel,
      })
      .from(variants)
      .where(eq(variants.variantNumber, input.variantNumber))
      .limit(1);

    if (!variant) {
      throw new Error(`Variant ${input.variantNumber} not found`);
    }

    const isFoil = isFoilFromVariant(variant.foilMode, variant.variantLabel);
    const acquiredAt = input.acquiredAt ? new Date(input.acquiredAt) : null;

    await this.db
      .insert(collectionItems)
      .values({
        userId,
        variantNumber: input.variantNumber,
        quantity: input.quantity,
        condition: input.condition,
        language: input.language,
        isFoil,
        notes: input.notes ?? null,
        isGraded: input.isGraded ?? false,
        gradeCompany: input.gradeCompany ?? null,
        gradeScore: input.gradeScore ?? null,
        acquiredAt,
        acquiredPriceCents: input.acquiredPriceCents ?? null,
      })
      .onConflictDoUpdate({
        target: [
          collectionItems.userId,
          collectionItems.variantNumber,
          collectionItems.condition,
          collectionItems.language,
        ],
        set: {
          quantity: input.quantity,
          isFoil,
          notes: input.notes ?? null,
          isGraded: input.isGraded ?? false,
          gradeCompany: input.gradeCompany ?? null,
          gradeScore: input.gradeScore ?? null,
          acquiredAt,
          acquiredPriceCents: input.acquiredPriceCents ?? null,
          updatedAt: new Date(),
        },
      });

    const list = await this.listForUser(userId);
    return (
      list.items.find(
        (item) =>
          item.variantNumber === input.variantNumber &&
          item.condition === input.condition &&
          item.language === input.language
      ) ?? null
    );
  }

  async adjustQuantity(
    userId: string,
    variantNumber: string,
    delta: number,
    options?: { condition?: CardCondition; language?: string }
  ): Promise<CollectionItemDto | null> {
    const condition = options?.condition ?? 'near_mint';
    const language = options?.language ?? 'en';

    const [existing] = await this.db
      .select()
      .from(collectionItems)
      .where(
        and(
          eq(collectionItems.userId, userId),
          eq(collectionItems.variantNumber, variantNumber),
          eq(collectionItems.condition, condition),
          eq(collectionItems.language, language)
        )
      )
      .limit(1);

    const nextQty = (existing?.quantity ?? 0) + delta;
    return this.upsert(userId, {
      variantNumber,
      quantity: nextQty,
      condition,
      language,
      notes: existing?.notes ?? null,
      isGraded: existing?.isGraded ?? false,
      gradeCompany: existing?.gradeCompany ?? null,
      gradeScore: existing?.gradeScore ?? null,
      acquiredAt: existing?.acquiredAt?.toISOString() ?? null,
      acquiredPriceCents: existing?.acquiredPriceCents ?? null,
    });
  }

  async remove(
    userId: string,
    variantNumber: string,
    condition = 'near_mint',
    language = 'en'
  ): Promise<void> {
    await this.db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.userId, userId),
          eq(collectionItems.variantNumber, variantNumber),
          eq(collectionItems.condition, condition),
          eq(collectionItems.language, language)
        )
      );
  }

  async removeMany(userId: string, variantNumbers: string[]): Promise<void> {
    if (variantNumbers.length === 0) return;
    await this.db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.userId, userId),
          inArray(collectionItems.variantNumber, variantNumbers)
        )
      );
  }

  async batchSync(
    userId: string,
    items: Array<{
      variantNumber: string;
      quantity: number;
      condition: CardCondition;
      language: string;
    }>
  ): Promise<{ synced: number }> {
    let synced = 0;
    for (const item of items) {
      await this.upsert(userId, item);
      synced += 1;
    }
    return { synced };
  }
}
