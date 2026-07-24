import {
  addCardToDeck,
  createEmptyDeck,
  sectionForCardType,
} from '@/lib/deck-card';
import {
  importDeckCode,
  looksLikeDeckCode,
  type VariantResolver,
} from '@/lib/deck-codes';
import type { DeckCard, DeckSectionKey, DeckState } from '@/lib/deck-types';

export type CardResolver = (name: string) => Promise<DeckCard | null> | DeckCard | null;

function formatPAName(name: string): string {
  return name.replace(' - ', ', ');
}

function parsePAName(paName: string): string {
  return paName.replace(', ', ' - ');
}

function* iterateDeck(deck: DeckState): Generator<{
  card: DeckCard;
  count: number;
  section: DeckSectionKey;
}> {
  if (deck.legend) yield { card: deck.legend, count: 1, section: 'legend' };
  if (deck.champion) yield { card: deck.champion, count: 1, section: 'champion' };
  for (const [, entry] of deck.battlefields) {
    yield { card: entry.card, count: entry.count, section: 'battlefields' };
  }
  for (const [, entry] of deck.runes) {
    yield { card: entry.card, count: entry.count, section: 'runes' };
  }
  for (const [, entry] of deck.mainDeck) {
    yield { card: entry.card, count: entry.count, section: 'mainDeck' };
  }
  for (const [, entry] of deck.sideboard) {
    yield { card: entry.card, count: entry.count, section: 'sideboard' };
  }
}

export function exportPiltoverArchive(deck: DeckState): string {
  const sections: string[] = [];

  if (deck.legend) {
    sections.push(`Legend:\n1 ${formatPAName(deck.legend.name)}`);
  }
  if (deck.champion) {
    sections.push(`Champion:\n1 ${formatPAName(deck.champion.name)}`);
  }

  const mainLines = [...deck.mainDeck.values()].map(
    (entry) => `${entry.count} ${formatPAName(entry.card.name)}`
  );
  if (mainLines.length) sections.push(`MainDeck:\n${mainLines.join('\n')}`);

  const battlefieldLines = [...deck.battlefields.values()].map(
    (entry) => `${entry.count} ${formatPAName(entry.card.name)}`
  );
  if (battlefieldLines.length) {
    sections.push(`Battlefields:\n${battlefieldLines.join('\n')}`);
  }

  const runeLines = [...deck.runes.values()].map(
    (entry) => `${entry.count} ${formatPAName(entry.card.name)}`
  );
  if (runeLines.length) sections.push(`Runes:\n${runeLines.join('\n')}`);

  const sideboardLines = [...deck.sideboard.values()].map(
    (entry) => `${entry.count} ${formatPAName(entry.card.name)}`
  );
  if (sideboardLines.length) {
    sections.push(`Sideboard:\n${sideboardLines.join('\n')}`);
  }

  return sections.join('\n\n');
}

export function exportFlatDeckList(deck: DeckState): string {
  const lines: string[] = [];
  for (const { card, count, section } of iterateDeck(deck)) {
    if (section === 'sideboard') continue;
    lines.push(`${count} ${card.name} (${card.variantNumber})`);
  }
  if (deck.sideboard.size > 0) {
    lines.push('');
    lines.push('// Sideboard');
    for (const [, entry] of deck.sideboard) {
      lines.push(`${entry.count} ${entry.card.name} (${entry.card.variantNumber})`);
    }
  }
  return lines.join('\n');
}

export async function importPiltoverArchive(
  text: string,
  resolveCard: CardResolver
): Promise<{ deck: DeckState; unresolved: string[] }> {
  let deck = createEmptyDeck();
  const unresolved: string[] = [];
  let currentSection: DeckSectionKey | null = null;

  const sectionMap: Record<string, DeckSectionKey> = {
    legend: 'legend',
    champion: 'champion',
    maindeck: 'mainDeck',
    battlefields: 'battlefields',
    runes: 'runes',
    sideboard: 'sideboard',
  };

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    const headerMatch = line.match(/^([A-Za-z]+):$/);
    if (headerMatch) {
      currentSection = sectionMap[headerMatch[1].toLowerCase()] ?? null;
      continue;
    }

    if (!currentSection) continue;

    const match = line.match(/^(\d+)\s+(.+)$/);
    if (!match) continue;

    const count = Number.parseInt(match[1], 10);
    const rawName = match[2].trim();
    const card =
      (await resolveCard(parsePAName(rawName))) ?? (await resolveCard(rawName));

    if (!card) {
      unresolved.push(rawName);
      continue;
    }

    if (currentSection === 'legend') {
      deck = { ...deck, legend: card };
    } else if (currentSection === 'champion') {
      deck = { ...deck, champion: card };
    } else {
      deck = addCardToDeck(deck, card, { section: currentSection, count });
    }
  }

  return { deck, unresolved };
}

export async function importFlatDeckList(
  text: string,
  resolveCard: CardResolver
): Promise<{ deck: DeckState; unresolved: string[] }> {
  let deck = createEmptyDeck();
  const unresolved: string[] = [];
  let inSideboard = false;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^\/\/\s*sideboard/i.test(line)) {
      inSideboard = true;
      continue;
    }

    const match = line.match(/^(\d+)\s+(.+?)\s+\(([A-Za-z0-9-]+)\)$/i);
    if (!match) continue;

    const count = Number.parseInt(match[1], 10);
    const name = match[2].trim();
    const card = (await resolveCard(name)) ?? (await resolveCard(parsePAName(name)));

    if (!card) {
      unresolved.push(name);
      continue;
    }

    if (inSideboard) {
      deck = addCardToDeck(deck, card, { section: 'sideboard', count });
    } else {
      const section = sectionForCardType(card);
      if (section === 'legend') {
        deck = { ...deck, legend: card };
      } else if (section === 'champion') {
        deck = { ...deck, champion: card };
      } else {
        deck = addCardToDeck(deck, card, { section, count });
      }
    }
  }

  return { deck, unresolved };
}

export type DeckImportFormat = 'deckcode' | 'piltoverarchive' | 'flat';

export function detectDeckImportFormat(text: string): DeckImportFormat {
  if (looksLikeDeckCode(text)) return 'deckcode';
  if (/^(Legend|Champion|MainDeck|Battlefields|Runes|Sideboard):/im.test(text)) {
    return 'piltoverarchive';
  }
  return 'flat';
}

export async function importDeckText(
  text: string,
  resolveCard: CardResolver,
  resolveVariant?: VariantResolver
): Promise<{ deck: DeckState; unresolved: string[] }> {
  const format = detectDeckImportFormat(text);
  if (format === 'deckcode') {
    if (!resolveVariant) {
      throw new Error('Deck code import requires a variant resolver.');
    }
    return importDeckCode(text, resolveVariant);
  }
  if (format === 'piltoverarchive') {
    return importPiltoverArchive(text, resolveCard);
  }
  return importFlatDeckList(text, resolveCard);
}
