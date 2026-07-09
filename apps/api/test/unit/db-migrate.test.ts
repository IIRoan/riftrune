import { describe, expect, test } from 'bun:test';
import { isTransientDbError } from '../../src/db/migrate.js';

describe('isTransientDbError', () => {
  test('detects ETIMEDOUT on nested causes', () => {
    const root = new Error('Failed query');
    const timeout = Object.assign(new Error('connect timed out'), { code: 'ETIMEDOUT' });
    root.cause = timeout;

    expect(isTransientDbError(root)).toBe(true);
  });

  test('ignores non-transient errors', () => {
    const error = Object.assign(new Error('syntax error'), { code: '42601' });
    expect(isTransientDbError(error)).toBe(false);
  });
});
