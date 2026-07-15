import { describe, expect, test } from 'bun:test';
import { applyFilterPopoverOpenChange } from '@/lib/filter-popover-state';

describe('applyFilterPopoverOpenChange', () => {
  test('opens the requested segment', () => {
    let current: string | null = null;
    applyFilterPopoverOpenChange('colors', true, (next) => {
      current = typeof next === 'function' ? next(current) : next;
    });
    expect(current).toBe('colors');
  });

  test('switches directly from one open segment to another', () => {
    let current: string | null = 'colors';
    applyFilterPopoverOpenChange('sets', true, (next) => {
      current = typeof next === 'function' ? next(current) : next;
    });
    expect(current).toBe('sets');
  });

  test('closes only the active segment', () => {
    let current: string | null = 'sets';
    applyFilterPopoverOpenChange('colors', false, (next) => {
      current = typeof next === 'function' ? next(current) : next;
    });
    expect(current).toBe('sets');
  });

  test('clears state when the active segment closes', () => {
    let current: string | null = 'sets';
    applyFilterPopoverOpenChange('sets', false, (next) => {
      current = typeof next === 'function' ? next(current) : next;
    });
    expect(current).toBeNull();
  });
});
