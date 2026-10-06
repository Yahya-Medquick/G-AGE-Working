import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { QueryUsageState } from '../types/chat';
import { getOrCreateDeviceId } from '../utils/deviceFingerprint';
import { getAuthHeaders } from '../services/api';

const EMPTY_USAGE: QueryUsageState = {
  isLoggedIn: false,
  tier: 'logged_out',
  count: 0,
  used: 0,
  limit: 0,
  remaining: 0,
  resetInSeconds: 0,
  resetsAt: null,
  proExpiresAt: null,
};

function isPaidTier(tier: QueryUsageState['tier']): boolean {
  return tier === 'paid' || tier === 'pro' || tier === 'unlimited';
}

export function readServerUsage(data: Record<string, unknown>): QueryUsageState {
  const count = data.used ?? data.count;
  const limit = data.limit;
  const remaining = data.remaining;
  const resetInSeconds = data.resetInSeconds;
  if (
    typeof count !== 'number' || !Number.isFinite(count)
    || typeof limit !== 'number' || !Number.isFinite(limit)
    || typeof remaining !== 'number' || !Number.isFinite(remaining)
  ) {
    throw new Error('The usage response is missing valid count, limit, or remaining values.');
  }
  const tier = data.tier === 'paid' || data.tier === 'pro' || data.tier === 'unlimited' || data.tier === 'free' || data.tier === 'logged_out'
    ? data.tier
    : data.loggedIn === true ? 'free' : 'logged_out';
  const resetsAt = typeof data.resetsAt === 'string' && Number.isFinite(Date.parse(data.resetsAt)) ? data.resetsAt : null;
  const proExpiresAt = typeof data.proExpiresAt === 'string' && Number.isFinite(Date.parse(data.proExpiresAt))
    ? data.proExpiresAt
    : null;
  return {
    isLoggedIn: data.loggedIn === true,
    tier,
    count,
    used: count,
    limit,
    remaining,
    resetInSeconds: typeof resetInSeconds === 'number' && Number.isFinite(resetInSeconds) ? resetInSeconds : 0,
    resetsAt,
    proExpiresAt,
  };
}

export function useQueryLimits() {
  const { user } = useUser();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [usage, setUsage] = useState<QueryUsageState>(EMPTY_USAGE);
  const [usageLoaded, setUsageLoaded] = useState(false);
  const [usageError, setUsageError] = useState(false);
  const [pendingTrackedQueries, setPendingTrackedQueries] = useState(0);

  const syncUsage = useCallback(async () => {
    try {
      const response = await fetch('/api/usage', {
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error(`Usage request failed (${response.status}).`);
      if (!data || typeof data !== 'object') throw new Error('The usage response was invalid.');
      const nextUsage = readServerUsage(data as Record<string, unknown>);
      setUsage(nextUsage);
      setUsageLoaded(true);
      setUsageError(false);
      if (!isPaidTier(nextUsage.tier) && nextUsage.remaining <= 0) setIsPaywallOpen(true);
    } catch (error) {
      console.warn('Failed to fetch authoritative query usage:', error);
      setUsageError(true);
    }
  }, []);

  useEffect(() => {
    setUsage(EMPTY_USAGE);
    setUsageLoaded(false);
    setUsageError(false);
    setPendingTrackedQueries(0);
    void syncUsage();

    const interval = setInterval(() => void syncUsage(), 60000);
    const handleFocus = () => void syncUsage();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('query_usage_updated', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('query_usage_updated', handleFocus);
    };
  }, [syncUsage, user?.id, user?.tier]);

  const canExecuteQuery = useCallback((): boolean => {
    if (user?.tier === 'paid' || user?.tier === 'pro' || user?.tier === 'unlimited') return true;
    if (isPaidTier(usage.tier)) return true;
    return !usageLoaded || usage.remaining > pendingTrackedQueries;
  }, [user?.tier, usage.tier, usageLoaded, usage.remaining, pendingTrackedQueries]);

  const recordQueryExecution = useCallback((): boolean => {
    if (!canExecuteQuery()) {
      setIsPaywallOpen(true);
      return false;
    }

    const pendingTracked = usageLoaded && !isPaidTier(usage.tier);
    if (pendingTracked) setPendingTrackedQueries((current) => current + 1);

    fetch('/api/query/track', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ deviceId: getOrCreateDeviceId() }),
    }).then(async (response) => {
      const data: unknown = await response.json();
      if (!response.ok) {
        if (response.status === 429) setIsPaywallOpen(true);
        throw new Error(`Query tracking failed (${response.status}).`);
      }
      if (!data || typeof data !== 'object') throw new Error('The query tracking response was invalid.');
      const tracked = data as Record<string, unknown>;
      if (
        typeof tracked.count === 'number'
        && typeof tracked.limit === 'number'
        && typeof tracked.remaining === 'number'
      ) {
        const { count, limit, remaining } = tracked;
        setUsage((current) => ({
          ...current,
          count,
          used: count,
          limit,
          remaining,
          tier: tracked.tier === 'paid' || tracked.tier === 'pro' || tracked.tier === 'unlimited' ? tracked.tier : current.tier,
        }));
      } else {
        await syncUsage();
      }
    }).catch((error: unknown) => {
      console.warn('Backend query tracking request failed:', error);
      return syncUsage();
    }).finally(() => {
      if (pendingTracked) setPendingTrackedQueries((current) => Math.max(0, current - 1));
    });
    return true;
  }, [canExecuteQuery, syncUsage, usage.tier, usageLoaded]);

  const triggerPaywall = useCallback(() => setIsPaywallOpen(true), []);
  const closePaywall = useCallback(() => setIsPaywallOpen(false), []);

  return {
    usage,
    usageLoaded,
    usageError,
    canExecuteQuery,
    recordQueryExecution,
    refreshUsage: syncUsage,
    isPaywallOpen,
    triggerPaywall,
    closePaywall,
  };
}
