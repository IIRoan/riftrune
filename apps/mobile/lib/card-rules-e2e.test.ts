import { describe, expect, test } from 'bun:test';
import { CARD_RULE_FIXTURES } from '@/lib/card-fixtures';
import { parseCardRules, summarizeRulesRender } from '@/lib/card-rules';

/** Bracket tokens observed across OGN/SFD catalog samples (240 cards). */
const CATALOG_TOKENS = [
  'Might',
  'Rune',
  '1',
  'Mind',
  'Fury',
  'Equip',
  'Tap',
  'Reaction',
  'ACTION',
  'Calm',
  'REACTION',
  '2',
  'Body',
  'Action',
  '0',
  'ACCELERATE',
  'Deflect',
  'Weaponmaster',
  'Hidden',
  'Repeat',
  'HIDDEN',
  'Tank',
  'EQUIP',
  'ASSAULT',
  'LEGION',
  'GANKING',
  'Shield',
  'Accelerate',
  'Quick-Draw',
  'rune',
  'TAP',
  'ASSAULT 2',
  'ADD',
  '4',
  'Temporary',
  'DEATHKNELL',
  'Add',
  'Assault',
  '3',
  'ASSAULT 3',
  '5',
  'MIGHTY',
  'TANK',
  'Deathknell',
  'Vision',
  'VISION',
  'REPEAT',
  'Ganking',
  'Deflect 2',
  'MIGHT',
  'FURY',
  'DEFLECT 2',
  'Shield1',
  'SHIELD 3',
  'DEFLECT',
  'SHIELD',
  'TEMPORARY',
  'tap',
  'action',
  'add',
  'Assault 2',
  'Repeat 2',
  'Shield 5',
  '7',
  'Mighty',
  'WEAPONMASTER',
] as const;

type ExpectedToken =
  | { type: 'energy'; value: string }
  | { type: 'might' }
  | { type: 'tap' }
  | { type: 'rune' }
  | { type: 'domain'; value: string }
  | { type: 'keyword'; keywordBase: string };

function expectedForToken(token: string): ExpectedToken {
  if (/^\d+$/.test(token)) {
    return { type: 'energy', value: token };
  }

  const lower = token.toLowerCase();
  if (lower === 'might') return { type: 'might' };
  if (lower === 'tap') return { type: 'tap' };
  if (lower === 'rune') return { type: 'rune' };

  const domainNames = ['fury', 'calm', 'mind', 'body', 'chaos', 'order'] as const;
  const domain = domainNames.find((name) => name === lower);
  if (domain) {
    return { type: 'domain', value: token };
  }

  const keywordBase = token
    .replace(/(\d+)$/, '')
    .replace(/\s+\d+$/, '')
    .toUpperCase()
    .replace(/^SHIELD1$/, 'SHIELD')
    .replace(/^SHIELD 5$/, 'SHIELD')
    .replace(/^SHIELD 3$/, 'SHIELD');

  if (token === 'Weaponmaster' || token === 'WEAPONMASTER') {
    return { type: 'keyword', keywordBase: 'WEAPONMASTER' };
  }

  if (token === 'Quick-Draw') {
    return { type: 'keyword', keywordBase: 'QUICK-DRAW' };
  }

  if (token === 'Deflect 2' || token === 'DEFLECT 2') {
    return { type: 'keyword', keywordBase: 'DEFLECT' };
  }

  if (token === 'Assault 2' || token === 'ASSAULT 2' || token === 'Assault 2') {
    return { type: 'keyword', keywordBase: 'ASSAULT' };
  }

  if (token === 'ASSAULT 3') {
    return { type: 'keyword', keywordBase: 'ASSAULT' };
  }

  if (token === 'Repeat 2') {
    return { type: 'keyword', keywordBase: 'REPEAT' };
  }

  if (token === 'SHIELD 3' || token === 'Shield 5' || token === 'Shield1') {
    return { type: 'keyword', keywordBase: 'SHIELD' };
  }

  return { type: 'keyword', keywordBase: keywordBase || token.toUpperCase() };
}

describe('catalog bracket token coverage', () => {
  for (const token of CATALOG_TOKENS) {
    test(`classifies [${token}] from catalog`, () => {
      const parts = parseCardRules(`before [${token}] after`);
      const classified = parts[1]!;

      const expected = expectedForToken(token);

      if (expected.type === 'energy') {
        expect(classified).toMatchObject({ type: 'energy', value: expected.value });
        return;
      }

      if (expected.type === 'might') {
        expect(classified).toMatchObject({ type: 'might' });
        return;
      }

      if (expected.type === 'tap') {
        expect(classified).toMatchObject({ type: 'tap' });
        return;
      }

      if (expected.type === 'rune') {
        expect(classified).toMatchObject({ type: 'rune' });
        return;
      }

      if (expected.type === 'domain') {
        expect(classified).toMatchObject({ type: 'domain' });
        return;
      }

      expect(classified.type).toBe('keyword');
      if (classified.type === 'keyword') {
        expect(classified.keywordBase).toBe(expected.keywordBase);
      }
    });
  }
});

describe('fixture end-to-end render summaries', () => {
  test('Azir renders weaponmaster keyword, tap icon, energy, and might icon', () => {
    expect(summarizeRulesRender(CARD_RULE_FIXTURES.azirEmperor.description)).toEqual([
      { kind: 'text' },
      { kind: 'keyword', base: 'WEAPONMASTER' },
      { kind: 'text' },
      { kind: 'energy', value: '1' },
      { kind: 'text' },
      { kind: 'tap' },
      { kind: 'text' },
      { kind: 'might' },
      { kind: 'text' },
    ]);
  });

  test('Ahri keeps -1 modifier in the same text run before the might icon', () => {
    const parts = parseCardRules(CARD_RULE_FIXTURES.ahriNineTailedFox.description);
    const firstMightIndex = parts.findIndex((part) => part.type === 'might');
    const prior = parts[firstMightIndex - 1];
    expect(prior?.type).toBe('text');
    if (prior?.type === 'text') {
      expect(prior.value.endsWith('-1 ')).toBe(true);
    }
  });

  test('real card fixtures contain no unclassified bracket tokens', () => {
    for (const fixture of Object.values(CARD_RULE_FIXTURES)) {
      const parts = parseCardRules(fixture.description);
      for (const part of parts) {
        expect(part.type).not.toBe('stat');
      }
    }
  });
});
