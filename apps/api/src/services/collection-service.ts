import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  chunkArray,
  COLLECTION_IMPORT_BATCH_SIZE,
  exportRowsToCsv,
  parseCollectionCsvToImportItems,
  type CollectionExportRow,
  type CollectionImportItem,
} from '@riftbound/contracts';
import type { CollectionItem as CollectionItemDto, CardCondition } from '@riftbound/contracts';
import type { Database } from '../db/client.js';
import { cards, collectionItems, sets, variants } from '../db/schema.js';
import { logActionFailure } from '../lib/logger.js';

import type { CardCacheService } from './card-cache.js';
import type { ImageStoreService } from './image-store.js';
import { VariantResolver } from './variant-resolver.js';

function isFoilFromVariant(foilMode: string, variantLabel: string): boolean {
  const label = variantLabel.toLowerCase();
  return foilMode !== 'none' || label.includes('foil') || label.includes('showcase');
}

function toIso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export class CollectionService {
  private readonly variantResolver: VariantResolver;

  constructor(
    private readonly db: Database,
    cardCache: CardCacheService,
    private readonly images: ImageStoreService,
    riftrune: ConstructorParameters<typeof VariantResolver>[2]
  ) {
    this.variantResolver = new VariantResolver(db, cardCache, riftrune);
  }

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
      imageUrl: this.images.rewriteImageUrl(row.imageUrl),
      setCode: row.setCode,
      rarity: row.rarity,
      type: row.type,
      variantLabel: row.variantLabel,
    }));

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    return { items, total: items.length, totalQuantity };
  }

  async quantitiesForVariants(
    userId: string,
    variantNumbers: string[]
  ): Promise<Array<{ variantNumber: string; quantity: number }>> {
    const unique = [...new Set(variantNumbers)];
    if (unique.length === 0) return [];

    const rows = await this.db
      .select({
        variantNumber: collectionItems.variantNumber,
        quantity: collectionItems.quantity,
      })
      .from(collectionItems)
      .where(
        and(eq(collectionItems.userId, userId), inArray(collectionItems.variantNumber, unique))
      );

    const byVariant = new Map(rows.map((row) => [row.variantNumber, row.quantity]));
    return unique.map((variantNumber) => ({
      variantNumber,
      quantity: byVariant.get(variantNumber) ?? 0,
    }));
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
      logActionFailure('collection.upsert.variant_not_found', new Error('Variant not found'), {
        variantNumber: input.variantNumber,
        userId,
      });
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
      notes?: string | null | undefined;
      isGraded?: boolean | undefined;
      gradeCompany?: string | null | undefined;
      gradeScore?: string | null | undefined;
      acquiredAt?: string | null | undefined;
      acquiredPriceCents?: number | null | undefined;
    }>
  ): Promise<{ synced: number }> {
    let synced = 0;
    for (const item of items) {
      await this.upsert(userId, {
        variantNumber: item.variantNumber,
        quantity: item.quantity,
        condition: item.condition,
        language: item.language,
        notes: item.notes ?? null,
        isGraded: item.isGraded ?? false,
        gradeCompany: item.gradeCompany ?? null,
        gradeScore: item.gradeScore ?? null,
        acquiredAt: item.acquiredAt ?? null,
        acquiredPriceCents: item.acquiredPriceCents ?? null,
      });
      synced += 1;
    }
    return { synced };
  }

  async exportForUser(userId: string): Promise<string> {
    const rows = await this.db
      .select({
        variantNumber: collectionItems.variantNumber,
        quantity: collectionItems.quantity,
        condition: collectionItems.condition,
        language: collectionItems.language,
        isFoil: collectionItems.isFoil,
        notes: collectionItems.notes,
        gradeCompany: collectionItems.gradeCompany,
        gradeScore: collectionItems.gradeScore,
        name: cards.name,
        rarity: variants.rarity,
        variantType: variants.variantType,
        variantLabel: variants.variantLabel,
        setName: sets.name,
        setPrefix: sets.code,
      })
      .from(collectionItems)
      .innerJoin(variants, eq(collectionItems.variantNumber, variants.variantNumber))
      .innerJoin(cards, eq(variants.cardId, cards.id))
      .innerJoin(sets, eq(variants.setId, sets.id))
      .where(eq(collectionItems.userId, userId))
      .orderBy(
        sql`${sets.code} asc`,
        sql`${collectionItems.variantNumber} asc`,
        sql`${collectionItems.condition} asc`
      );

    const exportRows: CollectionExportRow[] = rows.map((row) => ({
      variantNumber: row.variantNumber,
      cardName: row.name,
      setName: row.setName,
      setPrefix: row.setPrefix,
      rarity: row.rarity,
      variantType: row.variantType,
      variantLabel: row.variantLabel,
      isFoil: row.isFoil,
      quantity: row.quantity,
      language: row.language,
      condition: row.condition as CardCondition,
      gradeCompany: row.gradeCompany,
      gradeScore: row.gradeScore,
      notes: row.notes,
    }));

    return exportRowsToCsv(exportRows);
  }

  async clearAll(userId: string): Promise<{ removed: number }> {
    const rows = await this.db
      .select({ id: collectionItems.id })
      .from(collectionItems)
      .where(eq(collectionItems.userId, userId));
    if (rows.length === 0) {
      return { removed: 0 };
    }
    await this.db.delete(collectionItems).where(eq(collectionItems.userId, userId));
    return { removed: rows.length };
  }

  async importCsv(
    userId: string,
    csv: string
  ): Promise<{
    imported: number;
    totalCopies: number;
    rowsProcessed: number;
    resolvedFromUpstream: number;
    failedRows: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    const parsed = parseCollectionCsvToImportItems(csv);
    if (parsed.errors.length > 0 && parsed.items.length === 0) {
      return {
        imported: 0,
        totalCopies: 0,
        rowsProcessed: parsed.rowsProcessed,
        resolvedFromUpstream: 0,
        failedRows: parsed.errors.length,
        errors: parsed.errors,
      };
    }

    const result = await this.importItems(userId, parsed.items);
    return {
      ...result,
      rowsProcessed: parsed.rowsProcessed,
      errors: [...parsed.errors, ...result.errors],
      failedRows: parsed.errors.length + result.failedRows,
    };
  }

  async importItems(
    userId: string,
    items: CollectionImportItem[]
  ): Promise<{
    imported: number;
    totalCopies: number;
    resolvedFromUpstream: number;
    failedRows: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    if (items.length === 0) {
      return {
        imported: 0,
        totalCopies: 0,
        resolvedFromUpstream: 0,
        failedRows: 0,
        errors: [],
      };
    }

    const variantNumbers = items.map((item) => item.variantNumber);
    const lookupBefore = await this.db
      .select({ variantNumber: variants.variantNumber })
      .from(variants)
      .where(inArray(variants.variantNumber, [...new Set(variantNumbers)]));
    const knownBefore = new Set(lookupBefore.map((row) => row.variantNumber.toLowerCase()));

    const lookup = await this.variantResolver.loadLookupMap(variantNumbers);
    const resolvedFromUpstream = [...new Set(variantNumbers)].filter(
      (vn) => !knownBefore.has(vn.toLowerCase()) && lookup.has(vn.toLowerCase())
    ).length;

    const validItems: CollectionImportItem[] = [];
    const errors: Array<{ row: number; message: string }> = [];
    let failedRows = 0;

    for (const item of items) {
      const resolved = this.variantResolver.resolveVariantNumber(lookup, item.variantNumber);
      if (!resolved) {
        failedRows += 1;
        errors.push({
          row: 0,
          message: `Could not resolve variant: ${item.variantNumber}`,
        });
        continue;
      }
      validItems.push({ ...item, variantNumber: resolved });
    }

    let imported = 0;
    let totalCopies = 0;
    const chunks = chunkArray(validItems, COLLECTION_IMPORT_BATCH_SIZE);
    for (const chunk of chunks) {
      const result = await this.batchSync(userId, chunk);
      imported += result.synced;
      totalCopies += chunk.reduce((sum, item) => sum + item.quantity, 0);
    }

    return { imported, totalCopies, resolvedFromUpstream, failedRows, errors };
  }
}
