import React from 'react';
import { X, MessageCircle, Moon } from 'lucide-react';
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
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, profile } = useUser();

  if (!isOpen) return null;

  const handleGetUnlimitedAccess = () => {
    const rawPhone = import.meta.env.VITE_WHATSAPP_SUPPORT_NUMBER || "923264397102";
    const phone = rawPhone.replace(/\D/g, "") || "923264397102";
    const currentUsername = user?.username || profile?.username || user?.name || profile?.name || 'Guest';
    const message = encodeURIComponent(`Hi, I want to upgrade to G-AGE Pro. My username is: ${currentUsername}`);
    const url = `https://wa.me/${phone}?text=${message}`;
    window.open(url, '_blank');
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

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Daily Limit Reached
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed max-w-sm">
          You have used all your queries for today. Your limit resets at midnight.
        </p>

        <div className="w-full space-y-2.5">
          <button
            onClick={handleGetUnlimitedAccess}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.99]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Get Unlimited Access</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Try Again Tomorrow
          </button>
        </div>
      </div>
    </div>
  );
};

