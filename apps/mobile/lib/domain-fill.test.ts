import { describe, expect, test } from 'bun:test';
import { domainFillClass, domainInkClass } from '@/lib/domain-fill';

describe('domainFillClass', () => {
  test('maps official domains to token fills', () => {
    expect(domainFillClass('Calm')).toBe('bg-domain-calm');
    expect(domainFillClass('fury')).toBe('bg-domain-fury');
    expect(domainFillClass('Colorless')).toBe('bg-muted-foreground');
    expect(domainInkClass('Order')).toBe('text-background');
  });
});
