import { describe, expect, test } from 'bun:test';
import {
  isSlashShortcutTextChange,
  resolveSlashSearchAction,
  shouldFocusSearchOnSlashKey,
} from '@/utils/webSlashFocus';

describe('resolveSlashSearchAction', () => {
  test('focuses when slash is pressed outside editables', () => {
    expect(
      resolveSlashSearchAction(
        { key: '/', metaKey: false, ctrlKey: false, altKey: false },
        false
      )
    ).toBe('focus');
  });

  test('clears when search is already focused', () => {
    expect(
      resolveSlashSearchAction(
        {
          key: '/',
          metaKey: false,
          ctrlKey: false,
          altKey: false,
          target: { tagName: 'INPUT' },
        },
        true
      )
    ).toBe('clear');
  });

  test('ignores other fields and modifiers', () => {
    expect(
      resolveSlashSearchAction(
        {
          key: '/',
          metaKey: false,
          ctrlKey: false,
          altKey: false,
          target: { tagName: 'TEXTAREA' },
        },
        false
      )
    ).toBe(null);
    expect(
      resolveSlashSearchAction(
        { key: '/', metaKey: true, ctrlKey: false, altKey: false },
        false
      )
    ).toBe(null);
  });
});

describe('isSlashShortcutTextChange', () => {
  test('treats trailing slash after a query as a clear shortcut', () => {
    expect(isSlashShortcutTextChange('ahri/')).toBe(true);
    expect(isSlashShortcutTextChange('/')).toBe(true);
  });

  test('allows normal queries without a slash', () => {
    expect(isSlashShortcutTextChange('ahri')).toBe(false);
    expect(isSlashShortcutTextChange('OGN-015')).toBe(false);
    expect(isSlashShortcutTextChange('')).toBe(false);
  });
});

describe('shouldFocusSearchOnSlashKey', () => {
  test('accepts bare slash outside fields', () => {
    expect(
      shouldFocusSearchOnSlashKey({
        key: '/',
        metaKey: false,
        ctrlKey: false,
        altKey: false,
      })
    ).toBe(true);
  });

  test('skips when typing in form fields', () => {
    expect(
      shouldFocusSearchOnSlashKey({
        key: '/',
        metaKey: false,
        ctrlKey: false,
        altKey: false,
        target: { tagName: 'INPUT' },
      })
    ).toBe(false);
  });
});
