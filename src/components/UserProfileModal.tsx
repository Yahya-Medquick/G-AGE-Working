import React, { useState } from "react";
import { X, User, History, Settings, Check, Shield, Search, Sparkles, Compass, Smartphone, Download } from "lucide-react";
import { UserProfile } from "../types";
import { useUser } from "../context/UserContext";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentSearches: string[];
  onSelectSearch: (query: string) => void;
  onClearHistory: () => void;
  onOpenDownload?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  recentSearches,
  onSelectSearch,
  onClearHistory,
  onOpenDownload,
}) => {
  const { user, profile, updatePreferences, replayTour } = useUser();
  const [activeTab, setActiveTab] = useState<"profile" | "history" | "preferences">("profile");

  if (!isOpen) return null;

  const isPaid = user?.tier === "paid" || user?.tier === "pro" || user?.tier === "unlimited";

  const handleReplayTourClick = () => {
    onClose();
    setTimeout(() => {
      replayTour();
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-500/20">
              AV
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {profile.name}
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {profile.role}
                </span>
                {isPaid && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs">
                    PRO / UNLIMITED
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{profile.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-xs font-semibold bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "profile"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-4 h-4" /> User Overview
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-4 h-4" /> Search History ({recentSearches.length})
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === "preferences"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Settings className="w-4 h-4" /> Preferences
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50">
          
          {activeTab === "profile" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200">Account Role & Privileges</div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>Full Semantic Search & Entity Registry Access</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Recent Explorations</span>
                {recentSearches.length > 0 && (
                  <button
                    onClick={onClearHistory}
                    className="text-rose-600 dark:text-rose-400 font-semibold hover:underline"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">No search history recorded yet.</div>
              ) : (
                <div className="space-y-2">
                  {recentSearches.map((term, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        onSelectSearch(term);
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 cursor-pointer flex items-center justify-between text-slate-800 dark:text-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="font-medium capitalize">{term}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Execute ↵</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Auto-Expand Synonyms</div>
                    <div className="text-[11px] text-slate-400">Automatically map queries like "gravitation" to entity "Gravity".</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.preferences.autoExpandSynonyms}
                    onChange={(e) =>
                      updatePreferences({ autoExpandSynonyms: e.target.checked })
                    }
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">Compact Result Cards</div>
                    <div className="text-[11px] text-slate-400">Reduce vertical padding on category result cards.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.preferences.compactView}
                    onChange={(e) =>
                      updatePreferences({ compactView: e.target.checked })
                    }
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Guided Product Tour</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Replay the introductory walkthrough of G-AGE features and tools.</div>
                </div>
                <button
                  type="button"
                  onClick={handleReplayTourClick}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Replay Tour
                </button>
              </div>

              {/* Android APK Download Option */}
              {onOpenDownload && (
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Android App (.APK) Package</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Download the official Trusted Web Activity (TWA) self-hosted build.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDownload();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
