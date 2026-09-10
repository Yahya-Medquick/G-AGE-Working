import React, { useState, useEffect } from "react";
import { HistoryItem, CategoryType } from "../types";
import { fetchHistory, updateHistoryItem, deleteHistoryItem, clearHistory } from "../services/api";
import { useUser } from "../context/UserContext";
import { History, Pin, Star, Trash2, Search, ArrowUp, ArrowDown, LogIn, Sparkles, Filter, RefreshCw, Clock } from "lucide-react";

interface HistoryViewerProps {
  onSelectSearch: (query: string, category: CategoryType) => void;
  onOpenLogin: () => void;
}

export const HistoryViewer: React.FC<HistoryViewerProps> = ({
  onSelectSearch,
  onOpenLogin,
}) => {
  const { isLoggedIn, user } = useUser();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const loadHistory = async () => {
    if (!isLoggedIn) return;
    setIsLoading(true);
    try {
      const items = await fetchHistory();
      setHistory(items);
    } catch (err) {
      console.warn("Failed to load history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadHistory();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-6 max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
          <History className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-xl">
            Search History Locked
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Sign in with your Google account to automatically persist, pin, star, and manage your search history across devices.
          </p>
        </div>
        <button
          onClick={onOpenLogin}
          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign in with Google</span>
        </button>
      </div>
    );
  }

  const handleTogglePin = async (item: HistoryItem) => {
    const nextPinned = !item.isPinned;
    setHistory((prev) =>
      prev.map((h) => (h.id === item.id ? { ...h, isPinned: nextPinned } : h))
    );
    await updateHistoryItem(item.id, { isPinned: nextPinned });
  };

  const handleToggleStar = async (item: HistoryItem) => {
    const nextStarred = !item.isStarred;
    setHistory((prev) =>
      prev.map((h) => (h.id === item.id ? { ...h, isStarred: nextStarred } : h))
    );
    await updateHistoryItem(item.id, { isStarred: nextStarred });
  };

  const handleDeleteItem = async (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    await deleteHistoryItem(id);
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear your entire search history?")) {
      setHistory([]);
      await clearHistory();
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= history.length) return;

    const newHistory = [...history];
    const temp = newHistory[index];
    newHistory[index] = newHistory[targetIndex];
    newHistory[targetIndex] = temp;

    // Update display orders
    newHistory[index].displayOrder = index;
    newHistory[targetIndex].displayOrder = targetIndex;

    setHistory(newHistory);
    await updateHistoryItem(newHistory[index].id, { displayOrder: index });
    await updateHistoryItem(newHistory[targetIndex].id, { displayOrder: targetIndex });
  };

  const filteredHistory = history.filter((item) => {
    if (filterStarredOnly && !item.isStarred) return false;
    if (searchFilter.trim() && !item.query.toLowerCase().includes(searchFilter.toLowerCase().trim())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg sm:text-xl text-white">
                Search History & Saved Queries
              </h2>
              <p className="text-xs text-indigo-200">
                Logged in as <span className="font-bold text-white">{user?.email}</span>
              </p>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search in History */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-indigo-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter search history..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-indigo-300/60 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Toggle Starred Filter */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStarredOnly(!filterStarredOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filterStarredOnly
                  ? "bg-amber-500 text-white shadow-md"
                  : "bg-white/10 border border-white/20 text-indigo-200 hover:text-white"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${filterStarredOnly ? "fill-white" : ""}`} />
              <span>Starred Only</span>
            </button>

            <button
              onClick={loadHistory}
              className="p-2 rounded-xl bg-white/10 border border-white/20 text-indigo-200 hover:text-white text-xs transition-colors cursor-pointer"
              title="Refresh History"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* History Items List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
          <p>Loading your search history...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-900 dark:text-white text-base">
            No history records found
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {filterStarredOnly
              ? "You haven't starred any searches yet. Star searches in your history to keep them easily accessible."
              : "As you search topics across G-AGE AI tabs, your queries will automatically record here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item, index) => (
            <div
              key={item.id}
              className={`group p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                item.isPinned
                  ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 shadow-xs"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Left side: query + badge + date */}
              <div
                onClick={() => onSelectSearch(item.query, item.category)}
                className="flex-1 min-w-0 cursor-pointer space-y-1"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {item.isPinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                      <Pin className="w-2.5 h-2.5" /> Pinned
                    </span>
                  )}
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-white text-base hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate">
                  {item.query}
                </h4>
              </div>

              {/* Right side: Actions (Pin, Star, Reorder, Delete) */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Reorder Up/Down */}
                <div className="hidden sm:flex flex-col gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleMoveOrder(index, "up")}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleMoveOrder(index, "down")}
                    disabled={index === filteredHistory.length - 1}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>

                {/* Star Button */}
                <button
                  onClick={() => handleToggleStar(item)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    item.isStarred
                      ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-500"
                      : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                  title={item.isStarred ? "Unstar search" : "Star search"}
                >
                  <Star className={`w-4 h-4 ${item.isStarred ? "fill-amber-500" : ""}`} />
                </button>

                {/* Pin Button */}
                <button
                  onClick={() => handleTogglePin(item)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    item.isPinned
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                  title={item.isPinned ? "Unpin search" : "Pin search to top"}
                >
                  <Pin className="w-4 h-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:border-rose-200 transition-colors cursor-pointer"
                  title="Delete from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
