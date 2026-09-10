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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand Wordmark - Minimalist & Direct */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:bg-indigo-500 transition-colors">
            <Compass className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
            G-AGE <span className="text-indigo-600 dark:text-indigo-400 font-normal">AI</span>
          </span>
          <span className="hidden xl:inline-block text-[11px] font-medium text-slate-400 dark:text-slate-500 ml-1.5 pl-2.5 border-l border-slate-200 dark:border-slate-800">
            The Next Age of Knowledge &amp; Intelligence
          </span>
        </div>

        {/* Current Query Badge if exploring */}
        {currentQuery && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
            <span className="text-slate-400 font-normal">Exploring:</span>
            <span className="font-medium text-slate-900 dark:text-white max-w-[200px] truncate">
              {currentQuery}
            </span>
          </div>
        )}

        {/* Minimal Actions Bar */}
        <div className="flex items-center gap-1.5">
          {/* Research/Learning Mode Segment Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 text-xs mr-1">
            <button
              onClick={() => mode !== "research" && toggleMode()}
              className={`px-2.5 py-1 rounded-md font-bold transition-all duration-150 flex items-center gap-1 cursor-pointer select-none ${
                mode === "research"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border-b border-indigo-200/10"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <span>🔬</span>
              <span className="hidden sm:inline">Research</span>
            </button>
            <button
              onClick={() => mode !== "learning" && toggleMode()}
              className={`px-2.5 py-1 rounded-md font-bold transition-all duration-150 flex items-center gap-1 cursor-pointer select-none ${
                mode === "learning"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border-b border-indigo-200/10"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* API Docs Button */}
          {onOpenApiDocs && (
            <button
              onClick={onOpenApiDocs}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="API Reference"
            >
              <Code2 className="w-3.5 h-3.5 text-purple-500" />
              <span className="hidden sm:inline">API</span>
            </button>
          )}

          {/* Admin Button */}
          <button
            onClick={onOpenAdmin}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center gap-1.5 text-xs font-medium"
            title="System Admin"
          >
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          {/* User Profile or Sign In */}
          {isLoggedIn && user ? (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <img
                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt={user.name}
                  className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700 object-cover"
                />
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Minimal Dropdown */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-1.5 space-y-0.5 z-50 animate-in fade-in duration-100">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onSelectCategory) onSelectCategory("history");
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Search History</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>Account Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
