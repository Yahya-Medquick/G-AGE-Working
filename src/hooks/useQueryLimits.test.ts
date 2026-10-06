import { describe, expect, it } from 'vitest';
import { readServerUsage } from './useQueryLimits';

describe('server query usage mapping', () => {
  it('uses the usage values returned by the API without client quota constants', () => {
    expect(readServerUsage({
      loggedIn: true,
      tier: 'free',
      count: 4,
      used: 4,
      limit: 17,
      remaining: 13,
      resetInSeconds: 120,
      resetsAt: '2026-06-02T00:00:00.000Z',
      proExpiresAt: null,
    })).toEqual({
      isLoggedIn: true,
      tier: 'free',
      count: 4,
      used: 4,
      limit: 17,
      remaining: 13,
      resetInSeconds: 120,
      resetsAt: '2026-06-02T00:00:00.000Z',
      proExpiresAt: null,
    });
  });

  it('preserves server tier and Pro expiry details for the plan screen', () => {
    expect(readServerUsage({
      loggedIn: true,
      tier: 'pro',
      count: 7,
      used: 7,
      limit: 22,
      remaining: 15,
      resetInSeconds: 0,
      resetsAt: null,
      proExpiresAt: '2026-07-01T00:00:00.000Z',
    })).toMatchObject({
      tier: 'pro',
      used: 7,
      limit: 22,
      proExpiresAt: '2026-07-01T00:00:00.000Z',
    });
  });

  it('rejects missing server quota values rather than inventing a fallback', () => {
    expect(() => readServerUsage({ loggedIn: false })).toThrow(/missing valid count, limit, or remaining/);
  });
});
