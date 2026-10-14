import React, { useState } from "react";
import { Moon, Sun, Cpu, Code2, ChevronDown, LogIn, LogOut, History, Shield, Compass } from "lucide-react";
import { useUser } from "../context/UserContext";

interface HeaderProps {
  theme: "dark" | "light";
  toggleTheme: () => void;
  onGoHome: () => void;
  onOpenAdmin: () => void;
  onOpenProfile: () => void;
  onOpenApiDocs?: () => void;
  onOpenLogin: () => void;
  onSelectCategory?: (category: any) => void;
  currentQuery?: string;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  onGoHome,
  onOpenAdmin,
  onOpenProfile,
  onOpenApiDocs,
  onOpenLogin,
  onSelectCategory,
  currentQuery,
}) => {
  const { user, isLoggedIn, logout, mode, toggleMode } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D5E0D8] dark:border-[#27403A] bg-[#FFFFFF]/95 dark:bg-[#12231C]/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Wordmark - Minimalist & Direct */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-2 cursor-pointer select-none group min-h-[44px]"
        >
          <div className="w-8 h-8 rounded-[12px] bg-[#0A5C45] dark:bg-[#0F8056] text-white flex items-center justify-center font-bold text-xs transition-colors">
            <Compass className="w-4 h-4" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-[#10231C] dark:text-[#E8F2EC]">
            G-AGE <span className="text-[#0A5C45] dark:text-[#5BE0A5] font-semibold">AI</span>
          </span>
          <span className="hidden xl:inline-block text-xs font-medium text-[#4F6359] dark:text-[#9DB5A8] ml-1.5 pl-2.5 border-l border-[#D5E0D8] dark:border-[#27403A]">
            The Next Age of Knowledge &amp; Intelligence
          </span>
        </div>

        {/* Current Query Badge if exploring */}
        {currentQuery && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[12px] bg-[#F3F6F1] dark:bg-[#0B1612] border border-[#D5E0D8] dark:border-[#27403A] text-xs text-[#10231C] dark:text-[#E8F2EC] min-h-[44px]">
            <span className="text-[#4F6359] dark:text-[#9DB5A8] font-normal">Exploring:</span>
            <span className="font-medium text-[#10231C] dark:text-[#E8F2EC] max-w-[200px] truncate">
              {currentQuery}
            </span>
          </div>
        )}

        {/* Minimal Actions Bar */}
        <div className="flex items-center gap-1.5">
          {/* Research/Learning Mode Segment Selector */}
          <div className="flex items-center bg-[#F3F6F1] dark:bg-[#0B1612] p-1 rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] text-xs mr-1">
            <button
              onClick={() => mode !== "research" && toggleMode()}
              className={`min-h-[44px] px-3 py-1.5 rounded-[12px] font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none ${
                mode === "research"
                  ? "bg-[#0A5C45] dark:bg-[#0F8056] text-white"
                  : "text-[#4F6359] hover:text-[#10231C] dark:text-[#9DB5A8] dark:hover:text-[#E8F2EC]"
              }`}
            >
              <span>🔬</span>
              <span className="hidden sm:inline">Research</span>
            </button>
            <button
              onClick={() => mode !== "learning" && toggleMode()}
              className={`min-h-[44px] px-3 py-1.5 rounded-[12px] font-bold transition-all duration-150 flex items-center gap-1.5 cursor-pointer select-none ${
                mode === "learning"
                  ? "bg-[#0A5C45] dark:bg-[#0F8056] text-white"
                  : "text-[#4F6359] hover:text-[#10231C] dark:text-[#9DB5A8] dark:hover:text-[#E8F2EC]"
              }`}
            >
              <span>📚</span>
              <span className="hidden sm:inline">Learning</span>
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Dark/Light Mode"
            className="min-h-[44px] min-w-[44px] p-2 rounded-[14px] text-[#4F6359] hover:text-[#10231C] dark:text-[#9DB5A8] dark:hover:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-[#D5E0D8] dark:hover:border-[#27403A]"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-[#F4B400]" /> : <Moon className="w-4 h-4 text-[#10231C]" />}
          </button>

          {/* API Docs Button */}
          {onOpenApiDocs && (
            <button
              onClick={onOpenApiDocs}
              className="min-h-[44px] p-2 sm:px-3 sm:py-2 rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="API Reference"
            >
              <Code2 className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5]" />
              <span className="hidden sm:inline">API</span>
            </button>
          )}

          {/* Admin Button */}
          <button
            onClick={onOpenAdmin}
            className="min-h-[44px] p-2 sm:px-3 sm:py-2 rounded-[14px] border border-[#D5E0D8] dark:border-[#27403A] text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="System Admin"
          >
            <Cpu className="w-4 h-4 text-[#0A5C45] dark:text-[#5BE0A5]" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          {/* User Profile or Sign In */}
          {isLoggedIn && user ? (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="min-h-[44px] flex items-center gap-1.5 p-2 rounded-[14px] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] border border-transparent hover:border-[#D5E0D8] dark:hover:border-[#27403A] transition-colors cursor-pointer"
              >
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt={user.name}
                  className="w-7 h-7 rounded-full border border-[#D5E0D8] dark:border-[#27403A] object-cover"
                />
                <ChevronDown className="w-3.5 h-3.5 text-[#4F6359] dark:text-[#9DB5A8]" />
              </button>

              {/* Minimal Dropdown */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-[20px] bg-[#FFFFFF] dark:bg-[#12231C] border border-[#D5E0D8] dark:border-[#27403A] p-2 space-y-1 z-50 animate-in fade-in duration-100">
                  <div className="px-3 py-2 border-b border-[#D5E0D8] dark:border-[#27403A] mb-1">
                    <p className="text-xs font-bold text-[#10231C] dark:text-[#E8F2EC] truncate">{user.name}</p>
                    <p className="text-xs text-[#4F6359] dark:text-[#9DB5A8] truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onSelectCategory) onSelectCategory("history");
                    }}
                    className="w-full min-h-[44px] px-3 py-2 rounded-[12px] text-left text-xs text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <History className="w-4 h-4 text-[#4F6359] dark:text-[#9DB5A8]" />
                    <span>Search History</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full min-h-[44px] px-3 py-2 rounded-[12px] text-left text-xs text-[#10231C] dark:text-[#E8F2EC] hover:bg-[#DDEFE6] dark:hover:bg-[#17352A] flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-[#4F6359] dark:text-[#9DB5A8]" />
                    <span>Account Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="w-full min-h-[44px] px-3 py-2 rounded-[12px] text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors font-medium cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="min-h-[44px] px-4 py-2 rounded-[14px] bg-[#0A5C45] dark:bg-[#0F8056] hover:brightness-110 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-[#0A5C45] dark:border-[#0F8056]"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
