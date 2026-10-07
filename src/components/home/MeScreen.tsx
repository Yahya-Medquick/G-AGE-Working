import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Code2,
  Compass,
  Crown,
  FileText,
  HelpCircle,
  type LucideIcon,
  LogOut,
  Moon,
  Shield,
  Smartphone,
  Sun,
  UserRound,
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { uiCopy, type UiLanguage } from '../../i18n/ui';
import { getWhatsAppSupportUrl } from '../../utils/support';

interface MeScreenProps {
  language: UiLanguage;
  theme: 'light' | 'dark';
  onOpenProfile: () => void;
  onOpenClass: () => void;
  onOpenPlan: () => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
  onOpenDownload: () => void;
  onOpenApiDocs: () => void;
  onOpenAdmin: () => void;
  onDeleteAccount: () => Promise<boolean>;
  onAccountDeleted: (localDataCleared: boolean) => void;
}

export function MeScreen({
  language,
  theme,
  onOpenProfile,
  onOpenClass,
  onOpenPlan,
  onOpenSettings,
  onToggleTheme,
  onOpenDownload,
  onOpenApiDocs,
  onOpenAdmin,
  onDeleteAccount,
  onAccountDeleted,
}: MeScreenProps) {
  const { user, logout, replayTour } = useUser();
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const isPaid = user?.tier === 'paid' || user?.tier === 'pro' || user?.tier === 'unlimited';
  const supportUrl = getWhatsAppSupportUrl(uiCopy(language, 'sidebarSupportMessage'));
  const t = (key: Parameters<typeof uiCopy>[1]) => uiCopy(language, key);

  const confirmAccountDeletion = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      const localDataCleared = await onDeleteAccount();
      onAccountDeleted(localDataCleared);
    } catch (error) {
      console.error('Account deletion failed:', error);
      setDeleteError(error instanceof Error ? error.message : t('meDeleteAccountFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const group = (title: string, children: ReactNode) => (
    <section aria-label={title} className="overflow-hidden rounded-tile border border-border bg-surface">
      <h2 className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );

  const item = (
    label: string,
    Icon: LucideIcon,
    onClick?: () => void,
    disabled = false,
    trailing?: string,
  ) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-12 w-full items-center gap-3 px-4 text-start text-sm focus-visible:outline-2 focus-visible:outline-accent ${
        disabled ? 'cursor-not-allowed text-muted' : 'text-text hover:bg-surface-2'
      }`}
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">{label}</span>
      {trailing && <span className="text-xs text-muted">{trailing}</span>}
    </button>
  );

  return (
    <main dir={language === 'urdu' ? 'rtl' : 'ltr'} className="h-full min-w-0 overflow-y-auto bg-bg px-4 py-5 text-text sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 pb-4">
        <header className="flex items-center gap-3 rounded-tile border border-border bg-surface p-4">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-text">
              <UserRound aria-hidden="true" className="h-5 w-5" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-base font-semibold">{user?.name || user?.username || t('sidebarProfile')}</span>
            <span className="block truncate text-sm text-muted">{user?.email || user?.username || ''}</span>
          </span>
          <span className="rounded-pill bg-surface-2 px-2.5 py-1 text-xs font-semibold">
            {t(isPaid ? 'sidebarTierPro' : 'sidebarTierFree')}
          </span>
        </header>

        {group(t('meAccount'), <>
          {item(t('sidebarProfile'), UserRound, onOpenProfile)}
          {item(t('sidebarClass'), BookOpen, onOpenClass)}
          {item(t('sidebarPlanUsage'), Crown, onOpenPlan)}
        </>)}

        {group(t('meStudy'), <>
          {item(t('sidebarPractice'), FileText, undefined, true, t('sidebarNotReady'))}
          {item(t('sidebarProgress'), BarChart3, undefined, true, t('sidebarNotReady'))}
        </>)}

        {group(t('meSettings'), <>
          {item(t('sidebarSettings'), BookOpen, onOpenSettings)}
          {item(t('sidebarNightMode'), theme === 'dark' ? Sun : Moon, onToggleTheme)}
        </>)}

        {group(t('meApp'), <>
          {item(t('sidebarInstallApp'), Smartphone, onOpenDownload)}
          {item(t('sidebarTour'), Compass, replayTour)}
        </>)}

        {group(t('meHelp'), <>
          {supportUrl ? (
            <a href={supportUrl} target="_blank" rel="noreferrer" className="flex min-h-12 items-center gap-3 px-4 text-sm text-text hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent">
              <HelpCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span>{t('sidebarSupport')}</span>
            </a>
          ) : item(t('sidebarSupportMissing'), HelpCircle, undefined, true)}
          {item(t('sidebarPrivacy'), Shield, undefined, true, t('sidebarNotReady'))}
          {item(t('sidebarTerms'), FileText, undefined, true, t('sidebarNotReady'))}
        </>)}

        {group(t('meDevelopers'), item(t('sidebarDeveloperApi'), Code2, onOpenApiDocs))}

        {group(t('meSafety'), <>
          {item(t('meExportData'), FileText, undefined, true, t('sidebarNotReady'))}
          {deleteStep === 0 ? item(t('meDeleteAccount'), Shield, () => {
            setDeleteError('');
            setDeleteStep(1);
          }) : (
            <div role="group" aria-label={t('meDeleteAccount')} className="space-y-3 p-4">
              {deleteStep === 1 ? (
                <>
                  <p className="text-sm text-danger">{t('meDeleteAccountWarning')}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setDeleteStep(2)} className="min-h-11 rounded-control bg-danger px-3 text-on-accent">
                      {t('meDeleteAccountContinue')}
                    </button>
                    <button type="button" onClick={() => setDeleteStep(0)} className="min-h-11 rounded-control px-3 text-muted hover:bg-surface-2">
                      {t('meDeleteAccountCancel')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <label htmlFor="delete-account-confirmation" className="block text-sm text-text">{t('meDeleteAccountPrompt')}</label>
                  <input
                    id="delete-account-confirmation"
                    type="text"
                    autoComplete="off"
                    value={deletePhrase}
                    onChange={(event) => setDeletePhrase(event.target.value)}
                    className="min-h-11 w-full rounded-control border border-border bg-surface px-3 text-base text-text focus-visible:outline-2 focus-visible:outline-accent"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void confirmAccountDeletion()}
                      disabled={deletePhrase !== 'DELETE' || isDeleting}
                      className="min-h-11 rounded-control bg-danger px-3 text-on-accent disabled:opacity-50"
                    >
                      {isDeleting ? t('meDeleteAccountWorking') : t('meDeleteAccountConfirm')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteStep(0);
                        setDeletePhrase('');
                      }}
                      disabled={isDeleting}
                      className="min-h-11 rounded-control px-3 text-muted hover:bg-surface-2"
                    >
                      {t('meDeleteAccountCancel')}
                    </button>
                  </div>
                </>
              )}
              {deleteError && <p role="alert" className="text-sm text-danger">{deleteError}</p>}
            </div>
          )}
          {item(t('sidebarSignOut'), LogOut, () => void logout())}
        </>)}

        {group(t('meAdmin'), item(t('sidebarAdmin'), Crown, onOpenAdmin))}
      </div>
    </main>
  );
}
