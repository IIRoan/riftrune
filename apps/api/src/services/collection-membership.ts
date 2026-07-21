import { eq } from 'drizzle-orm';
import type { Database } from '../db/client.js';
import { collectionMembers, collections } from '../db/schema.js';

type DbExecutor = Pick<Database, 'select' | 'insert' | 'transaction'>;

/**
 * Resolve (and lazily create) the active collection membership for a user.
 * Every authenticated user has exactly one membership row.
 */
export async function ensureCollectionMembership(
  db: DbExecutor,
  userId: string
): Promise<{ collectionId: string; role: string }> {
  const [existing] = await db
    .select({
      collectionId: collectionMembers.collectionId,
      role: collectionMembers.role,
    })
    .from(collectionMembers)
    .where(eq(collectionMembers.userId, userId))
    .limit(1);

  if (existing) {
    return { collectionId: existing.collectionId, role: existing.role };
  }

  const create = async (executor: Pick<Database, 'select' | 'insert'>) => {
    const [again] = await executor
      .select({
        collectionId: collectionMembers.collectionId,
        role: collectionMembers.role,
      })
      .from(collectionMembers)
      .where(eq(collectionMembers.userId, userId))
      .limit(1);
    if (again) {
      return { collectionId: again.collectionId, role: again.role };
    }

    const [created] = await executor
      .insert(collections)
      .values({})
      .returning({ id: collections.id });
    if (!created) {
      throw new Error('Failed to create collection');
    }

    await executor.insert(collectionMembers).values({
      collectionId: created.id,
      userId,
      role: 'owner',
    });

    return { collectionId: created.id, role: 'owner' };
  };

  return db.transaction(async (tx) => create(tx));
}
