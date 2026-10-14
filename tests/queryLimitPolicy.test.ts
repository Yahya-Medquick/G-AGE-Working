import { describe, expect, it } from 'vitest';
import { getQueryLimitDenial } from '../src/utils/queryLimitPolicy';

const limits = { guestLifetime: 5, deviceDaily: 200, freeDaily: 25 };

describe('query limit policy', () => {
  it('allows free account query 25 and blocks query 26', () => {
    expect(getQueryLimitDenial('free', { guestLifetimeCount: 0, deviceCount: 24, accountCount: 24 }, limits)).toBeNull();
    expect(getQueryLimitDenial('free', { guestLifetimeCount: 0, deviceCount: 25, accountCount: 25 }, limits)).toBe('account');
  });

  it('allows guest query 5 and blocks query 6', () => {
    expect(getQueryLimitDenial('guest', { guestLifetimeCount: 4, deviceCount: 4, accountCount: 0 }, limits)).toBeNull();
    expect(getQueryLimitDenial('guest', { guestLifetimeCount: 5, deviceCount: 5, accountCount: 0 }, limits)).toBe('guest_lifetime');
  });

  it('never blocks paid users', () => {
    expect(getQueryLimitDenial('paid', { guestLifetimeCount: 10, deviceCount: 500, accountCount: 500 }, limits)).toBeNull();
  });
});