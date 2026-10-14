import React, { useState } from "react";
import { X, User, History, Settings, Check, Shield, Search, Sparkles, Compass, Smartphone, Download } from "lucide-react";
import { UserProfile } from "../types";
import { useUser } from "../context/UserContext";
import { ProExpiryBadge } from "./ProExpiryBadge";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1612]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] rounded-[20px] w-full max-w-2xl overflow-hidden text-[#10231C] dark:text-[#E8F2EC]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D5E0D8] dark:border-[#27403A] flex items-center justify-between bg-[#F3F6F1] dark:bg-[#0B1612]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0A5C45] dark:bg-[#0F8056] text-white font-bold flex items-center justify-center text-sm">
              AV
            </div>
            <div>
              <h2 className="text-base font-bold text-[#10231C] dark:text-[#E8F2EC] flex items-center gap-2">
                {profile.name}
                <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-[10px] bg-[#DDEFE6] dark:bg-[#17352A] text-[#0A5C45] dark:text-[#5BE0A5] border border-[#0A5C45]/20">
                  {profile.role}
                </span>
                {isPaid && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-[10px] text-xs font-extrabold bg-[#FFF3CC] dark:bg-[#3A2F0B] text-[#F4B400] border border-[#F4B400]/40">
                    PRO / UNLIMITED
                  </span>
                )}
                {isPaid && <ProExpiryBadge />}
              </h2>
              <p className="text-xs text-[#4F6359] dark:text-[#9DB5A8]">{profile.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 rounded-[14px] text-[#4F6359] hover:text-[#10231C] dark:text-[#9DB5A8] dark:hover:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] transition-colors cursor-pointer flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-[#D5E0D8] dark:border-[#27403A] flex items-center gap-6 text-xs font-semibold bg-[#FFFFFF] dark:bg-[#12231C]">
          <button
            onClick={() => setActiveTab("profile")}
            className={`min-h-[44px] py-3 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "profile"
                ? "border-[#0A5C45] text-[#0A5C45] dark:border-[#5BE0A5] dark:text-[#5BE0A5] font-bold"
                : "border-transparent text-[#4F6359] dark:text-[#9DB5A8] hover:text-[#10231C] dark:hover:text-[#E8F2EC]"
            }`}
          >
            <User className="w-4 h-4" /> User Overview
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`min-h-[44px] py-3 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "history"
                ? "border-[#0A5C45] text-[#0A5C45] dark:border-[#5BE0A5] dark:text-[#5BE0A5] font-bold"
                : "border-transparent text-[#4F6359] dark:text-[#9DB5A8] hover:text-[#10231C] dark:hover:text-[#E8F2EC]"
            }`}
          >
            <History className="w-4 h-4" /> Search History ({recentSearches.length})
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`min-h-[44px] py-3 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === "preferences"
                ? "border-[#0A5C45] text-[#0A5C45] dark:border-[#5BE0A5] dark:text-[#5BE0A5] font-bold"
                : "border-transparent text-[#4F6359] dark:text-[#9DB5A8] hover:text-[#10231C] dark:hover:text-[#E8F2EC]"
            }`}
          >
            <Settings className="w-4 h-4" /> Preferences
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-[#F3F6F1]/50 dark:bg-[#0B1612]/50">
          
          {activeTab === "profile" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-[14px] bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] space-y-2">
                <div className="font-bold text-[#10231C] dark:text-[#E8F2EC]">Account Role &amp; Privileges</div>
                <div className="flex items-center gap-2 text-[#4F6359] dark:text-[#9DB5A8]">
                  <Shield className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5]" />
                  <span>Full Semantic Search &amp; Entity Registry Access</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#10231C] dark:text-[#E8F2EC]">Recent Explorations</span>
                {recentSearches.length > 0 && (
                  <button
                    onClick={onClearHistory}
                    className="min-h-[44px] px-2 text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer flex items-center"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {recentSearches.length === 0 ? (
                <div className="p-8 text-center text-[#4F6359] dark:text-[#9DB5A8] italic">No search history recorded yet.</div>
              ) : (
                <div className="space-y-2">
                  {recentSearches.map((term, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        onSelectSearch(term);
                        onClose();
                      }}
                      className="min-h-[44px] p-3 rounded-[14px] bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] hover:border-[#0A5C45] dark:hover:border-[#5BE0A5] cursor-pointer flex items-center justify-between text-[#10231C] dark:text-[#E8F2EC] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="w-3.5 h-3.5 text-[#0A5C45] dark:text-[#5BE0A5]" />
                        <span className="font-medium capitalize">{term}</span>
                      </div>
                      <span className="text-xs text-[#4F6359] dark:text-[#9DB5A8] font-mono">Execute ↵</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-[14px] bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#10231C] dark:text-[#E8F2EC]">Auto-Expand Synonyms</div>
                    <div className="text-xs text-[#4F6359] dark:text-[#9DB5A8]">Automatically map queries like &quot;gravitation&quot; to entity &quot;Gravity&quot;.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.preferences.autoExpandSynonyms}
                    onChange={(e) =>
                      updatePreferences({ autoExpandSynonyms: e.target.checked })
                    }
                    className="w-5 h-5 accent-[#0A5C45] cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-[14px] bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#10231C] dark:text-[#E8F2EC]">Compact Result Cards</div>
                    <div className="text-xs text-[#4F6359] dark:text-[#9DB5A8]">Reduce vertical padding on category result cards.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.preferences.compactView}
                    onChange={(e) =>
                      updatePreferences({ compactView: e.target.checked })
                    }
                    className="w-5 h-5 accent-[#0A5C45] cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-[14px] bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#10231C] dark:text-[#E8F2EC] flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5]" />
                    <span>Guided Product Tour</span>
                  </div>
                  <div className="text-xs text-[#4F6359] dark:text-[#9DB5A8]">Replay the introductory walkthrough of G-AGE features and tools.</div>
                </div>
                <button
                  type="button"
                  onClick={handleReplayTourClick}
                  className="min-h-[44px] px-4 py-2 rounded-[14px] bg-[#0A5C45] dark:bg-[#0F8056] hover:brightness-110 text-white font-bold text-xs transition-colors cursor-pointer shrink-0 border border-[#0A5C45] dark:border-[#0F8056]"
                >
                  Replay Tour
                </button>
              </div>

              {/* Android APK Download Option */}
              {onOpenDownload && (
                <div className="p-4 rounded-[14px] bg-[#DDEFE6]/50 dark:bg-[#17352A]/50 border border-[#0A5C45]/20 dark:border-[#27403A] flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#10231C] dark:text-[#E8F2EC] flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5]" />
                      <span>Android App (.APK) Package</span>
                    </div>
                    <div className="text-xs text-[#4F6359] dark:text-[#9DB5A8]">
                      Download the official Trusted Web Activity (TWA) self-hosted build.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDownload();
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-[14px] bg-[#0A5C45] dark:bg-[#0F8056] hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-[#0A5C45] dark:border-[#0F8056]"
                  >
                    <Download className="w-3.5 h-3.5" />
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
