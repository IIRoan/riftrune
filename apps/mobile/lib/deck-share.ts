import { exportDeckCode } from '@/lib/deck-codes';
import { buildRiftruneDeckUrl } from '@/lib/deck-share-url';
import type { DeckState } from '@/lib/deck-types';

export type DeckShareFormat = 'link' | 'code';

export function resolveDeckSharePayload(
  deck: DeckState,
  format: DeckShareFormat,
  webOrigin?: string | null
): { ok: true; value: string } | { ok: false; error: string } {
  if (format === 'link') {
    return { ok: true, value: buildRiftruneDeckUrl(deck.id, webOrigin) };
  }
  try {
    return { ok: true, value: exportDeckCode(deck) };
  } catch {
    return { ok: false, error: 'This deck cannot be encoded yet — check card codes.' };
  }
}

export function canExportDeckCode(deck: DeckState): boolean {
  try {
    return exportDeckCode(deck).length > 0;
  } catch {
    return false;
  }
}
