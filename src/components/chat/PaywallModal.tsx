import React, { useState } from 'react';
import { X, MessageCircle, Moon, UserPlus } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { getWhatsAppSupportUrl } from '../../utils/support';
import { uiCopy, type UiLanguage } from '../../i18n/ui';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  queryUsage?: {
    count: number;
    limit: number;
    remaining: number;
    tier: string;
    isLoggedIn: boolean;
  };
  onOpenLogin?: () => void;
  language?: UiLanguage;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  queryUsage,
  onOpenLogin,
  language = 'english',
}) => {
  const { user, profile, isLoggedIn } = useUser();
  const [supportUnavailable, setSupportUnavailable] = useState(false);

  if (!isOpen) return null;

  const isGuest = !isLoggedIn;

  const handleGetUnlimitedAccess = () => {
    setSupportUnavailable(false);
    const currentUsername = user?.username || profile?.username || user?.name || profile?.name || 'Guest';
    const url = getWhatsAppSupportUrl(`I would like to ask about available study plans. My username is: ${currentUsername}`);
    if (!url) {
      setSupportUnavailable(true);
      return;
    }
    window.open(url, '_blank');
  };

  const handleSignUp = () => {
    onClose();
    onOpenLogin?.();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center flex flex-col items-center"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
          <Moon className="w-6 h-6" />
        </div>

        {isGuest ? (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {uiCopy(language, 'guestLimitTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed max-w-sm">
              {uiCopy(language, 'guestLimitDescription')}
            </p>
            {queryUsage && (
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
                {queryUsage.remaining} / {queryUsage.limit} {uiCopy(language, 'queriesRemaining')}
              </p>
            )}
            <div className="w-full space-y-2.5">
              <button
                onClick={handleSignUp}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.99]"
              >
                <UserPlus className="w-4 h-4" />
                <span>{uiCopy(language, 'createAccount')}</span>
              </button>
              <button
                onClick={handleGetUnlimitedAccess}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.99]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{uiCopy(language, 'askAboutPlans')}</span>
              </button>
              {supportUnavailable && (
                <p role="alert" className="text-sm text-danger">{uiCopy(language, 'supportUnavailable')}</p>
              )}
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                {uiCopy(language, 'maybeLater')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {uiCopy(language, 'accountLimitTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed max-w-sm">
              {uiCopy(language, 'accountLimitDescription')}
            </p>
            {queryUsage && (
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
                {queryUsage.remaining} / {queryUsage.limit} {uiCopy(language, 'queriesRemaining')}
              </p>
            )}
            <div className="w-full space-y-2.5">
              <button
                onClick={handleGetUnlimitedAccess}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.99]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{uiCopy(language, 'askAboutPlans')}</span>
              </button>
              {supportUnavailable && (
                <p role="alert" className="text-sm text-danger">{uiCopy(language, 'supportUnavailable')}</p>
              )}
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                {uiCopy(language, 'tryAgainLater')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
