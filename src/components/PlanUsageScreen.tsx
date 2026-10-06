import { useState } from 'react';
import { Crown, MessageCircle, RefreshCw, X } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { appEnvironment } from '../config/env';
import type { QueryUsageState } from '../types/chat';
import { getWhatsAppSupportUrl } from '../utils/support';
import { uiCopy, type UiLanguage } from '../i18n/ui';

interface PlanUsageScreenProps {
  isOpen: boolean;
  onClose: () => void;
  language: UiLanguage;
  usage: QueryUsageState;
  hasData: boolean;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}

export function PlanUsageScreen({
  isOpen,
  onClose,
  language,
  usage,
  hasData,
  isLoading,
  hasError,
  onRetry,
}: PlanUsageScreenProps) {
  const { user } = useUser();
  const [supportUnavailable, setSupportUnavailable] = useState(false);
  const [supportLink, setSupportLink] = useState<string | null>(null);
  const t = (key: Parameters<typeof uiCopy>[1]) => uiCopy(language, key);
  const isPaid = usage.tier === 'paid' || usage.tier === 'pro' || usage.tier === 'unlimited';

  if (!isOpen) return null;

  const startUpgrade = () => {
    const username = user?.username || user?.name || t('usageGuest');
    const context = `${t('usageUpgradeMessage')} ${t('usageUpgradeAccount')}: ${username}. ${t('usageUpgradeTier')}: ${usage.tier}. ${t('usageUpgradeCount')}: ${usage.used}/${usage.limit}.`;
    const url = getWhatsAppSupportUrl(context);
    if (!url) {
      setSupportUnavailable(true);
      setSupportLink(null);
      return;
    }
    setSupportUnavailable(false);
    setSupportLink(null);
    const supportWindow = window.open(url, '_blank');
    if (!supportWindow) {
      setSupportLink(url);
      return;
    }
    supportWindow.opener = null;
    setSupportUnavailable(false);
    setSupportLink(null);
  };

  const usagePercent = usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const locale = language === 'urdu' ? 'ur-PK' : language === 'roman-urdu' ? 'en-PK' : 'en';
  const resetLabel = usage.resetsAt
    ? new Date(usage.resetsAt).toLocaleString(locale)
    : null;
  const daysLeft = usage.proExpiresAt
    ? Math.max(0, Math.ceil((Date.parse(usage.proExpiresAt) - Date.now()) / 86400000))
    : null;
  const tierLabel = usage.tier === 'logged_out'
    ? t('usageGuest')
    : isPaid
      ? t('sidebarTierPro')
      : t('sidebarTierFree');

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-3 sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-usage-title"
        className="flex max-h-[min(92dvh,48rem)] w-full max-w-xl flex-col overflow-hidden rounded-tile border border-border bg-surface text-text shadow-popover"
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <div>
            <h1 id="plan-usage-title" className="text-lg font-semibold">{t('usageTitle')}</h1>
            <p className="text-sm text-muted">{t('usageDescription')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('close')} className="flex h-11 w-11 items-center justify-center rounded-pill text-muted hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
          {hasError && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-danger/30 bg-danger/5 p-3 text-sm">
              <span>{t('usageLoadError')}</span>
              <button type="button" onClick={onRetry} className="inline-flex min-h-10 items-center gap-2 rounded-control px-3 font-semibold text-accent-text hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent">
                <RefreshCw aria-hidden="true" className="h-4 w-4" />{t('retry')}
              </button>
            </div>
          )}

          {isLoading ? (
            <div role="status" aria-label={t('usageLoading')} className="space-y-3">
              <div className="h-24 animate-pulse rounded-tile bg-surface-2 motion-reduce:animate-none" />
              <div className="h-32 animate-pulse rounded-tile bg-surface-2 motion-reduce:animate-none" />
            </div>
          ) : hasData ? (
            <>
              <section className="rounded-tile border border-border bg-bg p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t('usageCurrentTier')}</p>
                    <p className="mt-1 flex items-center gap-2 text-xl font-semibold">
                      {isPaid && <Crown aria-hidden="true" className="h-5 w-5 text-accent-text" />}
                      {tierLabel}
                    </p>
                  </div>
                  <span className="text-end text-sm text-muted">
                    {isPaid
                      ? daysLeft === null ? t('usageExpiryNotProvided') : t('usageDaysLeft').replace('{days}', String(daysLeft))
                      : ''}
                  </span>
                </div>
              </section>

              <section className="space-y-3 rounded-tile border border-border bg-bg p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-sm font-semibold">{t('usageQuestions')}</h2>
                  <p className="text-sm tabular-nums">
                    <strong>{usage.used}</strong> / {usage.limit}
                  </p>
                </div>
                <div
                  role="progressbar"
                  aria-label={t('usageQuestions')}
                  aria-valuemin={0}
                  aria-valuemax={usage.limit}
                  aria-valuenow={Math.min(usage.used, usage.limit)}
                  className="h-2 overflow-hidden rounded-pill bg-surface-2"
                >
                  <div className="h-full rounded-pill bg-accent transition-[width]" style={{ width: `${usagePercent}%` }} />
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-sm text-muted">
                  <span>{usage.remaining} {t('queriesRemaining')}</span>
                  {resetLabel && <span>{t('usageResetsAt')} {resetLabel}</span>}
                </div>
              </section>

              <section className="rounded-tile border border-border bg-bg p-4">
                <h2 className="mb-3 text-sm font-semibold">{t('usageProUnlocks')}</h2>
                <ul className="space-y-2 text-sm text-muted">
                  <li>{t('usageUnlockImages')}</li>
                  <li>{t('usageUnlockAllowance')}</li>
                </ul>
              </section>

              {!isPaid && (
                <div className="space-y-2">
                  <button type="button" onClick={startUpgrade} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-control bg-accent px-4 font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent">
                    <MessageCircle aria-hidden="true" className="h-4 w-4" />
                    {t('usageAskAboutPlans')}
                  </button>
                  {supportUnavailable && <p role="alert" className="text-sm text-danger">{t('supportUnavailable')}</p>}
                  {supportLink && (
                    <a href={supportLink} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center rounded-control border border-border px-3 text-sm font-medium text-accent-text hover:bg-accent-soft">
                      {t('usageOpenWhatsAppDirect')}
                    </a>
                  )}
                  {appEnvironment !== 'production' && <p className="text-center text-xs text-muted">{t('usageStagingNotice')}</p>}
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
