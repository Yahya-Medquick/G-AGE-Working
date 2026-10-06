import { describe, expect, it } from 'vitest';
import { readServerUsage } from './useQueryLimits';

describe('server query usage mapping', () => {
  it('uses the usage values returned by the API without client quota constants', () => {
    expect(readServerUsage({
      loggedIn: true,
      tier: 'free',
      count: 4,
      limit: 17,
      remaining: 13,
      resetInSeconds: 120,
    })).toEqual({
      isLoggedIn: true,
      tier: 'free',
      count: 4,
      limit: 17,
      remaining: 13,
      resetInSeconds: 120,
    });
  });

  it('rejects missing server quota values rather than inventing a fallback', () => {
    expect(() => readServerUsage({ loggedIn: false })).toThrow(/missing valid count, limit, or remaining/);
  });
});
