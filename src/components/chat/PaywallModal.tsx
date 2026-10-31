import React, { useEffect, useState } from 'react';
import { X, MessageCircle, Moon, UserPlus } from 'lucide-react';
import { useUser } from '../../context/UserContext';

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
  feature?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin,
  feature = 'Unlimited AI queries',
}) => {
  const { user, profile, isLoggedIn } = useUser();
  const [requestName, setRequestName] = useState('');
  const [requestPhone, setRequestPhone] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setRequestName(user?.name || profile.name || '');
    setRequestPhone(user?.phone || profile.phone || '');
    setRequestMessage('');
    setRequestError('');
    setRequestSent(false);
  }, [isOpen, user?.name, user?.phone, profile.name, profile.phone]);

  if (!isOpen) return null;

  const isGuest = !isLoggedIn;
  const supportPhone = (import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER || '923264397102').replace(/\D/g, '') || '923264397102';
  const supportMessage = encodeURIComponent(`Hi, I have a question about G-AGE Pro. Feature: ${feature}`);
  const whatsappUrl = `https://wa.me/${supportPhone}?text=${supportMessage}`;

  const handleSubmitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setRequestError('');
    try {
      const response = await fetch('/api/pro-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: requestName,
          phone: requestPhone,
          email: user?.email || profile.email || '',
          feature,
          message: requestMessage,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to send your request.');
      setRequestSent(true);
    } catch (error: any) {
      setRequestError(error?.message || 'Unable to send your request.');
    } finally {
      setIsSubmitting(false);
    }
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

        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-900/50 shadow-xs">
          <Moon className="w-6 h-6" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {isGuest ? 'Free Queries Used Up' : 'Daily Limit Reached'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 mb-5 leading-relaxed max-w-sm">
          {isGuest
            ? <>Sign up free to get <span className="font-semibold text-emerald-500">25 queries every day</span>, or request Pro details.</>
            : 'Your daily limit resets at midnight. Send a request to learn about Pro access.'}
        </p>

        <div className="w-full space-y-3 text-left">
          {isGuest && (
            <button
              type="button"
              onClick={handleSignUp}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up Free</span>
            </button>
          )}

          {requestSent ? (
            <p role="status" className="rounded-lg bg-emerald-50 dark:bg-emerald-950/50 p-3 text-sm text-emerald-700 dark:text-emerald-300">
              Request sent. We will contact you soon.
            </p>
          ) : (
            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Feature
                <input value={feature} readOnly className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200" />
              </label>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Name
                <input value={requestName} onChange={(event) => setRequestName(event.target.value)} required minLength={2} maxLength={100} autoComplete="name" className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </label>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Phone
                <input value={requestPhone} onChange={(event) => setRequestPhone(event.target.value)} required maxLength={30} autoComplete="tel" type="tel" className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </label>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                Message <span className="font-normal text-slate-400">(optional)</span>
                <textarea value={requestMessage} onChange={(event) => setRequestMessage(event.target.value)} maxLength={1000} rows={2} className="mt-1 w-full resize-y rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white" />
              </label>
              {requestError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{requestError}</p>}
              <button type="submit" disabled={isSubmitting} className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer">
                {isSubmitting ? 'Sending...' : 'Request Pro'}
              </button>
            </form>
          )}

          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 py-1 text-xs text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400">
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp support
          </a>
        </div>
      </div>
    </div>
  );
};
