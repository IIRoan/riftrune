import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { CARD_RULE_FIXTURES } from '@/lib/card-fixtures';
import { groupInlineSegments, groupParagraphSegments, parseCardRules, summarizeRulesRender } from '@/lib/card-rules';
import { getKeywordBadgeClassName, parseKeywordToken } from '@/lib/card-keywords';

describe('parseKeywordToken', () => {
  test('parses plain keyword', () => {
    expect(parseKeywordToken('ACCELERATE')).toEqual({
      base: 'ACCELERATE',
      display: 'ACCELERATE',
    });
  });

  test('parses keyword with numeric suffix', () => {
    expect(parseKeywordToken('ASSAULT 2')).toEqual({
      base: 'ASSAULT',
      display: 'ASSAULT 2',
    });
  });

  test('returns null for non-keywords', () => {
    expect(parseKeywordToken('Fury')).toBeNull();
    expect(parseKeywordToken('1')).toBeNull();
  });
});

describe('parseCardRules', () => {
  test('classifies Jinx card bracket tokens', () => {
    const parts = parseCardRules(
      '[ACCELERATE] (You may pay [1] [Fury] as an additional cost to have me enter ready.)\n[ASSAULT 2] (+2 [Might] while I\'m an attacker.)'
    );

    expect(parts.filter((part) => part.type !== 'text')).toEqual([
      { type: 'keyword', value: 'ACCELERATE', keywordBase: 'ACCELERATE', display: 'ACCELERATE' },
      { type: 'energy', value: '1' },
      { type: 'domain', value: 'Fury' },
      { type: 'keyword', value: 'ASSAULT 2', keywordBase: 'ASSAULT', display: 'ASSAULT 2' },
      { type: 'might', value: 'Might' },
    ]);
  });

  test('classifies equip and order tokens', () => {
    const parts = parseCardRules('[EQUIP] — [Order], Kill a friendly unit');

    expect(parts.filter((part) => part.type !== 'text')).toEqual([
      { type: 'keyword', value: 'EQUIP', keywordBase: 'EQUIP', display: 'EQUIP' },
      { type: 'domain', value: 'Order' },
    ]);
  });

  test('preserves surrounding text', () => {
    const parts = parseCardRules('When you play me, discard 2.');
    expect(parts).toEqual([{ type: 'text', value: 'When you play me, discard 2.' }]);
  });

  test('classifies uppercase might token', () => {
    const parts = parseCardRules('(+1 [MIGHT] while attacking.)');
    expect(parts.filter((part) => part.type !== 'text')).toEqual([{ type: 'might', value: 'MIGHT' }]);
  });

  test('classifies action keyword regardless of casing', () => {
    const parts = parseCardRules('[Action] (Play on your turn or in showdowns.)');
    expect(parts.filter((part) => part.type !== 'text')).toEqual([
      { type: 'keyword', value: 'Action', keywordBase: 'ACTION', display: 'ACTION' },
    ]);
  });

  test('Ahri uses might shield icons for stat references', () => {
    const parts = parseCardRules(CARD_RULE_FIXTURES.ahriNineTailedFox.description);
    expect(parts.filter((part) => part.type !== 'text')).toEqual([
      { type: 'might', value: 'Might' },
      { type: 'might', value: 'Might' },
    ]);
  });

  test('Sunlit Guardian keeps shield keyword separate from might icon', () => {
    const parts = parseCardRules(CARD_RULE_FIXTURES.sunlitGuardian.description);
    expect(parts.filter((part) => part.type !== 'text')).toEqual([
      { type: 'keyword', value: 'Shield', keywordBase: 'SHIELD', display: 'SHIELD' },
      { type: 'might', value: 'Might' },
      { type: 'keyword', value: 'Tank', keywordBase: 'TANK', display: 'TANK' },
    ]);
  });

  test('Azir classifies tap as icon and weaponmaster as keyword', () => {
    const parts = parseCardRules(CARD_RULE_FIXTURES.azirEmperor.description);
    expect(parts.filter((part) => part.type !== 'text')).toEqual([
      { type: 'keyword', value: 'Weaponmaster', keywordBase: 'WEAPONMASTER', display: 'WEAPONMASTER' },
      { type: 'energy', value: '1' },
      { type: 'tap', value: 'Tap' },
      { type: 'might', value: 'Might' },
    ]);
  });
});

describe('groupParagraphSegments', () => {
  test('keeps Ahri might icons in one inline row with surrounding text', () => {
    const parts = parseCardRules(CARD_RULE_FIXTURES.ahriNineTailedFox.description);
    expect(groupParagraphSegments(parts)).toEqual([
      {
        type: 'inline-row',
        parts,
      },
    ]);
  });

  test('keeps Azir cost, tap, and might icons in one inline row', () => {
    const line = CARD_RULE_FIXTURES.azirEmperor.description.split('\n')[1]!;
    const parts = parseCardRules(line);
    expect(groupParagraphSegments(parts)).toEqual([
      {
        type: 'inline-row',
        parts,
      },
    ]);
  });

  test('keeps weaponmaster keyword in a separate text run', () => {
    const line = CARD_RULE_FIXTURES.azirEmperor.description.split('\n')[0]!;
    const parts = parseCardRules(line);
    expect(groupParagraphSegments(parts)).toEqual([
      {
        type: 'text-run',
        parts,
      },
    ]);
  });
});

describe('groupInlineSegments', () => {
  test('keeps action keyword and following text in one run', () => {
    const parts = parseCardRules('[ACTION] (Play on your turn or in showdowns.)');
    expect(groupInlineSegments(parts)).toEqual([
      {
        type: 'text-run',
        parts: [
          {
            type: 'keyword',
            value: 'ACTION',
            keywordBase: 'ACTION',
            display: 'ACTION',
          },
          { type: 'text', value: ' (Play on your turn or in showdowns.)' },
        ],
      },
    ]);
  });

  test('isolates might icon between text runs', () => {
    const parts = parseCardRules('(+1 [Might] while attacking.)');
    expect(groupInlineSegments(parts)).toEqual([
      { type: 'text-run', parts: [{ type: 'text', value: '(+1 ' }] },
      { type: 'might', value: 'Might' },
      { type: 'text-run', parts: [{ type: 'text', value: ' while attacking.)' }] },
    ]);
  });

  test('keeps assault keyword with inline might bonus text grouped before icon', () => {
    const parts = parseCardRules(
      'Give a unit [ASSAULT 3] this turn. (+3 [Might] while it\'s an attacker.)'
    );

    expect(groupInlineSegments(parts)).toEqual([
      {
        type: 'text-run',
        parts: [
          { type: 'text', value: 'Give a unit ' },
          {
            type: 'keyword',
            value: 'ASSAULT 3',
            keywordBase: 'ASSAULT',
            display: 'ASSAULT 3',
          },
          { type: 'text', value: ' this turn. (+3 ' },
        ],
      },
      { type: 'might', value: 'Might' },
      {
        type: 'text-run',
        parts: [{ type: 'text', value: ' while it\'s an attacker.)' }],
      },
    ]);
  });
});

describe('summarizeRulesRender', () => {
  test('Ahri renders two might shield icons inline with text', () => {
    expect(summarizeRulesRender(CARD_RULE_FIXTURES.ahriNineTailedFox.description)).toEqual([
      { kind: 'text' },
      { kind: 'might' },
      { kind: 'text' },
      { kind: 'might' },
      { kind: 'text' },
    ]);
  });

  test('Sunlit Guardian renders shield keyword then might icon', () => {
    expect(summarizeRulesRender(CARD_RULE_FIXTURES.sunlitGuardian.description)).toEqual([
      { kind: 'keyword', base: 'SHIELD' },
      { kind: 'text' },
      { kind: 'might' },
      { kind: 'text' },
      { kind: 'keyword', base: 'TANK' },
      { kind: 'text' },
    ]);
  });

  test('Jinx renders accelerate, energy, fury, assault, and might correctly', () => {
    expect(summarizeRulesRender(CARD_RULE_FIXTURES.jinxDemolitionist.description)).toEqual([
      { kind: 'keyword', base: 'ACCELERATE' },
      { kind: 'text' },
      { kind: 'energy', value: '1' },
      { kind: 'text' },
      { kind: 'domain', name: 'Fury' },
      { kind: 'text' },
      { kind: 'keyword', base: 'ASSAULT' },
      { kind: 'text' },
      { kind: 'might' },
      { kind: 'text' },
      { kind: 'text' },
    ]);
  });

  test('Blade renders equip keyword and order domain icon', () => {
    expect(summarizeRulesRender(CARD_RULE_FIXTURES.bladeOfTheRuinedKing.description)).toEqual([
      { kind: 'keyword', base: 'EQUIP' },
      { kind: 'text' },
      { kind: 'domain', name: 'Order' },
      { kind: 'text' },
    ]);
  });

  test('Azir renders weaponmaster, tap icon, energy, and might inline', () => {
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
});

describe('might icon asset', () => {
  test('bundles the official shield-and-sword might icon', () => {
    const assetPath = join(import.meta.dir, '../assets/icons/might.webp');
    expect(existsSync(assetPath)).toBe(true);
  });

  test('bundles tap and rune icons', () => {
    expect(existsSync(join(import.meta.dir, '../assets/icons/tap.webp'))).toBe(true);
    expect(existsSync(join(import.meta.dir, '../assets/icons/rune.webp'))).toBe(true);
  });
});

describe('getKeywordBadgeClassName', () => {
  test('maps accelerate and action to accelerate styling', () => {
    expect(getKeywordBadgeClassName('ACCELERATE')).toBe('bg-keyword-accelerate');
    expect(getKeywordBadgeClassName('ACTION')).toBe('bg-keyword-accelerate');
  });

  test('maps assault and ganking to assault styling', () => {
    expect(getKeywordBadgeClassName('ASSAULT')).toBe('bg-keyword-assault');
    expect(getKeywordBadgeClassName('GANKING')).toBe('bg-keyword-assault');
  });

  test('maps ability keywords', () => {
    expect(getKeywordBadgeClassName('SHIELD')).toBe('bg-keyword-ability');
    expect(getKeywordBadgeClassName('TANK')).toBe('bg-keyword-ability');
    expect(getKeywordBadgeClassName('WEAPONMASTER')).toBe('bg-keyword-weaponmaster');
  });

  test('falls back to default styling', () => {
    expect(getKeywordBadgeClassName('EQUIP')).toBe('bg-keyword-default');
  });

  test('maps deathknell to its own styling', () => {
    expect(getKeywordBadgeClassName('DEATHKNELL')).toBe('bg-keyword-deathknell');
  });
});
