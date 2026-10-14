export type QueryLimitTier = 'guest' | 'free' | 'paid';
export type QueryLimitDenial = 'guest_lifetime' | 'device' | 'account';

export interface QueryLimitCounts {
  guestLifetimeCount: number;
  deviceCount: number;
  accountCount: number;
}

export interface QueryLimitValues {
  guestLifetime: number;
  deviceDaily: number;
  freeDaily: number;
}

export function getQueryLimitDenial(
  tier: QueryLimitTier,
  counts: QueryLimitCounts,
  limits: QueryLimitValues
): QueryLimitDenial | null {
  if (tier === 'paid') return null;
  if (tier === 'guest' && counts.guestLifetimeCount >= limits.guestLifetime) return 'guest_lifetime';
  if (counts.deviceCount >= limits.deviceDaily) return 'device';
  if (tier === 'free' && counts.accountCount >= limits.freeDaily) return 'account';
  return null;
}