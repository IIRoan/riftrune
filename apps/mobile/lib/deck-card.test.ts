import { describe, expect, test } from 'bun:test';
import { cardHasAnyType, cardTypeTokens } from '@riftbound/contracts';
import { cardHasType, isChampionUnit, sectionForCardType } from './deck-card';

describe('card type tokens', () => {
  test('splits dual types like Unit Gear', () => {
    expect(cardTypeTokens('Unit Gear')).toEqual(['unit', 'gear']);
    expect(cardHasAnyType('Unit Gear', ['unit'])).toBe(true);
    expect(cardHasType({ type: 'Unit Gear' }, 'gear')).toBe(true);
    expect(cardHasType({ type: 'Unit Gear' }, 'spell')).toBe(false);
  });

  test('routes Unit Gear to main deck', () => {
    expect(sectionForCardType({ type: 'Unit Gear', super: null })).toBe('mainDeck');
  });

  test('treats Unit Gear with Champion super as champion unit', () => {
    expect(isChampionUnit({ type: 'Unit Gear', super: 'Champion' })).toBe(true);
  });
});
