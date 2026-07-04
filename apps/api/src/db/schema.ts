import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  smallint,
  jsonb,
  timestamp,
  integer,
  boolean,
  numeric,
  char,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth-schema.js';

export const sets = pgTable('sets', {
  id: uuid('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  releaseDate: text('release_date'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const colors = pgTable('colors', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull().unique(),
  hexCode: text('hex_code'),
  imageUrl: text('image_url'),
});

export const cards = pgTable('cards', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  super: text('super'),
  description: text('description').notNull(),
  energy: smallint('energy').notNull(),
  might: smallint('might').notNull(),
  power: smallint('power').notNull(),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  attachText: text('attach_text'),
  effect: text('effect'),
  mightBonus: smallint('might_bonus').default(0),
  maxCopies: smallint('max_copies'),
  banEffectiveDate: timestamp('ban_effective_date', { withTimezone: true }),
  contentHash: char('content_hash', { length: 64 }).notNull(),
  upstreamRaw: jsonb('upstream_raw').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cardColors = pgTable(
  'card_colors',
  {
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    colorId: uuid('color_id')
      .notNull()
      .references(() => colors.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.cardId, t.colorId] })]
);

export const variants = pgTable(
  'variants',
  {
    id: uuid('id').primaryKey(),
    cardId: uuid('card_id')
      .notNull()
      .references(() => cards.id, { onDelete: 'cascade' }),
    variantNumber: text('variant_number').notNull().unique(),
    rarity: text('rarity').notNull(),
    variantType: text('variant_type').notNull(),
    foilMode: text('foil_mode').notNull(),
    variantTypes: jsonb('variant_types').$type<string[]>().notNull(),
    imageUrl: text('image_url').notNull(),
    flavorText: text('flavor_text'),
    artist: text('artist'),
    releaseDate: text('release_date'),
    variantLabel: text('variant_label').notNull(),
    showInLibrary: boolean('show_in_library').notNull(),
    isCollectible: boolean('is_collectible').notNull(),
    cardmarketId: integer('cardmarket_id'),
    tcgplayerId: integer('tcgplayer_id'),
    parentVariantId: uuid('parent_variant_id'),
    setId: uuid('set_id')
      .notNull()
      .references(() => sets.id),
    contentHash: char('content_hash', { length: 64 }).notNull(),
    upstreamRaw: jsonb('upstream_raw').notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('variants_cardmarket_id_idx').on(t.cardmarketId),
    index('variants_card_id_idx').on(t.cardId),
    index('variants_set_id_idx').on(t.setId),
  ]
);

export const prices = pgTable(
  'prices',
  {
    id: uuid('id').primaryKey(),
    cardmarketId: integer('cardmarket_id').notNull(),
    isFoil: boolean('is_foil').notNull(),
    provider: text('provider').notNull().default('cardmarket'),
    currency: text('currency').notNull().default('EUR'),
    lowPrice: numeric('low_price', { precision: 12, scale: 2 }),
    marketPrice: numeric('market_price', { precision: 12, scale: 2 }),
    midPrice: numeric('mid_price', { precision: 12, scale: 2 }),
    highPrice: numeric('high_price', { precision: 12, scale: 2 }),
    avg1Day: numeric('avg_1_day', { precision: 12, scale: 2 }),
    avg7Day: numeric('avg_7_day', { precision: 12, scale: 2 }),
    avg30Day: numeric('avg_30_day', { precision: 12, scale: 2 }),
    upstreamLastUpdated: timestamp('upstream_last_updated', {
      withTimezone: true,
    }).notNull(),
    contentHash: char('content_hash', { length: 64 }).notNull(),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('prices_cardmarket_foil_idx').on(t.cardmarketId, t.isFoil)]
);

export const priceHistory = pgTable(
  'price_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cardmarketId: integer('cardmarket_id').notNull(),
    isFoil: boolean('is_foil').notNull(),
    provider: text('provider').notNull().default('cardmarket'),
    currency: text('currency').notNull().default('EUR'),
    lowPrice: numeric('low_price', { precision: 12, scale: 2 }),
    marketPrice: numeric('market_price', { precision: 12, scale: 2 }),
    midPrice: numeric('mid_price', { precision: 12, scale: 2 }),
    highPrice: numeric('high_price', { precision: 12, scale: 2 }),
    avg1Day: numeric('avg_1_day', { precision: 12, scale: 2 }),
    avg7Day: numeric('avg_7_day', { precision: 12, scale: 2 }),
    avg30Day: numeric('avg_30_day', { precision: 12, scale: 2 }),
    upstreamLastUpdated: timestamp('upstream_last_updated', {
      withTimezone: true,
    }).notNull(),
    contentHash: char('content_hash', { length: 64 }).notNull(),
    capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('price_history_unique_snapshot_idx').on(
      t.cardmarketId,
      t.isFoil,
      t.upstreamLastUpdated,
      t.contentHash
    ),
    index('price_history_cardmarket_foil_captured_idx').on(
      t.cardmarketId,
      t.isFoil,
      t.capturedAt
    ),
  ]
);

export const syncState = pgTable('sync_state', {
  key: text('key').primaryKey(),
  contentHash: char('content_hash', { length: 64 }).notNull(),
  rowCount: integer('row_count').default(0),
  lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  lastError: text('last_error'),
  status: text('status').notNull().default('idle'),
});

export const filterSnapshots = pgTable('filter_snapshots', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  snapshot: jsonb('snapshot').notNull(),
  contentHash: char('content_hash', { length: 64 }).notNull(),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Standard TCG card condition grades */
export const CARD_CONDITIONS = [
  'mint',
  'near_mint',
  'lightly_played',
  'moderately_played',
  'heavily_played',
  'damaged',
  'unspecified',
] as const;

export type CardCondition = (typeof CARD_CONDITIONS)[number];

/**
 * A user's owned stack of a specific printing.
 * Uniqueness is per user + variant + condition + language so you can track
 * NM vs LP copies of the same card separately.
 */
export const collectionItems = pgTable(
  'collection_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    variantNumber: text('variant_number')
      .notNull()
      .references(() => variants.variantNumber, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull().default(1),
    condition: text('condition').notNull().default('near_mint'),
    language: text('language').notNull().default('en'),
    isFoil: boolean('is_foil').notNull().default(false),
    notes: text('notes'),
    isGraded: boolean('is_graded').notNull().default(false),
    gradeCompany: text('grade_company'),
    gradeScore: text('grade_score'),
    acquiredAt: timestamp('acquired_at', { withTimezone: true }),
    acquiredPriceCents: integer('acquired_price_cents'),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('collection_items_user_variant_condition_lang_idx').on(
      t.userId,
      t.variantNumber,
      t.condition,
      t.language
    ),
    index('collection_items_user_id_idx').on(t.userId),
    index('collection_items_variant_number_idx').on(t.variantNumber),
  ]
);

export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    variantNumber: text('variant_number')
      .notNull()
      .references(() => variants.variantNumber, { onDelete: 'restrict' }),
    priority: smallint('priority').notNull().default(0),
    targetPriceCents: integer('target_price_cents'),
    notes: text('notes'),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('wishlist_items_user_variant_idx').on(t.userId, t.variantNumber),
    index('wishlist_items_user_id_idx').on(t.userId),
  ]
);

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  user: one(user, { fields: [collectionItems.userId], references: [user.id] }),
  variant: one(variants, {
    fields: [collectionItems.variantNumber],
    references: [variants.variantNumber],
  }),
}));

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(user, { fields: [wishlistItems.userId], references: [user.id] }),
  variant: one(variants, {
    fields: [wishlistItems.variantNumber],
    references: [variants.variantNumber],
  }),
}));
