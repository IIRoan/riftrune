import { describe, expect, test } from 'bun:test';
import {
  getSignUpPasswordRequirements,
  signUpPasswordIssues,
} from '@/components/auth/password-requirements';

describe('sign-up password requirements', () => {
  test('requires length, lower, upper, and digit', () => {
    expect(getSignUpPasswordRequirements('').map((item) => item.met)).toEqual([
      false,
      false,
      false,
      false,
    ]);
    expect(signUpPasswordIssues('short')).toEqual([
      'At least 12 characters',
      'One uppercase letter',
      'One number',
    ]);
    expect(signUpPasswordIssues('Password1234')).toEqual([]);
  });

  test('marks each rule independently', () => {
    const longLowerOnly = getSignUpPasswordRequirements('passwordonly');
    expect(longLowerOnly.find((item) => item.id === 'length')?.met).toBe(true);
    expect(longLowerOnly.find((item) => item.id === 'lower')?.met).toBe(true);
    expect(longLowerOnly.find((item) => item.id === 'upper')?.met).toBe(false);
    expect(longLowerOnly.find((item) => item.id === 'digit')?.met).toBe(false);
  });
});
