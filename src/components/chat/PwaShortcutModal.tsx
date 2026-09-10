import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  Copy,
  Check,
  Download,
  Share2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ExpertPersona } from '../../data/experts';

interface PwaShortcutModalProps {
  persona: ExpertPersona | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDownload?: () => void;
}

export const PwaShortcutModal: React.FC<PwaShortcutModalProps> = ({
  persona,
  isOpen,
  onClose,
  onOpenDownload,
}) => {
  const [copied, setCopied] = useState(false);

  // Set persona URL on open before showing install instructions
  useEffect(() => {
    if (isOpen && persona) {
      const personaKey = persona.slug || persona.id;
      history.replaceState(null, '', `/?persona=${personaKey}`);
    }
  }, [isOpen, persona]);

  const handleClose = () => {
    // Restore original URL when closing modal
    history.replaceState(null, '', '/');
    onClose();
  };

  if (!isOpen || !persona) return null;

  const personaKey = persona.slug || persona.id;
  const directUrl = `${window.location.origin}/?persona=${personaKey}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(directUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
              style={{ backgroundColor: persona.avatar_color }}
            >
              {persona.initials}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add {persona.name} to Desktop
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                1-tap direct launch shortcut
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {/* Active URL Status Banner */}
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-indigo-950 dark:text-indigo-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>Install now while on this URL</span>
            </div>
            <p className="text-[10px] text-indigo-700 dark:text-indigo-300 leading-relaxed">
              The active browser URL is currently configured for <strong>{persona.name}</strong>. Triggering <strong>Install</strong> or <strong>Add to Home Screen</strong> right now saves this specific expert directly to your device.
            </p>
          </div>

          {/* Direct URL Box */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Direct Persona Launch Link
            </label>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                readOnly
                value={directUrl}
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none select-all truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Device Instructions */}
          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Smartphone className="w-4 h-4 text-indigo-500" />
                <span>Mobile (iOS Safari & Android Chrome)</span>
              </div>
              <ol className="list-decimal list-inside text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pl-1">
                <li>Tap the <strong>Share</strong> or <strong>Menu (⋮)</strong> icon in your browser.</li>
                <li>Select <strong>&quot;Add to Home Screen&quot;</strong>.</li>
                <li>Tap <strong>&quot;Add&quot;</strong> to launch {persona.name} anytime as a native app icon.</li>
              </ol>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <Laptop className="w-4 h-4 text-emerald-500" />
                <span>Desktop (Chrome, Edge, Brave)</span>
              </div>
              <ol className="list-decimal list-inside text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pl-1">
                <li>Click the <strong>Install / App icon (⊕)</strong> in the URL address bar.</li>
                <li>Or drag the URL lock icon directly onto your desktop or taskbar dock.</li>
              </ol>
            </div>

            {/* Android APK Alternative Callout */}
            {onOpenDownload && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-950 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Android .APK Package Available</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300">
                    Prefer direct APK installation over browser PWA?
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onOpenDownload();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  Get .APK
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
