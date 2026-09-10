import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { QueryUsageState } from '../types/chat';
import { getOrCreateDeviceId } from '../utils/deviceFingerprint';
import { getAuthHeaders } from '../services/api';

const GUEST_LIFETIME_LIMIT = 5;
const DEVICE_DAILY_LIMIT = 15;
const ACCOUNT_DAILY_LIMIT = 10;

function getUtcMidnightSeconds(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

function getUtcTodayDate(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

export function useQueryLimits() {
  const { user, isLoggedIn } = useUser();
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [usage, setUsage] = useState<QueryUsageState>(() => {
    const deviceId = typeof window !== 'undefined' ? (localStorage.getItem('bifrost_device_id') || 'dev-unknown') : 'dev-unknown';
    const guestCount = typeof window !== 'undefined' ? (parseInt(localStorage.getItem(`bifrost_guest_lifetime_${deviceId}`) || '0', 10) || 0) : 0;
    const remaining = Math.max(0, GUEST_LIFETIME_LIMIT - guestCount);
    return {
      isLoggedIn: false,
      tier: 'logged_out',
      count: guestCount,
      limit: GUEST_LIFETIME_LIMIT,
      remaining,
      resetInSeconds: 0,
    };
  });

  const syncUsage = useCallback(async () => {
    const today = getUtcTodayDate();
    const deviceId = getOrCreateDeviceId();
    const isPaid = user?.tier === 'paid' || user?.tier === 'pro' || user?.tier === 'unlimited';

    if (isPaid) {
      setUsage({
        isLoggedIn: true,
        tier: 'paid',
        count: 0,
        limit: 999999,
        remaining: 999999,
        resetInSeconds: 0,
      });
      return;
    }

    try {
      const res = await fetch('/api/usage', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();

        if (!isLoggedIn) {
          const guestCount = data.guestLifetimeCount ?? data.count ?? 0;
          const guestRemaining = Math.max(0, GUEST_LIFETIME_LIMIT - guestCount);
          localStorage.setItem(`bifrost_guest_lifetime_${deviceId}`, String(guestCount));

          setUsage({
            isLoggedIn: false,
            tier: 'logged_out',
            count: guestCount,
            limit: GUEST_LIFETIME_LIMIT,
            remaining: guestRemaining,
            resetInSeconds: 0,
          });

          if (guestRemaining <= 0) {
            setIsPaywallOpen(true);
          }
          return;
        }

        const serverDeviceCount = data.deviceCount ?? 0;
        const serverAccountCount = data.accountCount ?? 0;
        const deviceRemaining = Math.max(0, DEVICE_DAILY_LIMIT - serverDeviceCount);
        const accountRemaining = Math.max(0, ACCOUNT_DAILY_LIMIT - serverAccountCount);
        const effectiveRemaining = Math.min(deviceRemaining, accountRemaining);

        setUsage(prev => {
          const isStatusChange = prev.isLoggedIn !== isLoggedIn || prev.tier !== 'free';
          const targetRemaining = isStatusChange ? effectiveRemaining : Math.min(prev.remaining, effectiveRemaining);
          const targetCount = isStatusChange ? serverAccountCount : Math.max(prev.count, serverAccountCount);

          return {
            isLoggedIn: true,
            tier: 'free',
            count: targetCount,
            limit: ACCOUNT_DAILY_LIMIT,
            remaining: targetRemaining,
            resetInSeconds: data.resetInSeconds || getUtcMidnightSeconds(),
          };
        });
        return;
      }
    } catch (e) {
      console.warn('Failed to fetch /api/usage from server:', e);
    }

    // Local fallback if offline or server check unavailable
    if (!isLoggedIn || !user) {
      const guestKey = `bifrost_guest_lifetime_${deviceId}`;
      const guestCount = parseInt(localStorage.getItem(guestKey) || '0', 10);
      const guestRemaining = Math.max(0, GUEST_LIFETIME_LIMIT - guestCount);

      setUsage({
        isLoggedIn: false,
        tier: 'logged_out',
        count: guestCount,
        limit: GUEST_LIFETIME_LIMIT,
        remaining: guestRemaining,
        resetInSeconds: 0,
      });

      if (guestRemaining <= 0) {
        setIsPaywallOpen(true);
      }
      return;
    }

    const deviceKey = `bifrost_device_usage_${deviceId}_${today}`;
    const deviceCount = parseInt(localStorage.getItem(deviceKey) || '0', 10);
    const deviceRemaining = Math.max(0, DEVICE_DAILY_LIMIT - deviceCount);

    const userKey = `bifrost_user_usage_${user.id}_${today}`;
    const userCount = parseInt(localStorage.getItem(userKey) || '0', 10);
    const accountRemaining = Math.max(0, ACCOUNT_DAILY_LIMIT - userCount);
    const effectiveRemaining = Math.min(deviceRemaining, accountRemaining);

    setUsage(prev => {
      const isStatusChange = prev.isLoggedIn !== true || prev.tier !== 'free';
      const targetRemaining = isStatusChange ? effectiveRemaining : Math.min(prev.remaining, effectiveRemaining);
      const targetCount = isStatusChange ? userCount : Math.max(prev.count, userCount);
      return {
        isLoggedIn: true,
        tier: 'free',
        count: targetCount,
        limit: ACCOUNT_DAILY_LIMIT,
        remaining: targetRemaining,
        resetInSeconds: getUtcMidnightSeconds(),
      };
    });
  }, [isLoggedIn, user?.id, user?.tier]);

  useEffect(() => {
    syncUsage();

    const interval = setInterval(() => {
      syncUsage();
    }, 60000);

    const handleFocus = () => {
      syncUsage();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('query_usage_updated', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('query_usage_updated', handleFocus);
    };
  }, [syncUsage]);

  const canExecuteQuery = useCallback((): boolean => {
    if (user?.tier === 'paid' || user?.tier === 'pro' || user?.tier === 'unlimited') return true;
    return usage.remaining > 0;
  }, [user?.tier, usage.remaining]);

  /**
   * CONFIRMED FLOW (Bug 1 & 2 Fix Trace):
   * 1. Query Execution: recordQueryExecution() is invoked before/during message dispatch.
   * 2. Synchronous Local Decrement: setUsage immediately decrements local remaining by 1.
   * 3. Guest Lifetime: Guest count is tracked against permanent GUEST_LIFETIME_LIMIT (5).
   * 4. Real-time PostgreSQL device_limits & guest_device_limits write-through via /api/query/track.
   */
  const recordQueryExecution = useCallback((): boolean => {
    if (user?.tier === 'paid' || user?.tier === 'pro' || user?.tier === 'unlimited') return true;

    if (!canExecuteQuery()) {
      setIsPaywallOpen(true);
      return false;
    }

    const deviceId = getOrCreateDeviceId();
    const today = getUtcTodayDate();

    // Guest lifetime increment
    let nextGuestCount = 0;
    if (!isLoggedIn) {
      const guestKey = `bifrost_guest_lifetime_${deviceId}`;
      nextGuestCount = (parseInt(localStorage.getItem(guestKey) || '0', 10) || 0) + 1;
      localStorage.setItem(guestKey, String(nextGuestCount));
    }

    // Synchronous immediate decrement for real-time UI responsiveness
    setUsage(prev => {
      const nextRemaining = Math.max(0, prev.remaining - 1);
      const nextCount = !isLoggedIn ? nextGuestCount : prev.count + 1;
      return {
        ...prev,
        count: nextCount,
        remaining: nextRemaining,
      };
    });

    if (!isLoggedIn && nextGuestCount >= GUEST_LIFETIME_LIMIT) {
      setIsPaywallOpen(true);
    }

    // Broadcast usage change across app listeners
    try {
      window.dispatchEvent(new Event('query_usage_updated'));
    } catch (_) {}

    // Write-through to backend PostgreSQL device_limits immediately
    fetch('/api/query/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ deviceId }),
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();

          if (!isLoggedIn) {
            const serverGuestCount = data.guestLifetimeCount ?? data.count ?? nextGuestCount;
            const guestRemaining = Math.max(0, GUEST_LIFETIME_LIMIT - serverGuestCount);
            setUsage(prev => ({
              ...prev,
              count: serverGuestCount,
              limit: GUEST_LIFETIME_LIMIT,
              remaining: guestRemaining,
            }));
            if (guestRemaining <= 0) {
              setIsPaywallOpen(true);
            }
            return;
          }

          const serverDevCount = data.deviceCount ?? 0;
          const serverAccCount = data.accountCount ?? 0;
          const devRemaining = Math.max(0, DEVICE_DAILY_LIMIT - serverDevCount);
          const accRemaining = Math.max(0, ACCOUNT_DAILY_LIMIT - serverAccCount);
          const effRemaining = Math.min(devRemaining, accRemaining);

          setUsage(prev => ({
            ...prev,
            count: serverAccCount,
            remaining: effRemaining,
          }));

          if (effRemaining <= 0) {
            setIsPaywallOpen(true);
          }
        }
      })
      .catch((e) => {
        console.warn('Backend query tracking request failed:', e);
      });

    // Local storage display cache only
    const deviceKey = `bifrost_device_usage_${deviceId}_${today}`;
    const devCount = (parseInt(localStorage.getItem(deviceKey) || '0', 10) || 0) + 1;
    localStorage.setItem(deviceKey, String(devCount));

    if (isLoggedIn && user) {
      const userKey = `bifrost_user_usage_${user.id}_${today}`;
      const userCount = (parseInt(localStorage.getItem(userKey) || '0', 10) || 0) + 1;
      localStorage.setItem(userKey, String(userCount));
    }

    return true;
  }, [canExecuteQuery, isLoggedIn, user]);

  const triggerPaywall = useCallback(() => {
    setIsPaywallOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setIsPaywallOpen(false);
  }, []);

  return {
    usage,
    canExecuteQuery,
    recordQueryExecution,
    isPaywallOpen,
    triggerPaywall,
    closePaywall,
    refreshUsage: syncUsage,
  };
}
